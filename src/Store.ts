///<reference path="./websql.d.ts"/>
'use strict';

import { Column, ColumnType, ColumnSet } from "./Column";
import { TableSpec, Table, TableChange, keyOf } from "./Table";
import { IDatabase } from "./WebsqlWrapper";
import invariant = require("invariant");
import clone = require("clone");


function startsWith(str: string, val: string) {
	return str.lastIndexOf(val, 0) === 0;
}

type TableSpecAny = TableSpec<any, any, any>;

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

export class Schema {
	[table: string]: TableSpecAny;
}

interface SqliteMasterRow {
	type: string;
	name: string;
	tbl_name: string;
	sql: string;
}


const internal_prefix = 'updraft_';
const internalColumn: ColumnSet = {};
internalColumn[internal_prefix + 'deleted'] = Column.Bool();
internalColumn[internal_prefix + 'time'] = Column.DateTime();
internalColumn[internal_prefix + 'latest'] = Column.Bool();

export class Store {
	private params: CreateStoreParams;
	private tables: TableSpecAny[];
	private db: Database;

	constructor(params: CreateStoreParams) {
		this.params = params;
		this.tables = [];
		this.db = null;
	}

	createTable<Element, Mutator, Query>(spec: TableSpec<Element, Mutator, Query>): Table<Element, Mutator, Query> {
		invariant(!this.db, "createTable() can only be added before open()");
		invariant(!startsWith(spec.name, internal_prefix), "table name %s cannot begin with %s", spec.name, internal_prefix);
		for(var col in spec.columns) {
			invariant(!startsWith(col, internal_prefix), "table %s column %s cannot begin with %s", spec.name, col, internal_prefix);
		}
		var table = new Table<Element, Mutator, Query>(spec);
		table.add = (...changes: TableChange<Element, Mutator>[]): Promise<any> => this.add(table, ...changes);
		table.find = (query: Query): Promise<Element[]> => this.find(table, query);
		this.tables.push(this.createInternalTableSpec(spec));
		this.tables.push(this.createChangeTableSpec(spec));
		return table;
	}
	
	private buildIndices(spec: TableSpecAny) {
		spec.indices = spec.indices || [];
		for(var col in spec.columns) {
			if (spec.columns[col].isIndex) {
				spec.indices.push([col]);
			}
		}
	}

	private createInternalTableSpec(spec: TableSpecAny): TableSpecAny {
		var newSpec = clone(spec);
		for(var col in internalColumn) {
			invariant(!spec.columns[col], "table %s cannot have reserved column name %s", spec.name, col);
			newSpec.columns[col] = internalColumn[col];
		}
		this.buildIndices(newSpec);
		return newSpec;
	}

	private changeTableName(name: string): string {
		return internal_prefix + 'changes_' + name;
	}

	private createChangeTableSpec(spec: TableSpecAny): TableSpecAny {
		var spec = <TableSpecAny>{
			name: this.changeTableName(spec.name),
			columns: {
				key: Column.Int().Index(),
				time: Column.DateTime(),
				change: Column.JSON(),
			}
		};
		
		this.buildIndices(spec);
		return spec;
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

		function tableFromSql(name: string, sql: string): TableSpecAny {
			var table = <TableSpecAny>{ name: name, columns: {}, indices: [], triggers: {} };
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
						table.columns[parts[1]] = Column.fromSql(parts[2]);
					}
				}
			}
			return table;
		}
		
		function indexFromSql(sql: string): string[] {
			var regex = /\((.*)\)/;
			var matches = regex.exec(sql);
			invariant(matches, "bad format on index- couldn't determine column names from sql: %s", sql);
			return matches[1].split(',').map((x: string) => x.trim());
		}

		var schema: Schema = {};
		return new Promise((resolve, reject) => {
			this.db.readTransaction((transaction: SQLTransaction) => {
				transaction.executeSql('SELECT name, tbl_name, type, sql FROM sqlite_master', [], (tx: SQLTransaction, resultSet: SQLResultSet) => {
					for (var i = 0; i < resultSet.rows.length; i++) {
						var row = <SqliteMasterRow>resultSet.rows.item(i);
						if (row.name[0] != '_' && !startsWith(row.name, 'sqlite')) {
							switch (row.type) {
								case 'table':
									schema[row.name] = tableFromSql(row.name, row.sql);
									break;
								case 'index':
									var index = indexFromSql(row.sql);
									if(index.length == 1) {
										var col = index[0];
										invariant(row.tbl_name in schema, "table %s used by index %s should have been returned first", row.tbl_name, row.name);
										invariant(col in schema[row.tbl_name].columns, "table %s does not have column %s used by index %s", row.tbl_name, col, row.name);
										schema[row.tbl_name].columns[col].isIndex = true;
									}
									else {
										schema[row.tbl_name].indices.push(index);
									}
									break;
								case 'trigger':
									//schema[row.tbl_name].triggers[row.name] = row.sql;
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
				this.tables.map((table: TableSpecAny) => {
					this.syncTable(transaction, schema, table);
				});
			},
			(error: SQLError) => {
				this.reportError(error);
				reject(error);
			},
			() => {
				resolve();
			});
		});
	}

	private syncTable(transaction: SQLTransaction, schema: Schema, spec: TableSpecAny) {
		function createTable(name: string) {
			var cols: string[] = [];
			for (var col in spec.columns) {
				var attrs: Column = spec.columns[col];
				var decl: string;
				switch (attrs.type) {
					// case ColumnType.ptr:
					//   console.assert(attrs.ref != null);
					//   console.assert(attrs.ref.columns != null);
					//   console.assert(attrs.ret.table.name != null);
					//   console.assert(attrs.ref.key != null);
					//   var foreignCol: Column = attrs.ref.columns[attrs.ref.key];
					//   decl = col + ' ' + Column.sql(foreignCol);
					//   cols.push(decl);
					//   break;
				// case ColumnType.set:
				// 	break;

				default:
					decl = col + ' ' + Column.sql(attrs);
					cols.push(decl);
					break;
				}
			}
			transaction.executeSql('CREATE ' + (spec.temp ? 'TEMP ' : '') + 'TABLE ' + name + ' (' + cols.join(', ') + ')');
		}

		function dropTable(name: string) {
			transaction.executeSql('DROP TABLE ' + name);
		}

		function createIndices(force: boolean = false) {
			function indicesEqual(a: string[], b: string[]) {
				if(a.length != b.length) {
					return false;
				}
				for(var i=0; i<a.length; i++) {
					if(a[i] != b[i]) {
						return false;
					}
				}
				return true;
			}

			var oldIndices = (spec.name in schema) ? schema[spec.name].indices : [];
			var newIndices = spec.indices;
			for(var i=0; i<oldIndices.length; i++) {
				var drop = true;
				
				for(var j=0; j<newIndices.length; j++) {
					if(indicesEqual(oldIndices[i], newIndices[j])) {
						drop = false;
						break;
					}
				}
				
				if(drop) {
					transaction.executeSql('DROP INDEX ' + name);
				}
			}
			
			for(var j=0; j<newIndices.length; j++) {
				var create = true;
				
				for(var i=0; i<oldIndices.length; i++) {
					if(indicesEqual(oldIndices[i], newIndices[j])) {
						create = false;
						break;
					}
				}
				
				if(create || force) {
					var index = newIndices[j];
					var name = 'index_' + spec.name + '__' + index.join('_');
					var sql = 'CREATE INDEX ' + name + ' ON ' + spec.name + ' (' + index.join(', ') + ')';
					transaction.executeSql(sql);
				}
			}
		}

		var recreateTable: boolean = false;
		if (spec.name in schema) {
			var oldColumns = schema[spec.name].columns;
			var newColumns = spec.columns;
			
			for(var col in oldColumns) {
				if(!(col in newColumns)) {
					recreateTable = true;
					break;
				}
				
				var oldCol = oldColumns[col];
				var newCol = newColumns[col];
				if(!Column.equal(oldCol, newCol)) {
					recreateTable = true;
					break;
				}
			}
			
			var renamedColumns = spec.renamedColumns || {};
			if (!recreateTable) {
				for (var col in renamedColumns) {
					if (col in oldColumns) {
						recreateTable = true;
						break;
					}
				}
			}
			
			var addedColumns: Column[] = [];
			if(!recreateTable) {
				for(var col in newColumns) {
					if(!(col in oldColumns)) {
						addedColumns.push(newColumns[col]);
					}
				}
			}
			
			if (recreateTable) {
				// recreate and migrate data
				function copyData(oldName: string, newName: string) {
					var oldTableColumns = Object.keys(newColumns).filter(col => (col in spec.columns) || (col in renamedColumns));
					var newTableColumns = oldTableColumns.map(col => (col in renamedColumns) ? renamedColumns[col] : col);
					if (oldTableColumns.length && newTableColumns.length) {
						var stmt = "INSERT INTO " + newName + " (" + newTableColumns.join(", ") + ") ";
						stmt += "SELECT " + oldTableColumns.join(", ") + " FROM " + oldName + ";";
						// TODO: clean up error handling
						transaction.executeSql(stmt, null, (err) => invariant(!err, "error executing %s: %s", stmt, err));
					}
				}

				function renameTable(oldName: string, newName: string) {
					var stmt = 'ALTER TABLE ' + oldName + ' RENAME TO ' + newName;
					transaction.executeSql(stmt, null, (err) => invariant(!err, "error executing %s: %s", stmt, err));
				}

				var tempTableName = 'temp_' + spec.name;
				
				if (tempTableName in schema) {
					// yikes!  migration failed but transaction got committed?
					dropTable(tempTableName);
				}
				createTable(tempTableName);
				copyData(spec.name, tempTableName);
				dropTable(spec.name);
				renameTable(tempTableName, spec.name);
				createIndices(true);
			}
			else if (addedColumns.length > 0) {
				// alter table, add columns
				for(var col in addedColumns) {
					var attrs: Column = spec.columns[col];
					var columnDecl = col + ' ' + Column.sql(attrs);
					var stmt = 'ALTER TABLE ' + spec.name + ' ADD COLUMN ' + columnDecl;
					transaction.executeSql(stmt, null, (err) => invariant(!err, "error executing %s: %s", stmt, err));
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
			createTable(spec.name);
			createIndices(true);
		}
	}

	private reportError(error: SQLError) {
		console.log(error);
	}


	add<Element, Mutator>(table: Table<Element, Mutator, any>, ...changes: TableChange<Element, Mutator>[]): Promise<any> {
		invariant(this.db, "apply(): not opened");

		return new Promise((resolve, reject) => {
			this.db.transaction((transaction: SQLTransaction) => {
				for(var i=0; i<changes.length; i++) {
					var change = changes[i];
					var time = change.time || Date.now();
					invariant((change.save ? 1 : 0) + (change.change ? 1 : 0) + (change.delete ? 1 : 0) === 1, 'change must specify exactly one action at a time');
					if(change.save) {
						var element = change.save;
						var columns = Object.keys(element).filter(k => k in table.spec.columns);
						var values = columns.map(k => element[k]);
						//columns = [TIMESTAMP, ...columns];
						//values = [time, ...values];
						var questionMarks = values.map(v => '?');
						transaction.executeSql('INSERT OR REPLACE INTO ' + table.spec.name + ' (' + columns.join(', ') + ') VALUES (' + questionMarks.join(', ') + ')', values);
					}
					else if(change.change) {
						var mutator = change.change;
						var key = table.keyValue(mutator);
						// insert into change table
					}
					else if(change.delete) {
						// mark deleted
					}
					else {
						throw new Error("no operation specified for change- should be one of save, change, or delete");
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
