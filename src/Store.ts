///<reference path="./Column"/>
///<reference path="./Delta"/>
///<reference path="./Database"/>
///<reference path="./Table"/>
///<reference path="./Text"/>
///<reference path="./assign"/>
///<reference path="./verify"/>
"use strict";

namespace Updraft {

	function startsWith(str: string, val: string) {
		return str.lastIndexOf(val, 0) === 0;
	}
	
	export type TableSpecAny = TableSpec<any, any, any>;
	export type TableAny = Table<any, any, any>;
	
	export interface CreateStoreParams {
		db: DbWrapper;
		generateGuid?(): string;
	}
	
	export interface Schema {
		[table: string]: TableSpecAny;
	}
	
	interface Resolver<T> {
		(param: T): void;
	}
	
	interface SqliteMasterRow {
		type: string;
		name: string;
		tbl_name: string;
		sql: string;
	}
	
	interface BaselineInfo<Element> {
		element: Element;
		time: number;
		rowid: number;
	}
	
	interface ChangeTableRow {
		key?: KeyType;
		time?: number;
		change?: string;
	}
	
	interface SetTableRow {
		key?: KeyType;
		time?: number;
		value?: string;
	}

	interface KeyValue {
		key?: string;
		value?: any; // stored as JSON
	}
	
	interface KeyValueMap {
		[key: string]: any;
	}

	const MAX_VARIABLES = 999;
	const ROWID = "rowid";
	const COUNT = "COUNT(*)";
	const internal_prefix = "updraft_";
	const internal_column_deleted = internal_prefix + "deleted";
	const internal_column_time = internal_prefix + "time";
	const internal_column_latest = internal_prefix + "latest";
	const internal_column_composed = internal_prefix + "composed";
	const internalColumn: ColumnSet = {};
	internalColumn[internal_column_deleted] = Column.Bool();
	internalColumn[internal_column_time] = Column.Int().Key();
	internalColumn[internal_column_latest] = Column.Bool();
	internalColumn[internal_column_composed] = Column.Bool();
	const localKey_guid = "guid";
	const localKey_syncId = "syncId";
	
	const deleteRow_action = { [internal_column_deleted]: { $set: true } };
	
	const keyValueTableSpec: TableSpec<KeyValue, any, any> = {
		name: internal_prefix + "keyValues",
		columns: {
			key: Column.String().Key(),
			value: Column.JSON(),
		}
	};

	const localsTableSpec: TableSpec<KeyValue, any, any> = {
		name: internal_prefix + "locals",
		columns: {
			key: Column.String().Key(),
			value: Column.JSON(),
		}
	};
	
	export class Store {
		private params: CreateStoreParams;
		private tables: TableSpecAny[];
		private db: DbWrapper;
		private keyValueTable: Table<KeyValue, any, any>;
		private localsTable: Table<KeyValue, any, any>;
		private guid: string;
		private syncId: number;
		private keyValues: KeyValueMap;
	
		constructor(params: CreateStoreParams) {
			this.params = params;
			this.tables = [];
			this.db = null;
			verify(this.params.db, "must pass a DbWrapper");
			this.localsTable = this.createUntrackedTable<KeyValue, any, any>(localsTableSpec);
			this.keyValueTable = this.createTrackedTable<KeyValue, any, any>(keyValueTableSpec, true);
		}
	
		public createTable<Element, Delta, Query>(tableSpec: TableSpec<Element, Delta, Query>): Table<Element, Delta, Query> {
			return this.createTrackedTable(tableSpec, false);
		}
		
		private createTrackedTable<Element, Delta, Query>(tableSpec: TableSpec<Element, Delta, Query>, internal: boolean): Table<Element, Delta, Query> {
			verify(!this.db, "createTable() can only be added before open()");
			if (!internal) {
				verify(!startsWith(tableSpec.name, internal_prefix), "table name %s cannot begin with %s", tableSpec.name, internal_prefix);
			}
			for (let col in tableSpec.columns) {
				verify(!startsWith(col, internal_prefix), "table %s column %s cannot begin with %s", tableSpec.name, col, internal_prefix);
			}
			let table = this.createTableObject(tableSpec);
			this.tables.push(...createInternalTableSpecs(table));
			this.tables.push(createChangeTableSpec(table));
			return table;
		}

		private createUntrackedTable<Element, Delta, Query>(tableSpec: TableSpec<Element, Delta, Query>): Table<Element, Delta, Query> {
			buildIndices(tableSpec);
			let table = this.createTableObject<Element, any, any>(tableSpec);
			this.tables.push(tableSpec);
			return table;
		}
		
		private createTableObject<Element, Delta, Query>(tableSpec: TableSpec<Element, Delta, Query>): Table<Element, Delta, Query> {
			let table = new Table<Element, Delta, Query>(tableSpec);
			table.add = (...changes: TableChange<Element, Delta>[]): Promise<any> => {
				changes.forEach(change => change.table = table);
				return this.add(...changes);
			};
			table.find = (queryArg: Query | Query[], opts?: FindOpts): Promise<Element[] | number> => {
				return this.find(table, queryArg, opts);
			};
			return table;
		}
	
		public open(): Promise<any> {
			verify(!this.db, "open() called more than once!");
			verify(this.tables.length, "open() called before any tables were added");
	
			this.db = this.params.db;
	
			return Promise.resolve()
				.then(() => this.readSchema())
				.then((schema) => {
					return new Promise((resolve, reject) => {
						let i = 0;
						let act = (transaction: DbTransaction) => {
							if (i < this.tables.length) {
								let table = this.tables[i];
								i++;
								this.syncTable(transaction, schema, table, act);
							}
							else {
								this.loadLocals(transaction, () => {
									this.loadKeyValues(transaction, () => {
										transaction.commit(resolve);
									});
								});
							}
						};
						this.db.transaction(act, reject);
					});
				})
				;
		}
	
		public readSchema(): Promise<Schema> {
			verify(this.db, "readSchema(): not opened");
			
			return new Promise((resolve: Resolver<Schema>, reject: DbErrorCallback) => {
				this.db.readTransaction((transaction: DbTransaction) => {
					return transaction.executeSql("SELECT name, tbl_name, type, sql FROM sqlite_master", [], (tx: DbTransaction, resultSet: any[]) => {
						let schema: Schema = {};
						for (let i = 0; i < resultSet.length; i++) {
							let row = <SqliteMasterRow>resultSet[i];
							if (row.name[0] != "_" && !startsWith(row.name, "sqlite")) {
								switch (row.type) {
									case "table":
										schema[row.name] = tableFromSql(row.name, row.sql);
										break;
									case "index":
										let index = indexFromSql(row.sql);
										if (index.length == 1) {
											let col = index[0];
											verify(row.tbl_name in schema, "table %s used by index %s should have been returned first", row.tbl_name, row.name);
											verify(col in schema[row.tbl_name].columns, "table %s does not have column %s used by index %s", row.tbl_name, col, row.name);
											schema[row.tbl_name].columns[col].isIndex = true;
										}
										else {
											schema[row.tbl_name].indices.push(index);
										}
										break;
									// case "trigger":
									// 	break;
								}
							}
						}
		
						transaction.commit(() => resolve(schema));
					});
				}, reject);
			});
		}

		private syncTable(transaction: DbTransaction, schema: Schema, spec: TableSpecAny, nextCallback: DbTransactionCallback): void {
			if (spec.name in schema) {
				let oldColumns = schema[spec.name].columns;
				let newColumns = spec.columns;
				let recreateTable: boolean = false;
	
				for (let colName in oldColumns) {
					if (!(colName in newColumns)) {
						recreateTable = true;
						break;
					}
	
					let oldCol = oldColumns[colName];
					let newCol = newColumns[colName];
					if (!Column.equal(oldCol, newCol)) {
						recreateTable = true;
						break;
					}
				}
	
				let renamedColumns = shallowCopy(spec.renamedColumns) || {};
				for (let colName in renamedColumns) {
					if (colName in oldColumns) {
						recreateTable = true;
					}
					else {
						delete renamedColumns[colName];
					}
				}
	
				let addedColumns: ColumnSet = {};
				if (!recreateTable) {
					for (let colName of selectableColumns(spec, newColumns)) {
						if (!(colName in oldColumns)) {
							addedColumns[colName] = newColumns[colName];
						}
					}
				}
	
				if (recreateTable) {
					// recreate and migrate data
	
					let tempTableName = "temp_" + spec.name;
					let changeTableName = getChangeTableName(spec.name);
	
					dropTable(transaction, tempTableName, (tx2: DbTransaction) => {
						createTable(tx2, tempTableName, spec.columns, (tx3: DbTransaction) => {
							copyData(tx3, spec.name, tempTableName, oldColumns, newColumns, renamedColumns, (tx4: DbTransaction) => {
								dropTable(tx4, spec.name, (tx5: DbTransaction) => {
									renameTable(tx5, tempTableName, spec.name, (tx6: DbTransaction) => {
										migrateChangeTable(tx6, changeTableName, oldColumns, newColumns, renamedColumns, (tx7: DbTransaction) => {
											createIndices(tx7, schema, spec, true, nextCallback);
										});
									});
								});
							});
						});
					});
				}
				else if (!isEmpty(addedColumns)) {
					// alter table, add columns
					let stmts: DbStatement[] = [];
					Object.keys(addedColumns).forEach((colName) => {
						let col: Column = spec.columns[colName];
						let columnDecl = colName + " " + Column.sql(col);
						stmts.push({sql: "ALTER TABLE " + spec.name + " ADD COLUMN " + columnDecl});
					});
					
					DbExecuteSequence(transaction, stmts, (tx2: DbTransaction) => {
						createIndices(tx2, schema, spec, false, nextCallback);
					});
				}
				else {
					// no table modification is required
					createIndices(transaction, schema, spec, false, nextCallback);
				}
			}
			else {
				// create new table
				createTable(transaction, spec.name, spec.columns, (tx2: DbTransaction) => {
					createIndices(tx2, schema, spec, true, nextCallback);
				});
			}
		}
		
		private loadLocals(transaction: DbTransaction, nextCallback: DbTransactionCallback): void {
			transaction.executeSql("SELECT key, value FROM " + this.localsTable.spec.name, [], (tx2: DbTransaction, rows: KeyValue[]) => {
				rows.forEach((row: KeyValue) => {
					switch (row.key) {
						case localKey_guid:
							this.guid = row.value;
							break;
						case localKey_syncId:
							this.syncId = row.value;
							break;
						/* istanbul ignore next */
						default:
							verify(false, "unknown key %s in %s", row.key, this.localsTable.spec.name);
					}
				});

				const initGuid = (tx: DbTransaction, next: DbTransactionCallback) => {
					if (!this.guid && this.params.generateGuid) {
						const guid = this.params.generateGuid();
						this.saveLocal(tx, localKey_guid, guid, next);
					}
					else {
						next(tx);
					}
				};
				
				const initSyncId = (tx: DbTransaction, next: DbTransactionCallback) => {
					if (!this.syncId) {
						const syncId = 100;
						this.saveLocal(tx, localKey_syncId, syncId, next);
					}
					else {
						next(tx);
					}
				};
				
				initGuid(tx2, (tx3) => {
					initSyncId(tx3, nextCallback);
				});
			});
		}

		private saveLocal(transaction: DbTransaction, key: string, value: any, nextCallback: DbTransactionCallback): void {
			let sql: string = "INSERT INTO " + this.localsTable.spec.name + " (key, value) VALUES (?, ?)"; 
			transaction.executeSql(sql, [key, value], nextCallback);
		}
		
		private loadKeyValues(transaction: DbTransaction, nextCallback: DbTransactionCallback): void {
			return runQuery(transaction, this.keyValueTable, {}, undefined, undefined, (tx2: DbTransaction, rows: KeyValue[]) => {
				this.keyValues = {};
				rows.forEach((row: KeyValue) => {
					this.keyValues[row.key] = row.value;
				});
				nextCallback(tx2);
			});
		}

		public getValue(key: string): any {
			return this.keyValues[key];
		}
		
		public setValue(key: string, value: any): Promise<any> {
			this.keyValues[key] = value;
			return this.keyValueTable.add({create: {key, value}});
		}
	
		public add(...changes: TableChange<any, any>[]): Promise<any> {
			verify(this.db, "apply(): not opened");
			
			interface ResolveKey {
				table: TableAny;
				key: KeyType;
			}

			interface TableKeySet {
				table: TableAny;
				keysArray: Set<KeyType>[];
				allKeys: Set<KeyType>;
				duplicateKeys: Set<KeyType>;
				existingKeys: Set<KeyType>;
			}

			return new Promise((promiseResolve, reject) => {
				const tableKeySet: TableKeySet[] = [];
				changes.forEach(change => {
					if (change.create) {
						const key = change.table.keyValue(change.create);
						let keys: Set<KeyType> = null;
						let duplicateKeys: Set<KeyType> = null;
						let allKeys: Set<KeyType> = null;
						for (let j = 0; j < tableKeySet.length; j++) {
							/* istanbul ignore else */
							if (tableKeySet[j].table === change.table) {
								duplicateKeys = tableKeySet[j].duplicateKeys;
								allKeys = tableKeySet[j].allKeys;
								for (let k = 0; k < tableKeySet[j].keysArray.length; k++) {
									let kk = tableKeySet[j].keysArray[k];
									if (kk.size < MAX_VARIABLES) {
										keys = kk;
										break;
									}
								}
								if (!keys) {
									keys = new Set<KeyType>();
									tableKeySet[j].keysArray.push(keys);
								}
								break;
							}
						}
						if (keys == null) {
							keys = new Set<KeyType>();
							duplicateKeys = new Set<KeyType>();
							allKeys = new Set<KeyType>();
							tableKeySet.push({ table: change.table, keysArray: [keys], allKeys, duplicateKeys, existingKeys: new Set<KeyType>() });
						}
						if (allKeys.has(key)) {
							duplicateKeys.add(key);
						}
						allKeys.add(key);
						keys.add(key);
					}
				});
				let findIdx = 0;
				let findBatchIdx = 0;
 				let changeIdx = 0;
				let toResolve = new Set<ResolveKey>();
				let findExistingIds: DbTransactionCallback = null;
				let insertNextChange: DbTransactionCallback = null;
				let resolveChanges: DbTransactionCallback = null;

				findExistingIds = (transaction: DbTransaction) => {
					if (findIdx < tableKeySet.length) {
						const table = tableKeySet[findIdx].table;
						const keysArray = tableKeySet[findIdx].keysArray;
						const duplicateKeys = tableKeySet[findIdx].duplicateKeys;
						const existingKeys = tableKeySet[findIdx].existingKeys;
						const notDuplicatedValues: KeyValue[] = [];
						keysArray[findBatchIdx].forEach(key => {
							if (!duplicateKeys.has(key)) {
								notDuplicatedValues.push(key);
							}
						});
						const query: any = { [table.key]: { $in: notDuplicatedValues } };
						const opts: FindOpts = { fields: { [table.key]: true } };
						runQuery(transaction, table, query, opts, null, (tx: DbTransaction, rows: any[]) => {
							for (let row of rows) {
								existingKeys.add(row[table.key]);
							}

							findBatchIdx++;
							if (findBatchIdx >= keysArray.length) {
								findIdx++;
								findBatchIdx = 0;
							}
							findExistingIds(transaction);
						});
					}
					else {
						insertNextChange(transaction);
					}
				};

				insertNextChange = (transaction: DbTransaction) => {
					if (changeIdx < changes.length) {
						let change = changes[changeIdx];
						changeIdx++;
						const table = change.table;
						verify(table, "change must specify table");
						let changeTable = getChangeTableName(table.spec.name);
						let time = change.time || Date.now();
						verify((change.create ? 1 : 0) + (change.update ? 1 : 0) + (change.delete ? 1 : 0) === 1, "change (%s) must specify exactly one action at a time", change);
						let existingKeys: Set<KeyType> = null;
						tableKeySet.some((tk): boolean => {
							/* istanbul ignore else */
							if (tk.table === table) {
								existingKeys = tk.existingKeys;
								return true;
							}
							else {
								return false;
							}
						});

						if (change.create) {
							// append internal column values
							let element = assign(
								{},
								change.create,
								{ [internal_column_time]: time }
							);
						 const key = table.keyValue(element);
						 // optimization: don't resolve elements that aren't already in the db- just mark them as latest
							if (existingKeys.has(key)) {
								toResolve.add({ table, key });
							}
							else {
								element[internal_column_latest] = true;
							}
							insertElement(transaction, table, element, insertNextChange);
						}

						if (change.update || change.delete) {
							let changeRow: ChangeTableRow = {
								key: null,
								time: time,
								change: null
							};
							if (change.update) {
								// store deltas
								let delta = shallowCopy(change.update);
								changeRow.key = table.keyValue(delta);
								delete delta[table.key];
								changeRow.change = serializeDelta(delta, table.spec);
							}
							else {
								// mark deleted
								changeRow.key = change.delete;
								changeRow.change = serializeDelta(deleteRow_action, table.spec);
							}
		
							// insert into delta table
							let columns = Object.keys(changeRow);
							let values: any[] = columns.map(k => changeRow[k]);
							toResolve.add({table, key: changeRow.key});
							insert(transaction, changeTable, columns, values, insertNextChange);
						}

						/* istanbul ignore next */
						if (!change.create && !change.update && !change.delete) {
							throw new Error("no operation specified for delta- should be one of create, update, or delete");
						}
					}
					else {
						resolveChanges(transaction);
					}
				};
				
				resolveChanges = (transaction: DbTransaction) => {
					let j = 0;
					let toResolveArray: ResolveKey[] = [];
					toResolve.forEach((keyValue: ResolveKey) => toResolveArray.push(keyValue));
					let resolveNextChange = (tx2: DbTransaction) => {
						if (j < toResolveArray.length) {
							let keyValue = toResolveArray[j];
							j++;
							resolve(tx2, keyValue.table, keyValue.key, resolveNextChange);
						}
						else {
							tx2.commit(promiseResolve);
						}
					};
					
					resolveNextChange(transaction);
				};
			
				this.db.transaction(findExistingIds, reject);
			});
		}
	
		public find<Element, Query>(table: Table<Element, any, Query>, queryArg: Query | Query[], opts?: FindOpts): Promise<Element[] | number> {
			return new Promise((resolve: Resolver<Element[] | number>, reject: DbErrorCallback) => {
				this.db.readTransaction((transaction: DbTransaction) => {
					let queries: Query[] = Array.isArray(queryArg) ? queryArg : [queryArg];
					let qs = queries.map(query => 
						assign({}, query, {
							[internal_column_deleted]: false,
							[internal_column_latest]: true,
						})
					);
					runQuery(transaction, table, qs, opts, table.spec.clazz, (tx2: DbTransaction, results: Element[] | number) => {
						tx2.commit(() => resolve(results));
					});
				}, reject);
			});
		}
	}
	
	function getChangeTableName(name: string): string {
		return internal_prefix + "changes_" + name;
	}
	
	function getSetTableName(tableName: string, col: string): string {
		return internal_prefix + "set_" + tableName + "_" + col;
	}
	
	function buildIndices(spec: TableSpecAny) {
		spec.indices = shallowCopy(spec.indices) || [];
		for (let col in spec.columns) {
			if (spec.columns[col].isIndex) {
				spec.indices.push([col]);
			}
		}
	}
	
	function createInternalTableSpecs(table: Table<any, any, any>): TableSpecAny[] {
		let newSpec = shallowCopy(table.spec);
		newSpec.columns = shallowCopy(table.spec.columns);
		for (let col in internalColumn) {
			verify(!table.spec.columns[col], "table %s cannot have reserved column name %s", table.spec.name, col);
			newSpec.columns[col] = internalColumn[col];
		}
		buildIndices(newSpec);
		return [newSpec, ...createSetTableSpecs(newSpec, verifyGetValue(newSpec.columns, table.key))];
	}
	
	function createChangeTableSpec(table: Table<any, any, any>): TableSpecAny {
		let newSpec = <TableSpecAny>{
			name: getChangeTableName(table.spec.name),
			columns: {
				key: Column.Int().Key(),
				time: Column.DateTime().Key(),
				change: Column.JSON(),
			}
		};
		buildIndices(newSpec);
		return newSpec;
	}
	
	function createSetTableSpecs(spec: TableSpecAny, keyColumn: Column): TableSpecAny[] {
		let newSpecs: TableSpecAny[] = [];
		for (let col in spec.columns) {
			let column = spec.columns[col];
			if (column.type == ColumnType.set) {
				let newSpec = <TableSpecAny>{
					name: getSetTableName(spec.name, col),
					columns: {
						key: keyColumn,
						value: new Column(column.element.type).Key(),
						time: Column.Int().Key()
					}
				};
	
				buildIndices(newSpec);
				newSpecs.push(newSpec);
			}
		}
		return newSpecs;
	}
	
	function tableFromSql(name: string, sql: string): TableSpecAny {
		let table = <TableSpecAny>{ name: name, columns: {}, indices: [], triggers: {} };
		let matches = sql.match(/\((.*)\)/);
		/* istanbul ignore else */
		if (matches) {
			let pksplit: string[] = matches[1].split(/PRIMARY KEY/i);
			let fields = pksplit[0].split(",");
			for (let i = 0; i < fields.length; i++) {
				verify(!fields[i].match(/^\s*(primary|foreign)\s+key/i), "unexpected column modifier (primary or foreign key) on %s", fields[i]);
				let quotedName = /"(.+)"\s+(.*)/;
				let unquotedName = /(\w+)\s+(.*)/;
				let parts = fields[i].match(quotedName);
				/* istanbul ignore else */
				if (!parts) {
					parts = fields[i].match(unquotedName);
				}
				if (parts) {
					table.columns[parts[1]] = Column.fromSql(parts[2]);
				}
			}

			/* istanbul ignore else */
			if (pksplit.length > 1) {
				let pk = pksplit[1].match(/\((.*)\)/);
				/* istanbul ignore else */
				if (pk) {
					let keys = pk[1].split(",");
					for (let i = 0; i < keys.length; i++) {
						let key = keys[i].trim();
						table.columns[key].isKey = true;
					}
				}
			}
		}
		return table;
	}
	
	function indexFromSql(sql: string): string[] {
		let regex = /\((.*)\)/;
		let matches = regex.exec(sql);
		verify(matches, "bad format on index- couldn't determine column names from sql: %s", sql);
		return matches[1].split(",").map((x: string) => x.trim());
	}
	
	function createTable(transaction: DbTransaction, name: string, columns: ColumnSet, nextCallback: DbTransactionCallback): void {
		let cols: string[] = [];
		let pk: string[] = [];
		for (let col in columns) {
			let attrs: Column = columns[col];
			let decl: string;
			switch (attrs.type) {
				case ColumnType.set:
					// ignore this column; values go into a separate table
					verify(!attrs.isKey, "table %s cannot have a key on set column %s", name, col);
					break;
	
				default:
					decl = col + " " + Column.sql(attrs);
					cols.push(decl);
					if (attrs.isKey) {
						pk.push(col);
					}
					break;
			}
		}
		verify(pk.length, "table %s has no keys", name);
		cols.push("PRIMARY KEY(" + pk.join(", ")  + ")");
		transaction.executeSql("CREATE TABLE " + name + " (" + cols.join(", ") + ")", [], nextCallback);
	}
	
	function renameTable(transaction: DbTransaction, oldName: string, newName: string, nextCallback: DbTransactionCallback): void {
		transaction.executeSql("ALTER TABLE " + oldName + " RENAME TO " + newName, [], nextCallback);
	}

	function dropTable(transaction: DbTransaction, name: string, nextCallback: DbTransactionCallback): void {
		transaction.executeSql("DROP TABLE IF EXISTS " + name, [], nextCallback);
	}
	
	function createIndices(transaction: DbTransaction, schema: Schema, spec: TableSpecAny, force: boolean, nextCallback: DbTransactionCallback): void {
		let indicesEqual = function(a: string[], b: string[]) {
			if (a.length != b.length) {
				return false;
			}
			for (let i = 0; i < a.length; i++) {
				if (a[i] != b[i]) {
					return false;
				}
			}
			return true;
		};

		let oldIndices = (spec.name in schema) ? schema[spec.name].indices : [];
		let newIndices = spec.indices;
		let getIndexName = function(indices: string[]): string {
				return "index_" + spec.name + "__" + indices.join("_");
		};

		let stmts: DbStatement[] = [];
		oldIndices.forEach((value: string[], i: number) => {
			let drop = true;
	
			for (let j = 0; j < newIndices.length; j++) {
				if (indicesEqual(oldIndices[i], newIndices[j])) {
					drop = false;
					break;
				}
			}
	
			if (drop) {
				stmts.push({ sql: "DROP INDEX IF EXISTS " + getIndexName(oldIndices[i]) });
			}
		});

		newIndices.forEach((value: string[], j: number) => {
			let create = true;
	
			for (let i = 0; i < oldIndices.length; i++) {
				if (indicesEqual(oldIndices[i], newIndices[j])) {
					create = false;
					break;
				}
			}
	
			if (create || force) {
				let index = newIndices[j];
				stmts.push({ sql: "CREATE INDEX IF NOT EXISTS " + getIndexName(index) + " ON " + spec.name + " (" + index.join(", ") + ")" });
			}
		});

		DbExecuteSequence(transaction, stmts, nextCallback);
	}
	
	function copyData(transaction: DbTransaction, oldName: string, newName: string, oldColumns: ColumnSet, newColumns: ColumnSet, renamedColumns: RenamedColumnSet, nextCallback: DbTransactionCallback): void {
		let oldTableColumns = Object.keys(oldColumns).filter(col => (col in newColumns) || (col in renamedColumns));
		let newTableColumns = oldTableColumns.map(col => (col in renamedColumns) ? renamedColumns[col] : col);
		/* istanbul ignore else */
		if (oldTableColumns.length && newTableColumns.length) {
			let stmt = "INSERT INTO " + newName + " (" + newTableColumns.join(", ") + ") ";
			stmt += "SELECT " + oldTableColumns.join(", ") + " FROM " + oldName + ";";
			transaction.executeSql(stmt, [], nextCallback);
		}
		else {
			nextCallback(transaction);
		}
	}
	
	function migrateChangeTable(transaction: DbTransaction, changeTableName: string, oldColumns: ColumnSet, newColumns: ColumnSet, renamedColumns: RenamedColumnSet, nextCallback: DbTransactionCallback): void {
		let deletedColumns = Object.keys(oldColumns).filter(col => !(col in newColumns) && !(col in renamedColumns));
		/* istanbul ignore else */
		if (!isEmpty(renamedColumns) || deletedColumns) {
			transaction.each(
				"SELECT " + ROWID + ", change"
				+ " FROM " + changeTableName,
				[],
				(selectChangeTransaction: DbTransaction, row: any) => {
					let change = fromText(row.change);
					let changed = false;
					for (let oldCol in renamedColumns) {
						let newCol = renamedColumns[oldCol];
						if (oldCol in change) {
							change[newCol] = change[oldCol];
							delete change[oldCol];
							changed = true;
						}
					}
					for (let oldCol of deletedColumns) {
						if (oldCol in change) {
							delete change[oldCol];
							changed = true;
						}
					}
					if (changed) {
						if (!isEmpty(change)) {
							selectChangeTransaction.executeSql(
								"UPDATE " + changeTableName
								+ " SET change=?"
								+ " WHERE " + ROWID + "=?",
								[toText(change), row[ROWID]],
								() => {}
							);
						}
						else {
							selectChangeTransaction.executeSql(
								"DELETE FROM " + changeTableName
								+ " WHERE " + ROWID + "=?",
								[row[ROWID]],
								() => {}
							);
						}
					}
				},
				nextCallback
			);
		}
	}
	
	function verifyGetValue(element: any, field: string | number): any {
		verify(field in element, "element does not contain field %s: %s", field, element);
		return element[field];
	}
	
	function insert(transaction: DbTransaction, tableName: string, columns: string[], values: any[], nextCallback: DbTransactionCallback): void {
		let questionMarks = values.map(v => "?");
		verify(columns.indexOf(ROWID) == -1, "should not insert with rowid column");
		transaction.executeSql("INSERT OR REPLACE INTO " + tableName + " (" + columns.join(", ") + ") VALUES (" + questionMarks.join(", ") + ")", values, nextCallback);
	}
	
	function insertElement<Element>(transaction: DbTransaction, table: Table<Element, any, any>, element: Element, nextCallback: DbTransactionCallback): void {
		let keyValue = table.keyValue(element);
		let columns = selectableColumns(table.spec, element);
		let values: any[] = columns.map(col => serializeValue(table.spec, col, element[col]));
		let time = verifyGetValue(element, internal_column_time);
		
		insert(transaction, table.spec.name, columns, values, (tx2: DbTransaction) => {
			// insert set values
			let stmts: DbStatement[] = [];
			Object.keys(table.spec.columns).forEach(function insertElementEachColumn(col: string) {
				let column = table.spec.columns[col];
				if (column.type == ColumnType.set && (col in element)) {
					let set: Set<any> = element[col];
					if (set.size) {
						set.forEach((value: any) => {
							stmts.push({
								sql: "INSERT INTO " + getSetTableName(table.spec.name, col)
									+ " (time, key, value)"
									+ " VALUES (?, ?, ?)",
								params: [time, table.keyValue(element), column.element.serialize(value)]
							});
						});
					}
				}
			});
			
			DbExecuteSequence(tx2, stmts, nextCallback);
		});
	}
	
	function resolve<Element>(transaction: DbTransaction, table: Table<Element, any, any>, keyValue: KeyType, nextCallback: DbTransactionCallback): void {
		selectBaseline(transaction, table, keyValue, (tx2: DbTransaction, baseline: BaselineInfo<Element>) => {
			getChanges(tx2, table, baseline, (tx3: DbTransaction, changes: ChangeTableRow[]) => {
				let deltaResult = applyChanges(baseline, changes, table.spec);
				let promises: Promise<any>[] = [];
				if (!deltaResult.isChanged) {
					// mark it as latest (and others as not)
					setLatest(tx3, table, keyValue, baseline.rowid, nextCallback);
				}
				else {
					// invalidate old latest rows
					// insert new latest row
					let element = update(deltaResult.element, {
						[internal_column_latest]: {$set: true},
						[internal_column_time]: {$set: deltaResult.time},
						[internal_column_composed]: {$set: true}
					});
					
					invalidateLatest(tx3, table, keyValue, (tx4: DbTransaction) => {
						insertElement(tx4, table, element, nextCallback);
					});
				}
			});
		});
	}
	
	function runQuery<Element, Query>(transaction: DbTransaction, table: Table<Element, any, Query>, queryArg: Query | Query[], opts: FindOpts, clazz: new (props: Element) => Element, resultCallback: DbCallback<number | Element[]>): void {
		opts = opts || {};
	
		let conditionSets: string[][] = [];
		let values: (string | number)[] = [];
		const queries: Query[] = Array.isArray(queryArg) ? queryArg : [queryArg];

		queries.forEach(query => {
			let conditions: string[] = [];
			Object.keys(query).forEach((col: string) => {
				verify((col in table.spec.columns) || (col in internalColumn), "attempting to query based on column '%s' not in schema (%s)", col, table.spec.columns);
				let column: Column = (col in internalColumn) ? internalColumn[col] : table.spec.columns[col];
				let spec = query[col];
				let found = false;
				
				switch (column.type) {
				case ColumnType.int:
				case ColumnType.real:
				case ColumnType.enum:
				case ColumnType.date:
				case ColumnType.datetime:
					const comparisons = {
						$gt: ">",
						$gte: ">=",
						$lt: "<",
						$lte: "<=",
						$ne: "!="
					};
					for (let condition in comparisons) {
						if (hasOwnProperty.call(spec, condition)) {
							conditions.push("(" + col + comparisons[condition] + "?)");
							let value = column.serialize(spec[condition]);
							verify(Object(value) !== value, "condition %s must have a numeric-ish argument; got %s instead", condition, value);
							values.push(value);
							found = true;
						}
					}
					break;

				case ColumnType.text:
					const operations = {
						$like: (value: string) => {
							conditions.push("(" + col + " LIKE ? ESCAPE '\\')");
							values.push(value);
							found = true;
						},
						
						$notLike: (value: string) => {
							conditions.push("(" + col + " NOT LIKE ? ESCAPE '\\')");
							values.push(value);
							found = true;
						}
					};
					for (let condition in operations) {
						if (hasOwnProperty.call(spec, condition)) {
							operations[condition](spec[condition]);
						}
					}
					break;

				case ColumnType.bool:
					conditions.push(col + (spec ? "!=0" : "=0"));
					found = true;
					break;

				case ColumnType.set:
					let existsSetValues = function(setValues: any[], args: (string | number)[]): string {
						let escapedValues = setValues.map(value => column.element.serialize(value));
						args.push(...escapedValues);
						return "EXISTS ("
							+ "SELECT 1 FROM " + getSetTableName(table.spec.name, col)
							+ " WHERE value IN (" + setValues.map(x => "?").join(", ") + ")"
							+ " AND key=" + table.spec.name + "." + table.key
							+ " AND time=" + table.spec.name + "." + internal_column_time
							+ ")";
					};

					let setConditions = {
						$has: (hasValue: any) => {
							verify(!Array.isArray(hasValue), "must not be an array: %s", hasValue);
							let condition = existsSetValues([hasValue], values);
							conditions.push(condition);
						},
						$hasAny: (hasAnyValues: any[]) => {
							verify(Array.isArray(hasAnyValues), "must be an array: %s", hasAnyValues);
							let condition = existsSetValues(hasAnyValues, values);
							conditions.push(condition);
						},
						$hasAll: (hasAllValues: any[]) => {
							verify(Array.isArray(hasAllValues), "must be an array: %s", hasAllValues);
							for (let hasValue of hasAllValues) {
								let condition = existsSetValues([hasValue], values);
								conditions.push(condition);
							}
						}
					};
					
					for (let condition in setConditions) {
						if (hasOwnProperty.call(spec, condition)) {
							let value = spec[condition];
							setConditions[condition](value);
							found = true;
							break;
						}
					}
					break;
				}

				if (!found) {
					const inCondition = keyOf({ $in: false });
					if (hasOwnProperty.call(spec, inCondition)) {
						verify(Array.isArray(spec[inCondition]), "must be an array: %s", spec[inCondition]);
						conditions.push(col + " IN (" + spec[inCondition].map((x: any) => "?").join(", ") + ")");
						let inValues: any[] = spec[inCondition];
						inValues = inValues.map(val => column.serialize(val));
						values.push(...inValues);
						found = true;
					}
				}
				
				if (!found) {
					/* istanbul ignore else */
					if (typeof spec === "number" || typeof spec === "string") {
						conditions.push(col + "=?");
						values.push(spec);
						found = true;
					}
				}

				verify(found, "unknown query condition for %s: %s", col, spec);
			});
			
			if (conditions.length) {
				conditionSets.push(conditions);
			}
		});
	
		let fields: FieldSpec = assign({}, opts.fields || table.spec.columns, {[internal_column_time]: true});
		let columns: string[] = selectableColumns(table.spec, fields);
		let stmt = "SELECT " + (opts.count ? COUNT : columns.join(", "));
		stmt += " FROM " + table.spec.name;
		if (conditionSets.length) {
			stmt += " WHERE " + conditionSets.map(conditions => "(" + conditions.join(" AND ") + ")").join(" OR ");
		}
	
		if (opts.orderBy) {
			let col = keyOf(opts.orderBy);
			let order = opts.orderBy[col];
			stmt += " ORDER BY " + col + " " + (order == OrderBy.ASC ? "ASC" : "DESC");
		}
	
		if (opts.limit) {
			stmt += " LIMIT " + opts.limit;
		}
	
		if (opts.offset) {
			stmt += " OFFSET " + opts.offset;
		}
	
		transaction.executeSql(stmt, values, (tx2: DbTransaction, rows: any[]) => {
			if (opts.count) {
				let count = parseInt(rows[0][COUNT], 10);
				resultCallback(transaction, count);
			}
			else {
				loadAllExternals(transaction, rows, table, opts.fields, (tx3: DbTransaction) => {
					let results: Element[] = [];
					for (let i = 0; i < rows.length; i++) {
						let row = deserializeRow<Element>(table.spec, rows[i]);
						for (let col in internalColumn) {
							if (!opts.fields || !(col in opts.fields)) {
								delete row[col];
							}
						}
						let obj = clazz ? new clazz(row) : row;
						results.push(obj);
					}
					resultCallback(tx3, results);
				});
			}
		});
	}
	
	function popValue<Element>(element: Element, field: string) {
		let ret = verifyGetValue(element, field);
		delete element[field];
		return ret;
	}
	
	function selectBaseline<Element, Query>(transaction: DbTransaction, table: Table<Element, any, any>, keyValue: KeyType, resultCallback: DbCallback<BaselineInfo<Element>>): void {
		let fieldSpec = <FieldSpec>{
			[ROWID]: true,
			[internal_column_time]: true,
			[internal_column_deleted]: true,
		};
		Object.keys(table.spec.columns).forEach(col => fieldSpec[col] = true);
	
		let query = <Query>{
			[table.key]: keyValue,
			[internal_column_composed]: false
		};
	
		let opts = <FindOpts>{
			fields: fieldSpec,
			orderBy: { [internal_column_time]: OrderBy.DESC },
			limit: 1
		};
	
		runQuery(transaction, table, query, opts, null, (tx2: DbTransaction, baselineResults: any[]) => {
			let baseline: BaselineInfo<Element> = {
				element: <Element>{},
				time: 0,
				rowid: -1
			};
			if (baselineResults.length) {
				let element = <Element>baselineResults[0];
				baseline.element = element;
				baseline.time = popValue(element, internal_column_time);
				baseline.rowid = popValue(element, ROWID);
			}
			else {
				baseline.element[table.key] = keyValue;
			}
			resultCallback(tx2, baseline);
		});
	}
	
	function loadAllExternals<Element>(transaction: DbTransaction, elements: Element[], table: Table<Element, any, any>, fields: FieldSpec, nextCallback: DbTransactionCallback) {
		let i = 0;
		let loadNextElement = (tx2: DbTransaction) => {
			if (i < elements.length) {
				let element = elements[i];
				i++;
				loadExternals(tx2, table, element, fields, loadNextElement);
			}
			else {
				nextCallback(tx2);
			}
		};
		
		loadNextElement(transaction);
	};
	
	function loadExternals<Element>(transaction: DbTransaction, table: Table<Element, any, any>, element: any, fields: FieldSpec, nextCallback: DbTransactionCallback) {
		let cols: string[] = Object.keys(table.spec.columns).filter(col => !fields || (col in fields && fields[col]));
		let i = 0;
		let loadNextField = (tx2: DbTransaction) => {
			if (i < cols.length) {
				let col: string = cols[i];
				i++;
				let column = table.spec.columns[col];
				if (column.type == ColumnType.set) {
					let set: Set<any> = element[col] = element[col] || new Set<any>();
					let keyValue = verifyGetValue(element, table.key);
					let time = verifyGetValue(element, internal_column_time);
					let p = tx2.executeSql(
						"SELECT value "
						+ "FROM " + getSetTableName(table.spec.name, col)
						+ " WHERE key=?"
						+ " AND time=?",
						[keyValue, time],
						(tx: DbTransaction, results: SetTableRow[]) => {
							for (let row of results) {
								set.add(column.element.deserialize(row.value));
							}
							loadNextField(tx2);
						}
					);
				} else {
					loadNextField(tx2);
				}
			}
			else {
				nextCallback(tx2);
			}
		};
		loadNextField(transaction);
	}
	
	function getChanges<Element>(transaction: DbTransaction, table: Table<Element, any, any>, baseline: BaselineInfo<Element>, resultCallback: DbCallback<ChangeTableRow[]>): void {
		let keyValue = verifyGetValue(baseline.element, table.key);
		transaction.executeSql(
			"SELECT key, time, change"
			+ " FROM " + getChangeTableName(table.spec.name)
			+ " WHERE key=? AND time>=?"
			+ " ORDER BY time ASC",
			[keyValue, baseline.time],
			resultCallback);
	}
	
	interface DeltaResult<Element> {
		element: Element;
		time: number;
		isChanged: boolean;
	}
	
	function applyChanges<Element, Delta>(baseline: BaselineInfo<Element>, changes: ChangeTableRow[], spec: TableSpecAny): DeltaResult<Element> {
		let element: Element = baseline.element;
		let time = baseline.time;
		for (let i = 0; i < changes.length; i++) {
			let row = changes[i];
			let delta = <Delta>deserializeDelta(row.change, spec);
			element = update(element, delta);
			time = Math.max(time, row.time);
		}
		let isChanged = (baseline.element !== element) || baseline.rowid == -1;
		return { element, time, isChanged };
	}
	
	function setLatest<Element>(transaction: DbTransaction, table: Table<Element, any, any>, keyValue: KeyType, rowid: number, nextCallback: DbTransactionCallback): void {
		transaction.executeSql(
			"UPDATE " + table.spec.name
			+ " SET " + internal_column_latest + "=(" + ROWID + "=" + rowid + ")"
			+ " WHERE " + table.key + "=?",
			[keyValue],
			nextCallback);
	}
	
	function invalidateLatest<Element>(transaction: DbTransaction, table: Table<Element, any, any>, keyValue: KeyType, nextCallback: DbTransactionCallback): void {
		transaction.executeSql(
			"UPDATE " + table.spec.name
			+ " SET " + internal_column_latest + "=0"
			+ " WHERE " + table.key + "=?",
			[keyValue],
			nextCallback);
	}
	
	function selectableColumns(spec: TableSpecAny, cols: { [key: string]: any }): string[] {
		return Object.keys(cols).filter(col => (col == ROWID) || (col in internalColumn) || ((col in spec.columns) && (spec.columns[col].type != ColumnType.set)));
	}
	
	function serializeValue(spec: TableSpecAny, col: string, value: any): Serializable {
		if (col in spec.columns) {
			let x = spec.columns[col].serialize(value);
			return x;
		}
		verify(typeof value == "number" || value, "bad value");
		return value;
	}
	
	function deserializeValue(spec: TableSpecAny, col: string, value: any) {
		if (col in spec.columns) {
			value = spec.columns[col].deserialize(value);
		}
		return value;
	}
	
	let setKey = keyOf({ $set: false });
	function serializeDelta<Delta>(change: Delta, spec: TableSpec<any, Delta, any>): string {
		for (let col in change) {
			let val = change[col];
			if (hasOwnProperty.call(val, setKey)) {
				change[col] = shallowCopy(change[col]);
				change[col][setKey] = serializeValue(spec, col, change[col][setKey]);
			}
		}
		return toText(change);
	}
	
	function deserializeDelta<Delta>(text: string, spec: TableSpec<any, Delta, any>): Delta {
		let delta = fromText(text);
		for (let col in delta) {
			let val = delta[col];
			if (hasOwnProperty.call(val, setKey)) {
				delta[col][setKey] = deserializeValue(spec, col, delta[col][setKey]);
			}
		}
		return delta;
	}
	
	function deserializeRow<T>(spec: TableSpecAny, row: any[]): T {
		let ret: T = <any>{};
		for (let col in row) {
			let src = row[col];
			if (src != null) {
				ret[col] = deserializeValue(spec, col, src);
			}
		}
		return ret;
	}
	
	function isEmpty(obj: any): boolean {
		for (let field in obj) {
			return false;
		}
		return true;
	}
	
	export function createStore(params: CreateStoreParams): Store {
		return new Store(params);
	}
	
	/* istanbul ignore next */
	export function makeCreate<Element>(table: Updraft.Table<Element, any, any>, time: number) {
		return (create: Element): Updraft.TableChange<Element, any> => ({
			table,
			time,
			create
		});
	}

	/* istanbul ignore next */
	export function makeUpdate<Delta>(table: Updraft.Table<any, Delta, any>, time: number) {
		return (update: Delta): Updraft.TableChange<Element, any> => ({
			table,
			time,
			update
		});
	}

	/* istanbul ignore next */
	export function makeDelete(table: Updraft.TableAny, time: number) {
		return (id: KeyType): Updraft.TableChange<any, any> => ({
			table,
			time,
			delete: id
		});
	}

}
