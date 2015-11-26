///<reference path="./Mutate"/>
///<reference path="./Column"/>
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
	
	const deleteRow_action = { [internal_column_deleted]: { $set: true } };
	
	const keyValueTableSpec: TableSpec<KeyValue, any, any> = {
		name: internal_prefix + "keyValues",
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
		private keyValues: KeyValueMap;
	
		constructor(params: CreateStoreParams) {
			this.params = params;
			this.tables = [];
			this.db = null;
			verify(this.params.db, "must pass a DbWrapper");
			this.keyValueTable = this.createTable<KeyValue, any, any>(keyValueTableSpec);
		}
	
		createTable<Element, Mutator, Query>(tableSpec: TableSpec<Element, Mutator, Query>): Table<Element, Mutator, Query> {
			verify(!this.db, "createTable() can only be added before open()");
			if (tableSpec !== keyValueTableSpec) {
				verify(!startsWith(tableSpec.name, internal_prefix), "table name %s cannot begin with %s", tableSpec.name, internal_prefix);
			}
			for (let col in tableSpec.columns) {
				verify(!startsWith(col, internal_prefix), "table %s column %s cannot begin with %s", tableSpec.name, col, internal_prefix);
			}
			let table = new Table<Element, Mutator, Query>(tableSpec);
			table.add = (...changes: TableChange<Element, Mutator>[]): Promise<any> => this.add(table, ...changes);
			table.find = (query: Query, opts?: FindOpts): Promise<Element[]> => this.find(table, query, opts);
			this.tables.push(...createInternalTableSpecs(table));
			this.tables.push(createChangeTableSpec(table));
			return table;
		}
	
		open(): Promise<any> {
			verify(!this.db, "open() called more than once!");
			verify(this.tables.length, "open() called before any tables were added");
	
			this.db = this.params.db;
	
			return Promise.resolve()
				.then(() => this.readSchema())
				.then((schema) => {
					return new Promise((resolve) => {
						let i = 0;
						let act = (transaction: DbTransaction) => {
							if (i < this.tables.length) {
								let table = this.tables[i];
								i++;
								this.syncTable(transaction, schema, table, act);
							}
							else {
								this.loadKeyValues(transaction, resolve);
							}
						};
						this.db.transaction(act);
					});
				})
				;
		}
	
		readSchema(): Promise<Schema> {
			verify(this.db, "readSchema(): not opened");
			
			return new Promise((resolve: Resolver<Schema>) => {
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
		
						resolve(schema);
					});
				});
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
					let renameTable = function(transaction: DbTransaction, oldName: string, newName: string, nextCallback: DbTransactionCallback): void {
						transaction.executeSql("ALTER TABLE " + oldName + " RENAME TO " + newName, [], nextCallback);
					};
	
					let tempTableName = "temp_" + spec.name;
					let changeTableName = getChangeTableName(spec.name);
	
					dropTable(transaction, tempTableName, (transaction: DbTransaction) => {
						createTable(transaction, tempTableName, spec.columns, (transaction: DbTransaction) => {
							copyData(transaction, spec.name, tempTableName, oldColumns, newColumns, renamedColumns, (transaction: DbTransaction) => {
								dropTable(transaction, spec.name, (transaction: DbTransaction) => {
									renameTable(transaction, tempTableName, spec.name, (transaction: DbTransaction) => {
										migrateChangeTable(transaction, changeTableName, oldColumns, newColumns, renamedColumns, (transaction: DbTransaction) => {
											createIndices(transaction, schema, spec, true, nextCallback);
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
					
					DbExecuteSequence(transaction, stmts, (transaction: DbTransaction) => {
						createIndices(transaction, schema, spec, false, nextCallback);
					});
				}
				else {
					// no table modification is required
					createIndices(transaction, schema, spec, false, nextCallback);
				}
			}
			else {
				// create new table
				createTable(transaction, spec.name, spec.columns, (transaction: DbTransaction) => {
					createIndices(transaction, schema, spec, true, nextCallback);
				});
			}
		}
		
		private loadKeyValues(transaction: DbTransaction, nextCallback: DbTransactionCallback): void {
			return runQuery(transaction, this.keyValueTable, {}, undefined, undefined, (transaction: DbTransaction, rows: KeyValue[]) => {
				this.keyValues = {};
				rows.forEach((row: KeyValue) => {
					this.keyValues[row.key] = row.value;
				});
				nextCallback(transaction);
			});
		}

		getValue(key: string): any {
			return this.keyValues[key];
		}
		
		setValue(key: string, value: any): Promise<any> {
			this.keyValues[key] = value;
			return this.keyValueTable.add({save: {key, value}});
		}
	
		add<Element, Mutator>(table: Table<Element, Mutator, any>, ...changes: TableChange<Element, Mutator>[]): Promise<any> {
			verify(this.db, "apply(): not opened");
			let changeTable = getChangeTableName(table.spec.name);

			return new Promise((promiseResolve) => {
				let i = 0;
				let toResolve = new Set<KeyType>();
				let insertNextChange: DbTransactionCallback = null;
				let resolveChanges: DbTransactionCallback = null;

				insertNextChange = (transaction: DbTransaction) => {
					if (i < changes.length) {
						let change = changes[i];
						i++;
						let time = change.time || Date.now();
						verify((change.save ? 1 : 0) + (change.change ? 1 : 0) + (change.delete ? 1 : 0) === 1, "change (%s) must specify exactly one action at a time", change);
						/* istanbul ignore else */
						if (change.save) {
							// append internal column values
							let element = assign(
								{},
								change.save,
								{ [internal_column_time]: time }
							);
							toResolve.add(table.keyValue(element));
							insertElement(transaction, table, element, insertNextChange);
						}
						else if (change.change || change.delete) {
							let changeRow: ChangeTableRow = {
								key: null,
								time: time,
								change: null
							};
							if (change.change) {
								// store changes
								let mutator = shallowCopy(change.change);
								changeRow.key = table.keyValue(mutator);
								delete mutator[table.key];
								changeRow.change = serializeChange(mutator, table.spec);
							}
							else {
								// mark deleted
								changeRow.key = change.delete;
								changeRow.change = serializeChange(deleteRow_action, table.spec);
							}
		
							// insert into change table
							let columns = Object.keys(changeRow);
							let values: any[] = columns.map(k => changeRow[k]);
							toResolve.add(changeRow.key);
							insert(transaction, changeTable, columns, values, insertNextChange);
						}
						else {
							/* istanbul ignore next */
							throw new Error("no operation specified for change- should be one of save, change, or delete");
						}
					}
					else {
						resolveChanges(transaction);
					}
				};
				
				resolveChanges = (transaction: DbTransaction) => {
					let j = 0;
					let toResolveArray: KeyType[] = [];
					toResolve.forEach((keyValue: KeyType) => toResolveArray.push(keyValue));
					let resolveNextChange = (transaction: DbTransaction) => {
						if (j < toResolveArray.length) {
							let keyValue = toResolveArray[j];
							j++;
							resolve(transaction, table, keyValue, resolveNextChange);
						}
						else {
							promiseResolve();
						}
					};
					
					resolveNextChange(transaction);
				};
			
				this.db.transaction(insertNextChange);
			});
		}
	
		find<Element, Query>(table: Table<Element, any, Query>, query: Query, opts?: FindOpts): Promise<Element[]> {
			return new Promise((resolve: Resolver<Element[]>) => {
				this.db.readTransaction((transaction: DbTransaction) => {
					let q = assign({}, query, {
						[internal_column_deleted]: false,
						[internal_column_latest]: true,
					});
					runQuery(transaction, table, q, opts, table.spec.clazz, (transaction: DbTransaction, results: Element[]) => {
						resolve(results);
					});
				});
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
		
		insert(transaction, table.spec.name, columns, values, (transaction: DbTransaction) => {
			// insert set values
			let stmts: DbStatement[] = [];
			Object.keys(table.spec.columns).forEach(function insertElementEachColumn(col: string) {
				let column = table.spec.columns[col];
				if (column.type == ColumnType.set && (col in element)) {
					let set: Set<any> = element[col];
					if (set.size) {
						let setValues: any[] = [];
						let placeholders: string[] = [];
						set.forEach((value: any) => {
							placeholders.push("(?, ?, ?)");
							setValues.push(time, table.keyValue(element), column.element.serialize(value));
						});
						stmts.push({
							sql: "INSERT INTO " + getSetTableName(table.spec.name, col)
								+ " (time, key, value)"
								+ " VALUES " + placeholders.join(", "),
							params: setValues
						});
					}
				}
			});
			
			DbExecuteSequence(transaction, stmts, nextCallback);
		});
	}
	
	function resolve<Element>(transaction: DbTransaction, table: Table<Element, any, any>, keyValue: KeyType, nextCallback: DbTransactionCallback): void {
		selectBaseline(transaction, table, keyValue, (transaction: DbTransaction, baseline: BaselineInfo<Element>) => {
			getChanges(transaction, table, baseline, (transaction: DbTransaction, changes: ChangeTableRow[]) => {
				let mutation = applyChanges(baseline, changes, table.spec);
				let promises: Promise<any>[] = [];
				if (!mutation.isChanged) {
					// mark it as latest (and others as not)
					setLatest(transaction, table, keyValue, baseline.rowid, nextCallback);
				}
				else {
					// invalidate old latest rows
					// insert new latest row
					let element = mutate(mutation.element, {
						[internal_column_latest]: {$set: true},
						[internal_column_time]: {$set: mutation.time},
						[internal_column_composed]: {$set: true}
					});
					
					invalidateLatest(transaction, table, keyValue, (transaction: DbTransaction) => {
						insertElement(transaction, table, element, nextCallback);
					});
				}
			});
		});
	}
	
	function runQuery<Element, Query>(transaction: DbTransaction, table: Table<Element, any, Query>, query: Query, opts: FindOpts, clazz: new (props: Element) => Element, resultCallback: DbCallback<number | Element[]>): void {
		opts = opts || {};
	
		const numericConditions = {
			$gt: ">",
			$gte: ">=",
			$lt: "<",
			$lte: "<="
		};
	
		const inCondition = keyOf({ $in: false });
		const hasCondition = keyOf({ $has: false });
		const hasAnyCondition = keyOf({ $hasAny: false });
		const hasAllConditions = keyOf({ $hasAll: false });
	
		let conditions: string[] = [];
		let values: (string | number)[] = [];
	
		Object.keys(query).forEach((col: string) => {
			verify((col in table.spec.columns) || (col in internalColumn), "attempting to query based on column '%s' not in schema (%s)", col, table.spec.columns);
			let column: Column = (col in internalColumn) ? internalColumn[col] : table.spec.columns[col];
			let spec = query[col];
			let found = false;
	
			for (let condition in numericConditions) {
				if (hasOwnProperty.call(spec, condition)) {
					conditions.push("(" + col + numericConditions[condition] + "?)");
					let value = spec[condition];
					verify(parseInt(value, 10) == value, "condition %s must have a numeric argument: %s", condition, value);
					values.push(value);
					found = true;
					break;
				}
			}
	
			if (!found) {
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
				let has = hasOwnProperty.call(spec, hasCondition);
				let hasAny = hasOwnProperty.call(spec, hasAnyCondition);
				let hasAll = hasOwnProperty.call(spec, hasAllConditions);
				if (has || hasAny || hasAll) {
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
					
					/* istanbul ignore else */
					if (has) {
						let hasValue = spec[hasCondition];
						verify(!Array.isArray(hasValue), "must not be an array: %s", hasValue);
						let condition = existsSetValues([hasValue], values);
						conditions.push(condition);
					}
					else if (hasAny) {
						let hasAnyValues: any[] = spec[hasAnyCondition];
						verify(Array.isArray(hasAnyValues), "must be an array: %s", hasAnyValues);
						let condition = existsSetValues(hasAnyValues, values);
						conditions.push(condition);
					}
					else if (hasAll) {
						let hasAllValues: any[] = spec[hasAllConditions];
						verify(Array.isArray(hasAllValues), "must be an array: %s", hasAllValues);
						for (let hasValue of hasAllValues) {
							let condition = existsSetValues([hasValue], values);
							conditions.push(condition);
						}
					}
					found = true;
				}
			}
	
			if (!found) {
				/* istanbul ignore else */
				if (column.type == ColumnType.bool) {
					conditions.push(col + (spec ? "!=0" : "=0"));
					found = true;
				}
				else if (typeof spec === "number" || typeof spec === "string") {
					conditions.push("(" + col + "=?)");
					values.push(spec);
					found = true;
				}
				else if (spec instanceof RegExp) {
					let rx: RegExp = spec;
					let arg = rx.source.replace(/\.\*/g, "%").replace(/\./g, "_");
					if (arg[0] == "^") {
						arg = arg.substring(1);
					}
					else {
						arg = "%" + arg;
					}
					if (arg[arg.length - 1] == "$") {
						arg = arg.substring(0, arg.length - 1);
					}
					else {
						arg = arg + "%";
					}
					verify(!arg.match(/(\$|\^|\*|\.|\(|\)|\[|\]|\?)/), "RegExp search only supports simple wildcards (.* and .): %s", arg);
					conditions.push("(" + col + " LIKE ?)");
					values.push(arg);
					found = true;
				}
	
				verify(found, "unknown query condition for %s: %s", col, spec);
			}
		});
	
		let fields: FieldSpec = assign({}, opts.fields || table.spec.columns, {[internal_column_time]: true});
		let columns: string[] = selectableColumns(table.spec, fields);
		let stmt = "SELECT " + (opts.count ? COUNT : columns.join(", "));
		stmt += " FROM " + table.spec.name;
		if (conditions.length) {
			stmt += " WHERE " + conditions.join(" AND ");
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
				loadAllExternals(transaction, rows, table, opts.fields, (transaction: DbTransaction) => {
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
					resultCallback(transaction, results);
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
	
		runQuery(transaction, table, query, opts, null, (transaction: DbTransaction, baselineResults: any[]) => {
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
			resultCallback(transaction, baseline);
		});
	}
	
	function loadAllExternals<Element>(transaction: DbTransaction, elements: Element[], table: Table<Element, any, any>, fields: FieldSpec, nextCallback: DbTransactionCallback) {
		let i = 0;
		let loadNextElement = (transaction: DbTransaction) => {
			if (i < elements.length) {
				let element = elements[i];
				i++;
				loadExternals(transaction, table, element, fields, loadNextElement);
			}
			else {
				nextCallback(transaction);
			}
		};
		
		loadNextElement(transaction);
	};
	
	function loadExternals<Element>(transaction: DbTransaction, table: Table<Element, any, any>, element: any, fields: FieldSpec, nextCallback: DbTransactionCallback) {
		let cols: string[] = Object.keys(table.spec.columns).filter(col => !fields || (col in fields && fields[col]));
		let i = 0;
		let loadNextField = (transaction: DbTransaction) => {
			if (i < cols.length) {
				let col: string = cols[i];
				i++;
				let column = table.spec.columns[col];
				if (column.type == ColumnType.set) {
					let set: Set<any> = element[col] = element[col] || new Set<any>();
					let keyValue = verifyGetValue(element, table.key);
					let time = verifyGetValue(element, internal_column_time);
					let p = transaction.executeSql(
						"SELECT value "
						+ "FROM " + getSetTableName(table.spec.name, col)
						+ " WHERE key=?"
						+ " AND time=?",
						[keyValue, time],
						(tx: DbTransaction, results: SetTableRow[]) => {
							for (let row of results) {
								set.add(column.element.deserialize(row.value));
							}
							loadNextField(transaction);
						}
					);
				} else {
					loadNextField(transaction);
				}
			}
			else {
				nextCallback(transaction);
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
	
	interface MutationResult<Element> {
		element: Element;
		time: number;
		isChanged: boolean;
	}
	
	function applyChanges<Element, Mutator>(baseline: BaselineInfo<Element>, changes: ChangeTableRow[], spec: TableSpecAny): MutationResult<Element> {
		let element: Element = baseline.element;
		let time = baseline.time;
		for (let i = 0; i < changes.length; i++) {
			let row = changes[i];
			let mutator = <Mutator>deserializeChange(row.change, spec);
			element = mutate(element, mutator);
			time = Math.max(time, row.time);
		}
		let isChanged = isMutated(baseline.element, element) || baseline.rowid == -1;
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
	function serializeChange<Mutator>(change: Mutator, spec: TableSpec<any, Mutator, any>): string {
		for (let col in change) {
			let val = change[col];
			if (hasOwnProperty.call(val, setKey)) {
				change[col] = shallowCopy(change[col]);
				change[col][setKey] = serializeValue(spec, col, change[col][setKey]);
			}
		}
		return toText(change);
	}
	
	function deserializeChange<Mutator>(text: string, spec: TableSpec<any, Mutator, any>): Mutator {
		let change = fromText(text);
		for (let col in change) {
			let val = change[col];
			if (hasOwnProperty.call(val, setKey)) {
				change[col][setKey] = deserializeValue(spec, col, change[col][setKey]);
			}
		}
		return change;
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
}
