///<reference path="./websql.d.ts"/>

import { Column, ColumnType } from "./Column";
import { TableSpec, Table, TableChange } from "./Table";
import { IDatabase } from "./WebsqlWrapper";
import invariant = require("invariant");
import clone = require("clone");


function startsWith(str: string, val: string) {
	return str.lastIndexOf(val, 0) === 0;
}


export interface CreateStoreParams1 {
	name: string;
	version?: string;
	description?: string;
	size?: number;
}


export interface CreateStoreParams2 {
	db: Database;
}

export type CreateStoreParams = CreateStoreParams1 | CreateStoreParams2;

export class SchemaTable {
	_indices: Object;
	_triggers: Object;
	[column: string]: any;
}

export class Schema {
	[table: string]: SchemaTable;
}


export class Store {
	private params: CreateStoreParams;
	private tables: Table<any, any, any>[];
	private db: Database;

	constructor(params: CreateStoreParams) {
		this.params = params;
		this.tables = [];
		this.db = null;
	}

	addTable<Element, Mutator, Query>(tableSpec: TableSpec<Element, Mutator, Query>): Table<Element, Mutator, Query> {
		invariant(!this.db, "addTable() can only be added before open()");
		var table = new Table<Element, Mutator, Query>(tableSpec);
		table.apply = (...changes: TableChange<Element, Mutator>[]): Promise<any> => this.apply(table, ...changes);
		table.find = (query: Query): Promise<Element[]> => this.find(table, query);
		this.tables.push(table);
		return table;
	}

	open(): Promise<any> {
		invariant(!this.db, "open() called more than once!");
		invariant(this.tables.length, "open() called before any tables were added");

		var p: Promise<any>;

		if ((<CreateStoreParams2>this.params).db) {
			this.db = (<CreateStoreParams2>this.params).db;
			p = Promise.resolve();
		}
		else {
			var params = <CreateStoreParams1>this.params;
			var name = params.name;
			var version = params.version || "1.0";
			var description = params.description || "updraft created database";
			var size = params.size || 5 * 1024 * 1024;

			p = new Promise((resolve, reject) => {
				window.openDatabase(name, version, description, size, (database: Database) => {
					invariant(database, "open(): no database was created");
					this.db = database;
					resolve();
				});
			});
		}

		return p
			.then(() => this.readSchema())
			.then((schema) => this.syncTables(schema));
		//.then(() => this.loadKeyValues());
	}

	readSchema(): Promise<Schema> {
		invariant(this.db, "readSchema(): not opened");
		function tableFromSql(sql: string): SchemaTable {
			var table = <SchemaTable>{ _indices: {}, _triggers: {} };
			var matches = sql.match(/\((.*)\)/);
			if (matches) {
				var fields = matches[1].split(',');
				for (var i = 0; i < fields.length; i++) {
					var ignore = /^\s*(primary|foreign)\s+key/i;  // ignore standalone 'PRIMARY KEY xxx'
					if (fields[i].match(ignore)) {
						continue;
					}
					var quotedName = /"(.+)"\s+(.*)/;
					var unquotedName = /(\w+)\s+(.*)/;
					var parts = fields[i].match(quotedName);
					if (!parts) {
						parts = fields[i].match(unquotedName);
					}
					if (parts) {
						table[parts[1]] = parts[2];
					}
				}
			}
			return table;
		}

		var schema: Schema = {};
		return new Promise((resolve, reject) => {
			this.db.readTransaction((transaction: SQLTransaction) => {
				transaction.executeSql('SELECT name, tbl_name, type, sql FROM sqlite_master', [], (tx: SQLTransaction, resultSet: SQLResultSet) => {
					for (var i = 0; i < resultSet.rows.length; i++) {
						var row: any = resultSet.rows.item(i);
						if (row.name[0] != '_' && !startsWith(row.name, 'sqlite')) {
							switch (row.type) {
								case 'table':
									schema[row.name] = tableFromSql(row.sql);
									break;
								case 'index':
									schema[row.tbl_name]._indices = schema[row.tbl_name]._indices || {};
									schema[row.tbl_name]._indices[row.name] = row.sql;
									break;
								case 'trigger':
									schema[row.tbl_name]._triggers = schema[row.tbl_name]._triggers || {};
									schema[row.tbl_name]._triggers[row.name] = row.sql;
									break;
							}
						}
					}
				});
			},
			(error: SQLError) => {
				this.reportError(error);
				reject(error);
			},
			() => {
				resolve(schema);
			});
		});
	}


	private syncTables(schema: Schema): Promise<any> {
		invariant(this.db, "syncTables(): not opened");

		return new Promise((resolve, reject) => {
			this.db.transaction((transaction: SQLTransaction) => {
				this.tables.map((table: Table<any, any, any>) => {
					this.syncTable(transaction, schema, table);
				});
			},
			(error: SQLError) => {
			},
			() => {
				resolve();
			});
		});
	}

	private syncTable(transaction: SQLTransaction, schema: Schema, table: Table<any,any,any>) {
		function createTable(name: string) {
			var cols: string[] = [];
			for (var col in table.spec.columns) {
				var attrs: Column = table.spec.columns[col];
				var decl: string;
				switch (attrs.type) {
					// case ColumnType.ptr:
					//   console.assert(attrs.ref != null);
					//   console.assert(attrs.ref.columns != null);
					//   console.assert(attrs.retable.spec.name != null);
					//   console.assert(attrs.ref.key != null);
					//   var foreignCol: Column = attrs.ref.columns[attrs.ref.key];
					//   decl = col + ' ' + Column.sql(foreignCol);
					//   cols.push(decl);
					//   break;
				case ColumnType.set:
					break;

				default:
					decl = col + ' ' + Column.sql(attrs);
					if (table.key == col) {
						decl += ' PRIMARY KEY';
					}
					cols.push(decl);
					break;
				}
			}
			transaction.executeSql('CREATE ' + (table.spec.temp ? 'TEMP ' : '') + 'TABLE ' + name + ' (' + cols.join(', ') + ')');
		}

		function dropTable(name: string) {
			transaction.executeSql('DROP TABLE ' + name);
		}

		function createIndices(force: boolean = false) {
			var toRemove = (table.spec.name in schema) ? clone(schema[table.spec.name]._indices) : {};
			for (var index of table.spec.indices || []) {
				var name = 'index_' + table.spec.name + '__' + index.join('_');
				var sql = 'CREATE INDEX ' + name + ' ON ' + table.spec.name + ' (' + index.join(', ') + ')';
				delete toRemove[name];
				var create = true;
				var drop = false;
				if (schema[table.spec.name] && schema[table.spec.name]._indices && schema[table.spec.name]._indices[name]) {
					if (schema[table.spec.name]._indices[name] === sql) {
						create = false;
					} else {
						drop = true;
					}
				}

				if (drop) {
					transaction.executeSql('DROP INDEX ' + name);
				}
				if (create || force) {
					transaction.executeSql(sql);
				}
			}

			// delete orphaned indices
			for (var name of Object.keys(toRemove)) {
				transaction.executeSql('DROP INDEX ' + name);
			}
		}

		if (table.spec.name in schema) {
			var columns = clone(schema[table.spec.name]);
			delete columns._indices;
			delete columns._triggers;
			var key: string;

			var addedColumns: string[] = [];
			var addedForeignKey = false;
			if (key in table.spec.columns) {
				if (!(key in columns)) {
					addedColumns.push(key);
					// if (table.spec.columns[key].ref) {
					//   addedForeignKey = true;
					// }
				}
			}

			var renamedColumns = clone(table.spec.renamedColumns) || {};
			for (key in Object.keys(renamedColumns)) {
				if (!(key in columns)) {
					delete renamedColumns[key];
				}
			}

			var deletedColumns = Object.keys(columns).filter((col: string) => !(col in table.spec.columns));

			var recreateTable = (addedForeignKey || Object.keys(renamedColumns).length > 0 || deletedColumns.length > 0);
			if (recreateTable) {
				// recreate and migrate data
				function copyData(oldName: string, newName: string) {
					var oldTableColumns = Object.keys(columns).filter(col => (col in table.spec.columns) || (col in renamedColumns));
					var newTableColumns = oldTableColumns.map(col => (col in renamedColumns) ? renamedColumns[col] : col);
					if (oldTableColumns.length && newTableColumns.length) {
						var stmt = "INSERT INTO " + newName + " (" + newTableColumns.join(", ") + ") ";
						stmt += "SELECT " + oldTableColumns.join(", ") + " FROM " + oldName + ";";
						transaction.executeSql(stmt);
					}
				}

				function renameTable(oldName: string, newName: string) {
					transaction.executeSql('ALTER TABLE ' + oldName + ' RENAME TO ' + newName);
				}

				var tempTableName = 'temp_' + table.spec.name;
				invariant(!(tempTableName in schema), "database is in bad state: table '%s' should not exist", tempTableName);

				createTable(tempTableName);
				copyData(table.spec.name, tempTableName);
				dropTable(table.spec.name);
				renameTable(tempTableName, table.spec.name);
				createIndices(true);
			}
			else if (addedColumns.length > 0) {
				// alter table, add columns
				for(var columnName in addedColumns) {
					var attrs: Column = table.spec.columns[columnName];
					var columnDecl = columnName + ' ' + Column.sql(attrs);
					transaction.executeSql('ALTER TABLE ' + table.spec.name + ' ADD COLUMN ' + columnDecl);
				}
				createIndices();
			}
			else {
				// no table modification is required
				createIndices();
			}
		}
		else {
			// create new table
			createTable(table.spec.name);
			createIndices(true);
		}
	}

	private reportError(error: SQLError) {
		console.log(error);
	}


	apply<Element, Mutator>(table: Table<Element, Mutator, any>, ...changes: TableChange<Element, Mutator>[]): Promise<any> {
		invariant(this.db, "apply(): not opened");

		return new Promise((resolve, reject) => {
			this.db.transaction((transaction: SQLTransaction) => {
				for(var i=0; i<changes.length; i++) {
					var change = changes[i];
					var when = change.when || Date.now();
					if(change.save) {
						var element = change.save;
						var key = table.keyOf(element);
						var columns = Object.keys(element).filter(k => k in table.spec.columns);
						var values = columns.map(k => element[k]);
						//columns = [TIMESTAMP, ...columns];
						//values = [when, ...values];
						var questionMarks = values.map(v => '?');
						transaction.executeSql('INSERT OR REPLACE INTO ' + table.spec.name + ' (' + columns.join(', ') + ') VALUES (' + questionMarks.join(', ') + ')', values);
					}
					else if(change.change) {
						var mutator = change.change;
						var key = table.keyOf(mutator);
						// insert into change table
					}
					else if(change.delete) {
						// mark deleted
					}
					else {
						throw new Error("no operation specified for change- should be one of save, change, or delete")
					}
					//transaction.executeSql()
				}
			},
			(error: SQLError) => {
			},
			() => {
				resolve();
			});
		});
	}

	find<Element, Query>(table: Table<Element, any, Query>, query: Query): Promise<Element[]> {
		return null;
	}

}


export function createStore(params: CreateStoreParams): Store {
	return new Store(params);
}
