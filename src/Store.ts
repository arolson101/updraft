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
	
	export class Schema {
		[table: string]: TableSpecAny;
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
					return this.db.transaction((transaction: DbTransaction) => {
						let p = Promise.resolve();
						this.tables.forEach(
							(table: TableSpecAny) => {
								p = p.then(() => this.syncTable(transaction, schema, table));
							}
						);
						p = p.then(() => this.loadKeyValues(transaction));
						return p;
					});
				})
				;
		}
	
		readSchema(): Promise<Schema> {
			verify(this.db, "readSchema(): not opened");
	
			return this.db.readTransaction((transaction: DbTransaction) => {
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
								case "trigger":
									//schema[row.tbl_name].triggers[row.name] = row.sql;
									break;
							}
						}
					}
	
					return schema;
				});
			});
		}

		private syncTable(transaction: DbTransaction, schema: Schema, spec: TableSpecAny): Promise<any> {
			let p = Promise.resolve();
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
	
				let renamedColumns = spec.renamedColumns || {};
				for (let colName in renamedColumns) {
					if (colName in oldColumns) {
						recreateTable = true;
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
					let renameTable = function(oldName: string, newName: string): Promise<any> {
						return transaction.executeSql("ALTER TABLE " + oldName + " RENAME TO " + newName);
					};
	
					let tempTableName = "temp_" + spec.name;
					let changeTableName = getChangeTableName(spec.name);
	
					if (tempTableName in schema) {
						// yikes!  migration failed but transaction got committed?
						p = p.then(() => dropTable(transaction, tempTableName));
					}
					p = p.then(() => createTable(transaction, tempTableName, spec.columns));
					p = p.then(() => copyData(transaction, spec.name, tempTableName, oldColumns, newColumns, renamedColumns));
					p = p.then(() => dropTable(transaction, spec.name));
					p = p.then(() => renameTable(tempTableName, spec.name));
					p = p.then(() => migrateChangeTable(transaction, changeTableName, oldColumns, newColumns, renamedColumns));
					p = p.then(() => createIndices(transaction, schema, spec, true));
				}
				else if (Object.keys(addedColumns).length > 0) {
					// alter table, add columns
					Object.keys(addedColumns).forEach((colName) => {
						let col: Column = spec.columns[colName];
						let columnDecl = colName + " " + Column.sql(col);
						p = p.then(() => transaction.executeSql("ALTER TABLE " + spec.name + " ADD COLUMN " + columnDecl));
					});
					p = p.then(() => createIndices(transaction, schema, spec));
				}
				else {
					// no table modification is required
					p = p.then(() => createIndices(transaction, schema, spec));
				}
			}
			else {
				// create new table
				p = p.then(() => createTable(transaction, spec.name, spec.columns));
				p = p.then(() => createIndices(transaction, schema, spec, true));
			}
	
			return p;
		}
		
		private loadKeyValues(transaction: DbTransaction): Promise<any> {
			return runQuery(transaction, this.keyValueTable, {}, undefined, undefined)
				.then((rows: KeyValue[]) => {
					this.keyValues = {};
					rows.forEach((row: KeyValue) => {
						this.keyValues[row.key] = row.value;
					});
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
	
			return this.db.transaction((transaction: DbTransaction): Promise<any> => {
				let p1 = Promise.resolve();
				let toResolve = new Set<KeyType>();
				changes.forEach((change: TableChange<Element, Mutator>) => {
					let time = change.time || Date.now();
					verify((change.save ? 1 : 0) + (change.change ? 1 : 0) + (change.delete ? 1 : 0) === 1, "change (%s) must specify exactly one action at a time", change);
					if (change.save) {
						// append internal column values
						let element = assign(
							{},
							change.save,
							{ [internal_column_time]: time }
						);
						p1 = p1.then(() => insertElement(transaction, table, element));
						toResolve.add(table.keyValue(element));
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
							changeRow.change = toText(mutator);
						}
						else {
							// mark deleted
							changeRow.key = change.delete;
							changeRow.change = toText(deleteRow_action);
						}
	
						// insert into change table
						let columns = Object.keys(changeRow);
						let values: any[] = columns.map(k => changeRow[k]);
						p1 = p1.then(() => insert(transaction, changeTable, columns, values));
						toResolve.add(changeRow.key);
					}
					else {
						throw new Error("no operation specified for change- should be one of save, change, or delete");
					}
				});
				
				toResolve.forEach((keyValue: KeyType) => {
					p1 = p1.then(() => resolve(transaction, table, keyValue));
				});
				
				return p1;
			});
		}
	
		find<Element, Query>(table: Table<Element, any, Query>, query: Query, opts?: FindOpts): Promise<Element[]> {
			return this.db.readTransaction((transaction: DbTransaction): Promise<any> => {
				let q = assign({}, query, {
					[internal_column_deleted]: false,
					[internal_column_latest]: true,
				});
				return runQuery(transaction, table, q, opts, table.spec.clazz);
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
		spec.indices = spec.indices || [];
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
		if (matches) {
			let pksplit: string[] = matches[1].split(/PRIMARY KEY/i);
			let fields = pksplit[0].split(",");
			for (let i = 0; i < fields.length; i++) {
				let ignore = /^\s*(primary|foreign)\s+key/i;  // ignore standalone "PRIMARY KEY xxx"
				if (fields[i].match(ignore)) {
					continue;
				}
				let quotedName = /"(.+)"\s+(.*)/;
				let unquotedName = /(\w+)\s+(.*)/;
				let parts = fields[i].match(quotedName);
				if (!parts) {
					parts = fields[i].match(unquotedName);
				}
				if (parts) {
					table.columns[parts[1]] = Column.fromSql(parts[2]);
				}
			}
	
			if (pksplit.length > 1) {
				let pk = pksplit[1].match(/\((.*)\)/);
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
	
	function createTable(transaction: DbTransaction, name: string, columns: ColumnSet): Promise<any> {
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
		return transaction.executeSql("CREATE TABLE " + name + " (" + cols.join(", ") + ")");
	}
	
	function dropTable(transaction: DbTransaction, name: string): Promise<any> {
		return transaction.executeSql("DROP TABLE " + name);
	}
	
	function createIndices(transaction: DbTransaction, schema: Schema, spec: TableSpecAny, force: boolean = false): Promise<any> {
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
	
		let p = Promise.resolve();
		let oldIndices = (spec.name in schema) ? schema[spec.name].indices : [];
		let newIndices = spec.indices;
		let getIndexName = function(indices: string[]): string {
				return "index_" + spec.name + "__" + indices.join("_");
		};
	
		oldIndices.forEach((value: string[], i: number) => {
			let drop = true;
	
			for (let j = 0; j < newIndices.length; j++) {
				if (indicesEqual(oldIndices[i], newIndices[j])) {
					drop = false;
					break;
				}
			}
	
			if (drop) {
				p = p.then(() => transaction.executeSql("DROP INDEX " + getIndexName(oldIndices[i])));
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
				let sql = "CREATE INDEX IF NOT EXISTS " + getIndexName(index) + " ON " + spec.name + " (" + index.join(", ") + ")";
				p = p.then(() => transaction.executeSql(sql));
			}
		});
	
		return p;
	}
	
	function copyData(transaction: DbTransaction, oldName: string, newName: string, oldColumns: ColumnSet, newColumns: ColumnSet, renamedColumns: RenamedColumnSet): Promise<any> {
		let oldTableColumns = Object.keys(oldColumns).filter(col => (col in newColumns) || (col in renamedColumns));
		let newTableColumns = oldTableColumns.map(col => (col in renamedColumns) ? renamedColumns[col] : col);
		let p2 = Promise.resolve();
		if (oldTableColumns.length && newTableColumns.length) {
			let stmt = "INSERT INTO " + newName + " (" + newTableColumns.join(", ") + ") ";
			stmt += "SELECT " + oldTableColumns.join(", ") + " FROM " + oldName + ";";
			p2 = transaction.executeSql(stmt);
		}
		return p2;
	}
	
	function migrateChangeTable(transaction: DbTransaction, changeTableName: string, oldColumns: ColumnSet, newColumns: ColumnSet, renamedColumns: RenamedColumnSet) {
		let deletedColumns = Object.keys(oldColumns).filter(col => !(col in newColumns) && !(col in renamedColumns));
		let p2 = Promise.resolve();
		if (renamedColumns || deletedColumns) {
			p2 = p2.then(() => {
				return transaction.each(
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
							if (Object.keys(change).length) {
								return selectChangeTransaction.executeSql(
									"UPDATE " + changeTableName
									+ " SET change=?"
									+ " WHERE " + ROWID + "=?",
									[toText(change), row[ROWID]]
								);
							}
							else {
								return selectChangeTransaction.executeSql(
									"DELETE FROM " + changeTableName
									+ " WHERE " + ROWID + "=?",
									[row[ROWID]]
								);
							}
						}
					}
				);
			});
		}
		return p2;
	}
	
	function verifyGetValue(element: any, field: string | number): any {
		verify(field in element, "element does not contain field %s: %s", field, element);
		return element[field];
	}
	
	function insert(transaction: DbTransaction, tableName: string, columns: string[], values: any[]): Promise<any> {
		let questionMarks = values.map(v => "?");
		verify(columns.indexOf(ROWID) == -1, "should not insert with rowid column");
		return transaction.executeSql("INSERT OR REPLACE INTO " + tableName + " (" + columns.join(", ") + ") VALUES (" + questionMarks.join(", ") + ")", values);
	}
	
	function insertElement<Element>(transaction: DbTransaction, table: Table<Element, any, any>, element: Element): Promise<any> {
		let keyValue = table.keyValue(element);
		let columns = selectableColumns(table.spec, element);
		let values: any[] = columns.map(col => serializeValue(table.spec, col, element[col]));
		let time = verifyGetValue(element, internal_column_time);
		
		let promises: Promise<any>[] = [];
		promises.push(insert(transaction, table.spec.name, columns, values));
		
		// insert set values
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
					let p = transaction.executeSql(
						"INSERT INTO " + getSetTableName(table.spec.name, col)
						+ " (time, key, value)"
						+ " VALUES " + placeholders.join(", ")
						, setValues);
					promises.push(p);
				}
			}
		});
		
		return Promise.all(promises);
	}
	
	function resolve<Element>(transaction: DbTransaction, table: Table<Element, any, any>, keyValue: KeyType): Promise<any> {
		return selectBaseline(transaction, table, keyValue).then(function resolveSelectBaselineCallback(baseline: BaselineInfo<Element>) {
			return getChanges(transaction, table, baseline).then(function resolveGetChangesCallback(changes: ChangeTableRow[]) {
				let mutation = applyChanges(baseline, changes);
				let promises: Promise<any>[] = [];
				if (!mutation.isChanged) {
					// mark it as latest (and others as not)
					return setLatest(transaction, table, keyValue, baseline.rowid);
				}
				else {
					// invalidate old latest rows
					// insert new latest row
					let element = mutate(mutation.element, {
						[internal_column_latest]: {$set: true},
						[internal_column_time]: {$set: mutation.time},
						[internal_column_composed]: {$set: true}
					});
					
					return Promise.resolve()
						.then(() => invalidateLatest(transaction, table, keyValue))
						.then(() => insertElement(transaction, table, element));
				}
			});
		});
	}
	
	function runQuery<Element, Query>(transaction: DbTransaction, table: Table<Element, any, Query>, query: Query, opts: FindOpts, clazz: new (props: Element) => Element): Promise<Element[]> {
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
	
		return transaction.executeSql(stmt, values, (tx2: DbTransaction, rows: any[]) => {
			if (opts.count) {
				let count = parseInt(rows[0][COUNT], 10);
				return count;
			}
			else {
				let promises = rows.map((element: Element) => loadExternals(transaction, table, element, opts.fields));
				return Promise.all(promises)
					.then(() => {
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
						return results;
					});
			}
		});
	}
	
	function popValue<Element>(element: Element, field: string) {
		let ret = verifyGetValue(element, field);
		delete element[field];
		return ret;
	}
	
	function selectBaseline<Element, Query>(transaction: DbTransaction, table: Table<Element, any, any>, keyValue: KeyType): Promise<BaselineInfo<Element>> {
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
	
		return runQuery(transaction, table, query, opts, null)
			.then((baselineResults: any[]) => {
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
				
				return baseline;
			});
	}
	
	function loadExternals<Element>(transaction: DbTransaction, table: Table<Element, any, any>, element: any, fields: FieldSpec): Promise<any> {
		let promises: Promise<any>[] = [];
		Object.keys(table.spec.columns).forEach(function loadExternalsForEach(col: string) {
			if (!fields || (col in fields && fields[col])) {
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
						function loadExternalsSqlCallback(tx: DbTransaction, results: SetTableRow[]) {
							for (let row of results) {
								set.add(column.element.deserialize(row.value));
							}
						}
					);
					promises.push(p);
				}
			}
		});
		return Promise.all(promises);
	}
	
	function getChanges<Element>(transaction: DbTransaction, table: Table<Element, any, any>, baseline: BaselineInfo<Element>): Promise<ChangeTableRow[]> {
		let keyValue = verifyGetValue(baseline.element, table.key);
		return transaction.executeSql(
			"SELECT key, time, change"
			+ " FROM " + getChangeTableName(table.spec.name)
			+ " WHERE key=? AND time>=?"
			+ " ORDER BY time ASC",
			[keyValue, baseline.time]);
	}
	
	interface MutationResult<Element> {
		element: Element;
		time: number;
		isChanged: boolean;
	}
	
	function applyChanges<Element, Mutator>(baseline: BaselineInfo<Element>, changes: ChangeTableRow[]): MutationResult<Element> {
		let element: Element = baseline.element;
		let time = baseline.time;
		for (let i = 0; i < changes.length; i++) {
			let row = changes[i];
			let mutator = <Mutator>fromText(row.change);
			element = mutate(element, mutator);
			time = Math.max(time, row.time);
		}
		let isChanged = isMutated(baseline.element, element) || baseline.rowid == -1;
		return { element, time, isChanged };
	}
	
	function setLatest<Element>(transaction: DbTransaction, table: Table<Element, any, any>, keyValue: KeyType, rowid: number): Promise<any> {
		return transaction.executeSql(
			"UPDATE " + table.spec.name
			+ " SET " + internal_column_latest + "=(" + ROWID + "=" + rowid + ")"
			+ " WHERE " + table.key + "=?",
			[keyValue]);
	}
	
	function invalidateLatest<Element>(transaction: DbTransaction, table: Table<Element, any, any>, keyValue: KeyType): Promise<any> {
		return transaction.executeSql(
			"UPDATE " + table.spec.name
			+ " SET " + internal_column_latest + "=0"
			+ " WHERE " + table.key + "=?",
			[keyValue]);
	}
	
	function selectableColumns(spec: TableSpecAny, cols: { [key: string]: any }): string[] {
		return Object.keys(cols).filter(col => (col == ROWID) || (col in internalColumn) || ((col in spec.columns) && (spec.columns[col].type != ColumnType.set)));
	}
	
	function serializeValue(spec: TableSpecAny, col: string, value: any): Serializable {
		if (col in spec.columns) {
			return spec.columns[col].serialize(value);
		}
		return value;
	}
	
	function deserializeRow<T>(spec: TableSpecAny, row: any[]): T {
		let ret: T = <any>{};
		for (let col in row) {
			if (row[col] == null) {
				// don't add null/undefined entries
			}
			else if (col in spec.columns) {
				ret[col] = spec.columns[col].deserialize(row[col]);
			}
			else {
				ret[col] = row[col];
			}
		}
		return ret;
	}
	
	
	export function createStore(params: CreateStoreParams): Store {
		return new Store(params);
	}
}
