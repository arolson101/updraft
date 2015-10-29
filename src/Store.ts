///<reference path="./websql.d.ts"/>

import { TableSpec, Table } from "./Table";
import { CreateDatabaseFcn } from "./WebsqlWrapper";
import invariant = require("invariant");


function startsWith(str: string, val: string) {
    return str.lastIndexOf(val, 0) === 0;
}

export interface CreateStoreParams {
	name: string;
	version?: string;
	description?: string;
	size?: number;
	create?: CreateDatabaseFcn;
}

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
		this.tables.push(table);
		return table;
	}

	open(): Promise<any> {
		invariant(!this.db, "open() called more than once!");
		invariant(this.tables.length, "open() called before any tables were added");

		var create: CreateDatabaseFcn = this.params.create || window.openDatabase;
		var name = this.params.name;
		var version = this.params.version || "1.0";
		var description = this.params.description || "updraft created database";
		var size = this.params.size || 5 * 1024 * 1024;

		var p = new Promise((resolve, reject) => {
			create(name, version, description, size, (database: Database) => {
				invariant(database, "open(): no database was created");
				this.db = database;
				resolve();
			});
		});

		return p;

		// return this.readSchema()
		// 	.then((schema) => this.syncTables(schema))
		// 	.then(() => this.loadKeyValues());
	}


    readSchema(): Promise<Schema> {
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

		return new Promise((resolve, reject) => {
			this.db.readTransaction((transaction: SQLTransaction) => {
				transaction.executeSql('SELECT name, tbl_name, type, sql FROM sqlite_master', [], (transaction: SQLTransaction, resultSet: SQLResultSet) => {
					var schema: Schema = {};
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
					return resolve(schema);
				}),
				(error: SQLError) => {
					this.reportError(error);
					reject(error);
				}
			})
		});
    }

    reportError(error: SQLError) {
		console.log(error);
    }

}


export function createStore(params: CreateStoreParams): Store {
	return new Store(params);
}
