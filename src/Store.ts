"use strict";

import { hasOwnProperty, keyOf, mutate, isMutated } from "./Mutate";
import { Column, ColumnType, ColumnSet } from "./Column";
import { DbWrapper, DbTransaction } from "./Database";
import { TableSpec, Table, TableChange, KeyType, FindOpts, OrderBy } from "./Table";
import invariant = require("invariant");
import clone = require("clone");


function startsWith(str: string, val: string) {
	return str.lastIndexOf(val, 0) === 0;
}

type TableSpecAny = TableSpec<any, any, any>;

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

interface ChangeRow {
	key?: KeyType;
	time?: number;
	change?: string;
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
internalColumn[internal_column_time] = Column.DateTime().Key();
internalColumn[internal_column_latest] = Column.Bool();
internalColumn[internal_column_composed] = Column.Bool();

const deleteRow_action = { internal_column_deleted: { $set: true } };

function getChangeTableName(name: string): string {
	return internal_prefix + "changes_" + name;
}


export class Store {
	private params: CreateStoreParams;
	private tables: TableSpecAny[];
	private db: DbWrapper;

	constructor(params: CreateStoreParams) {
		this.params = params;
		this.tables = [];
		this.db = null;
		invariant(this.params.db, "must pass a DbWrapper");
	}

	createTable<Element, Mutator, Query>(tableSpec: TableSpec<Element, Mutator, Query>): Table<Element, Mutator, Query> {
		function buildIndices(spec: TableSpecAny) {
			spec.indices = spec.indices || [];
			for (let col in spec.columns) {
				if (spec.columns[col].isIndex) {
					spec.indices.push([col]);
				}
			}
		}

		function createInternalTableSpec(spec: TableSpecAny): TableSpecAny {
			let newSpec = clone(spec);
			for (let col in internalColumn) {
				invariant(!spec.columns[col], "table %s cannot have reserved column name %s", spec.name, col);
				newSpec.columns[col] = internalColumn[col];
			}
			buildIndices(newSpec);
			return newSpec;
		}

		function createChangeTableSpec(spec: TableSpecAny): TableSpecAny {
			let newSpec = <TableSpecAny>{
				name: getChangeTableName(spec.name),
				columns: {
					key: Column.Int().Key(),
					time: Column.DateTime().Key(),
					change: Column.JSON(),
				}
			};
			buildIndices(newSpec);
			return newSpec;
		}

		invariant(!this.db, "createTable() can only be added before open()");
		invariant(!startsWith(tableSpec.name, internal_prefix), "table name %s cannot begin with %s", tableSpec.name, internal_prefix);
		for (let col in tableSpec.columns) {
			invariant(!startsWith(col, internal_prefix), "table %s column %s cannot begin with %s", tableSpec.name, col, internal_prefix);
		}
		let table = new Table<Element, Mutator, Query>(tableSpec);
		table.add = (...changes: TableChange<Element, Mutator>[]): Promise<any> => this.add(table, ...changes);
		table.find = (query: Query, opts?: FindOpts): Promise<Element[]> => this.find(table, query, opts);
		this.tables.push(createInternalTableSpec(tableSpec));
		this.tables.push(createChangeTableSpec(tableSpec));
		return table;
	}

	open(): Promise<any> {
		invariant(!this.db, "open() called more than once!");
		invariant(this.tables.length, "open() called before any tables were added");

		this.db = this.params.db;

		return Promise.resolve()
			.then(() => this.readSchema())
			.then((schema) => this.syncTables(schema));
		//.then(() => this.loadKeyValues());
	}

	readSchema(): Promise<Schema> {
		invariant(this.db, "readSchema(): not opened");

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
			invariant(matches, "bad format on index- couldn't determine column names from sql: %s", sql);
			return matches[1].split(",").map((x: string) => x.trim());
		}

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
									invariant(row.tbl_name in schema, "table %s used by index %s should have been returned first", row.tbl_name, row.name);
									invariant(col in schema[row.tbl_name].columns, "table %s does not have column %s used by index %s", row.tbl_name, col, row.name);
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


	private syncTables(schema: Schema): Promise<any> {
		invariant(this.db, "syncTables(): not opened");

		return this.db.transaction((transaction: DbTransaction) => {
			let p = Promise.resolve();
			this.tables.forEach(
				(table: TableSpecAny) => {
					p = p.then(() => this.syncTable(transaction, schema, table));
				}
			);
			return p;
		});
	}

	private syncTable(transaction: DbTransaction, schema: Schema, spec: TableSpecAny): Promise<any> {
		function createTable(name: string): Promise<any> {
			let cols: string[] = [];
			let pk: string[] = [];
			for (let col in spec.columns) {
				let attrs: Column = spec.columns[col];
				let decl: string;
				switch (attrs.type) {
					// case ColumnType.ptr:
					//   console.assert(attrs.ref != null);
					//   console.assert(attrs.ref.columns != null);
					//   console.assert(attrs.ret.table.name != null);
					//   console.assert(attrs.ref.key != null);
					//   let foreignCol: Column = attrs.ref.columns[attrs.ref.key];
					//   decl = col + " " + Column.sql(foreignCol);
					//   cols.push(decl);
					//   break;
				// case ColumnType.set:
				// 	break;

				default:
					decl = col + " " + Column.sql(attrs);
					cols.push(decl);
					if (attrs.isKey) {
						pk.push(col);
					}
					break;
				}
			}
			invariant(pk.length, "table %s has no keys", name);
			cols.push("PRIMARY KEY(" + pk.join(", ")  + ")");
			return transaction.executeSql("CREATE " + (spec.temp ? "TEMP " : "") + "TABLE " + name + " (" + cols.join(", ") + ")");
		}

		function dropTable(name: string): Promise<any> {
			return transaction.executeSql("DROP TABLE " + name);
		}

		function createIndices(force: boolean = false): Promise<any> {
			function indicesEqual(a: string[], b: string[]) {
				if (a.length != b.length) {
					return false;
				}
				for (let i = 0; i < a.length; i++) {
					if (a[i] != b[i]) {
						return false;
					}
				}
				return true;
			}

			let p = Promise.resolve();
			let oldIndices = (spec.name in schema) ? schema[spec.name].indices : [];
			let newIndices = spec.indices;
			function getIndexName(indices: string[]): string {
					return "index_" + spec.name + "__" + indices.join("_");
			}

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
					let sql = "CREATE INDEX " + getIndexName(index) + " ON " + spec.name + " (" + index.join(", ") + ")";
					p = p.then(() => transaction.executeSql(sql));
				}
			});

			return p;
		}

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

			let addedColumns: {[name: string]: Column} = {};
			if (!recreateTable) {
				for (let colName in newColumns) {
					if (!(colName in oldColumns)) {
						addedColumns[colName] = newColumns[colName];
					}
				}
			}

			if (recreateTable) {
				// recreate and migrate data
				function copyData(oldName: string, newName: string): Promise<any> {
					let oldTableColumns = Object.keys(oldColumns).filter(col => (col in spec.columns) || (col in renamedColumns));
					let newTableColumns = oldTableColumns.map(col => (col in renamedColumns) ? renamedColumns[col] : col);
					let p2 = Promise.resolve();
					if (oldTableColumns.length && newTableColumns.length) {
						let stmt = "INSERT INTO " + newName + " (" + newTableColumns.join(", ") + ") ";
						stmt += "SELECT " + oldTableColumns.join(", ") + " FROM " + oldName + ";";
						p2 = transaction.executeSql(stmt);
					}
					return p2;
				}

				function migrateChangeTable(changeTableName: string) {
					let deletedColumns = Object.keys(oldColumns).filter(col => !(col in spec.columns) && !(col in renamedColumns));
					let p2 = Promise.resolve();
					if (spec.renamedColumns || deletedColumns) {
						p2 = p2.then(() => {
							return transaction.each(
								"SELECT " + ROWID + ", change"
								+ " FROM " + changeTableName,
								[],
								(selectChangeTransaction: DbTransaction, row: any) => {
									let change = JSON.parse(row.change);
									let changed = false;
									for (let oldCol in spec.renamedColumns) {
										let newCol = spec.renamedColumns[oldCol];
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
												[JSON.stringify(change), row[ROWID]]
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

				function renameTable(oldName: string, newName: string): Promise<any> {
					return transaction.executeSql("ALTER TABLE " + oldName + " RENAME TO " + newName);
				}

				let tempTableName = "temp_" + spec.name;
				let changeTableName = getChangeTableName(spec.name);

				if (tempTableName in schema) {
					// yikes!  migration failed but transaction got committed?
					p = p.then(() => dropTable(tempTableName));
				}
				p = p.then(() => createTable(tempTableName));
				p = p.then(() => copyData(spec.name, tempTableName));
				p = p.then(() => dropTable(spec.name));
				p = p.then(() => renameTable(tempTableName, spec.name));
				p = p.then(() => migrateChangeTable(changeTableName));
				p = p.then(() => createIndices(true));
			}
			else if (addedColumns != {}) {
				// alter table, add columns
				Object.keys(addedColumns).forEach((colName) => {
					let col: Column = spec.columns[colName];
					let columnDecl = colName + " " + Column.sql(col);
					p = p.then(() => transaction.executeSql("ALTER TABLE " + spec.name + " ADD COLUMN " + columnDecl));
				});
				p = p.then(() => createIndices());
			}
			else {
				// no table modification is required
				p = p.then(() => createIndices());
			}
		}
		else {
			// create new table
			p = p.then(() => createTable(spec.name));
			p = p.then(() => createIndices(true));
		}

		return p;
	}


	add<Element, Mutator>(table: Table<Element, Mutator, any>, ...changes: TableChange<Element, Mutator>[]): Promise<any> {
		function insert(transaction: DbTransaction, tableName: string, columns: string[], values: any[]): Promise<any> {
			let questionMarks = values.map(v => "?");
			return transaction.executeSql("INSERT OR REPLACE INTO " + tableName + " (" + columns.join(", ") + ") VALUES (" + questionMarks.join(", ") + ")", values);
		}

		invariant(this.db, "apply(): not opened");
		let changeTable = getChangeTableName(table.spec.name);

		return this.db.transaction((transaction: DbTransaction): Promise<any> => {
			let p1 = Promise.resolve();
			let toResolve = new Set<KeyType>();
			changes.forEach((change: TableChange<Element, Mutator>) => {
				let time = change.time || Date.now();
				invariant((change.save ? 1 : 0) + (change.change ? 1 : 0) + (change.delete ? 1 : 0) === 1, "change (%s) must specify exactly one action at a time", JSON.stringify(change));
				if (change.save) {
					let element = change.save;
					let keyValue = table.keyValue(element);
					let columns = Object.keys(element).filter(k => k in table.spec.columns);
					let values: any[] = columns.map(k => element[k]);

					// append internal column values
					columns = [internal_column_time, ...columns];
					values = [time, ...values];

					p1 = p1.then(() => insert(transaction, table.spec.name, columns, values));
					toResolve.add(keyValue);
				}
				else if (change.change || change.delete) {
					// insert into change table
					let changeRow: ChangeRow = {
						key: null,
						time: time,
						change: null
					};
					if (change.change) {
						// store changes
						let mutator = clone(change.change);
						changeRow.key = table.keyValue(mutator);
						delete mutator[table.key];
						changeRow.change = JSON.stringify(mutator);
					}
					else {
						// mark deleted
						changeRow.key = change.delete;
						changeRow.change = JSON.stringify(deleteRow_action);
					}

					let columns = Object.keys(changeRow);
					let values: any[] = columns.map(k => changeRow[k]);
					p1 = p1.then(() => insert(transaction, changeTable, columns, values));
					toResolve.add(changeRow.key);
				}
				else {
					throw new Error("no operation specified for change- should be one of save, change, or delete");
				}
			});

			// these could be done in parallel
			toResolve.forEach((keyValue: KeyType) => {
				let baselineCols = [ROWID, internal_column_time, internal_column_deleted, ...Object.keys(table.spec.columns)];
				p1 = p1.then(() => transaction.executeSql(
					"SELECT " + baselineCols.join(", ")
					+ " FROM " + table.spec.name
					+ " WHERE " + table.key + "=?" + " AND " + internal_column_composed + "=0"
					+ " ORDER BY " + internal_column_time + " DESC"
					+ " LIMIT 1",
					[keyValue],
					(tx1: DbTransaction, baselineResults: any[]): Promise<any> => {
						let baseline = <Element>{};
						let baseTime = 0;
						let baseRowId = -1;
						if (baselineResults.length) {
							baseline = <Element>baselineResults[0];
							baseTime = baseline[internal_column_time];
							invariant(ROWID in baseline, "object has no ROWID (%s) - it has [%s]", ROWID, Object.keys(baseline).join(", "));
							baseRowId = baseline[ROWID];
						}
						else {
							baseline[table.key] = keyValue;
						}
						let mutation = baseline;
						let mutationTime = baseTime;

						return tx1.executeSql(
							"SELECT key, time, change"
							+ " FROM " + changeTable
							+ " WHERE key=? AND time>=?"
							+ " ORDER BY time ASC",
							[keyValue, baseTime],
							(tx2: DbTransaction, changeResults: any[]): Promise<any> => {
								let p2 = Promise.resolve();
								for (let i = 0; i < changeResults.length; i++) {
									let row = <ChangeRow>changeResults[i];
									let mutator = <Mutator>JSON.parse(row.change);
									mutation = mutate(mutation, mutator);
									mutationTime = Math.max(mutationTime, row.time);
								}

								if (baseRowId != -1 && !isMutated(mutation, baseline)) {
									// mark it as latest (and others as not)
									p2 = p2.then(() => tx2.executeSql(
										"UPDATE " + table.spec.name
										+ " SET " + internal_column_latest + "=(" + ROWID + "=" + baseRowId + ")"
										+ " WHERE " + table.key + "=?",
										[keyValue])
									);
								}
								else {
									// invalidate old latest rows
									p2 = p2.then(() => tx2.executeSql(
										"UPDATE " + table.spec.name
										+ " SET " + internal_column_latest + "=0"
										+ " WHERE " + table.key + "=?",
										[keyValue])
									);

									// insert new latest row
									mutation[internal_column_latest] = true;
									mutation[internal_column_time] = mutationTime;
									mutation[internal_column_composed] = true;
									let columns = Object.keys(mutation).filter(key => (key in table.spec.columns) || (key in internalColumn));
									let values = columns.map(col => mutation[col]);
									p2 = p2.then(() => insert(tx2, table.spec.name, columns, values));
								}

								return p2;
							}
						);
					}
				));
			});
			return p1;
		});
	}

	find<Element, Query>(table: Table<Element, any, Query>, query: Query, opts?: FindOpts): Promise<Element[]> {
		opts = opts || {};

		const numericConditions = {
			$gt: ">",
			$gte: ">=",
			$lt: "<",
			$lte: "<="
		};

		const inCondition = keyOf({ $in: false });

		let conditions: string[] = [];
		let values: (string | number)[] = [];

		conditions.push("NOT " + internal_column_deleted);
		conditions.push(internal_column_latest);

		for (let col in query) {
			let spec = query[col];
			let found = false;

			for (let condition in numericConditions) {
				if (hasOwnProperty.call(spec, condition)) {
					conditions.push("(" + col + numericConditions[condition] + "?)");
					let value = spec[condition];
					invariant(parseInt(value, 10) == value, "condition %s must have a numeric argument: %s", condition, value);
					values.push(value);
					found = true;
					break;
				}
			}

			if (!found) {
				if (hasOwnProperty.call(spec, inCondition)) {
					invariant(spec[inCondition] instanceof Array, "must be an array: %s", JSON.stringify(spec[inCondition]));
					conditions.push(col + " IN (" + spec[inCondition].map((x: any) => "?").join(", ") + ")");
					values.push(...spec[inCondition]);
					found = true;
				}
			}

			if (!found) {
				if (table.spec.columns[col].type == ColumnType.bool) {
					conditions.push((spec ? "" : "NOT ") + col);
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
					invariant(!arg.match(/(\$|\^|\*|\.|\(|\)|\[|\]|\?)/), "RegExp search only supports simple wildcards (.* and .): %s", arg);
					conditions.push("(" + col + " LIKE ?)");
					values.push(arg);
					found = true;
				}

				invariant(found, "unknown query condition for %s: %s", col, JSON.stringify(spec));
			}
		}

		let columns: string[] = Object.keys(opts.fields || table.spec.columns);
		let stmt = "SELECT " + (opts.count ? COUNT : columns.join(", "));
		stmt += " FROM " + table.spec.name;
		stmt += " WHERE " + conditions.join(" AND ");

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

		return this.db.readTransaction((tx1: DbTransaction): Promise<any> => {
			return tx1.executeSql(stmt, values, (tx2: DbTransaction, rows: any[]) => {
				if (opts.count) {
					let count = parseInt(rows[0][COUNT], 10);
					return Promise.resolve(count);
				}
				else {
					let results: Element[] = [];
					for (let i = 0; i < rows.length; i++) {
						let row = rows[i];
						for (let col in row) {
							if (table.spec.columns[col].type == ColumnType.bool) {
								row[col] = (row[col] && row[col] != 'false') ? true : false;
							}
						}
						// TODO: add constructable objects
						results.push(row);
					}
					return Promise.resolve(results);
				}
			});
		});
	}

}


export function createStore(params: CreateStoreParams): Store {
	return new Store(params);
}
