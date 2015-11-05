'use strict';

import { hasOwnProperty, keyOf, mutate, isMutated } from "./Mutate";
import { Column, ColumnType, ColumnSet } from "./Column";
import { DbWrapper, DbTransactionCallback, DbTransaction, DbResultsCallback } from "./Database";
import { TableSpec, Table, TableChange, tableKey, KeyType } from "./Table";
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


const ROWID = '_rowid_';
const internal_prefix = 'updraft_';
const internal_column_deleted = internal_prefix + 'deleted'; 
const internal_column_time = internal_prefix + 'time'; 
const internal_column_latest = internal_prefix + 'latest'; 
const internalColumn: ColumnSet = {};
internalColumn[internal_column_deleted] = Column.Bool();
internalColumn[internal_column_time] = Column.DateTime().Key();
internalColumn[internal_column_latest] = Column.Bool();

const deleteRow_action = { internal_column_deleted: { $set: true } };

function getChangeTableName(name: string): string {
	return internal_prefix + 'changes_' + name;
}


export class Store {
	private params: CreateStoreParams;
	private tables: TableSpecAny[];
	private db: DbWrapper;

	constructor(params: CreateStoreParams) {
		this.params = params;
		this.tables = [];
		this.db = null;
		invariant(this.params.db, "must pass a DbWrapper")
	}

	createTable<Element, Mutator, Query>(spec: TableSpec<Element, Mutator, Query>): Table<Element, Mutator, Query> {
		function buildIndices(spec: TableSpecAny) {
			spec.indices = spec.indices || [];
			for(var col in spec.columns) {
				if (spec.columns[col].isIndex) {
					spec.indices.push([col]);
				}
			}
		}
	
		function createInternalTableSpec(spec: TableSpecAny): TableSpecAny {
			var newSpec = clone(spec);
			for(var col in internalColumn) {
				invariant(!spec.columns[col], "table %s cannot have reserved column name %s", spec.name, col);
				newSpec.columns[col] = internalColumn[col];
			}
			buildIndices(newSpec);
			return newSpec;
		}
	
		function createChangeTableSpec(spec: TableSpecAny): TableSpecAny {
			var spec = <TableSpecAny>{
				name: getChangeTableName(spec.name),
				columns: {
					key: Column.Int().Key(),
					time: Column.DateTime().Key(),
					change: Column.JSON(),
				}
			};
			buildIndices(spec);
			return spec;
		}
	
		invariant(!this.db, "createTable() can only be added before open()");
		invariant(!startsWith(spec.name, internal_prefix), "table name %s cannot begin with %s", spec.name, internal_prefix);
		for(var col in spec.columns) {
			invariant(!startsWith(col, internal_prefix), "table %s column %s cannot begin with %s", spec.name, col, internal_prefix);
		}
		var table = new Table<Element, Mutator, Query>(spec);
		table.add = (...changes: TableChange<Element, Mutator>[]): Promise<any> => this.add(table, ...changes);
		table.find = (query: Query): Promise<Element[]> => this.find(table, query);
		this.tables.push(createInternalTableSpec(spec));
		this.tables.push(createChangeTableSpec(spec));
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
			var table = <TableSpecAny>{ name: name, columns: {}, indices: [], triggers: {} };
			var matches = sql.match(/\((.*)\)/);
			if (matches) {
				var pksplit: string[] = matches[1].split(/PRIMARY KEY/i);
				var fields = pksplit[0].split(',');
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
				
				if(pksplit.length > 1) {
					var pk = pksplit[1].match(/\((.*)\)/);
					if(pk) {
						var keys = pk[1].split(',');
						for(var i=0; i<keys.length; i++) {
							var key = keys[i].trim();
							table.columns[key].isKey = true;
						}
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
		return this.db.readTransaction((transaction: DbTransaction) => {
			return transaction.executeSql('SELECT name, tbl_name, type, sql FROM sqlite_master', [], (tx: DbTransaction, resultSet: any[]) => {
				for (var i = 0; i < resultSet.length; i++) {
					var row = <SqliteMasterRow>resultSet[i];
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
				
				return null;
			});
		}).then(() => Promise.resolve(schema));
	}


	private syncTables(schema: Schema): Promise<any> {
		invariant(this.db, "syncTables(): not opened");

		return this.db.transaction((transaction: DbTransaction) => {
			var p = Promise.resolve(); 
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
			var cols: string[] = [];
			var pk: string[] = [];
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
					if (attrs.isKey) {
						pk.push(col);
					}
					break;
				}
			}
			invariant(pk.length, "table %s has no keys", name);
			cols.push('PRIMARY KEY(' + pk.join(', ')  + ')');
			return transaction.executeSql('CREATE ' + (spec.temp ? 'TEMP ' : '') + 'TABLE ' + name + ' (' + cols.join(', ') + ')');
		}

		function dropTable(name: string): Promise<any> {
			return transaction.executeSql('DROP TABLE ' + name);
		}

		function createIndices(force: boolean = false): Promise<any> {
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

			var p = Promise.resolve();
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
					p = p.then(() => transaction.executeSql('DROP INDEX ' + name));
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
					p = p.then(() => transaction.executeSql(sql));
				}
			}

			return p;
		}

		var p = Promise.resolve();
		if (spec.name in schema) {
			var oldColumns = schema[spec.name].columns;
			var newColumns = spec.columns;
			var recreateTable: boolean = false;
			
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
				function copyData(oldName: string, newName: string): Promise<any> {
					var oldTableColumns = Object.keys(newColumns).filter(col => (col in spec.columns) || (col in renamedColumns));
					var newTableColumns = oldTableColumns.map(col => (col in renamedColumns) ? renamedColumns[col] : col);
					if (oldTableColumns.length && newTableColumns.length) {
						var stmt = "INSERT INTO " + newName + " (" + newTableColumns.join(", ") + ") ";
						stmt += "SELECT " + oldTableColumns.join(", ") + " FROM " + oldName + ";";
						return transaction.executeSql(stmt);
					}
					else {
						return Promise.resolve();
					}
				}

				function renameTable(oldName: string, newName: string): Promise<any> {
					return transaction.executeSql('ALTER TABLE ' + oldName + ' RENAME TO ' + newName);
				}

				var tempTableName = 'temp_' + spec.name;
				
				if (tempTableName in schema) {
					// yikes!  migration failed but transaction got committed?
					p = p.then(() => dropTable(tempTableName));
				}
				p = p.then(() => createTable(tempTableName));
				p = p.then(() => copyData(spec.name, tempTableName));
				p = p.then(() => dropTable(spec.name));
				p = p.then(() => renameTable(tempTableName, spec.name));
				p = p.then(() => createIndices(true));
			}
			else if (addedColumns.length > 0) {
				// alter table, add columns
				for(var col in addedColumns) {
					var attrs: Column = spec.columns[col];
					var columnDecl = col + ' ' + Column.sql(attrs);
					p = p.then(() => transaction.executeSql('ALTER TABLE ' + spec.name + ' ADD COLUMN ' + columnDecl));
				}
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
			var questionMarks = values.map(v => '?');
			return transaction.executeSql('INSERT OR REPLACE INTO ' + tableName + ' (' + columns.join(', ') + ') VALUES (' + questionMarks.join(', ') + ')', values);
		}

		invariant(this.db, "apply(): not opened");
		var changeTable = getChangeTableName(table.spec.name);

		return this.db.transaction((transaction: DbTransaction): Promise<any> => {
			var p1 = Promise.resolve();
			var toResolve = new Set<KeyType>();
			changes.forEach((change: TableChange<Element, Mutator>) => {
				var time = change.time || Date.now();
				invariant((change.save ? 1 : 0) + (change.change ? 1 : 0) + (change.delete ? 1 : 0) === 1, 'change must specify exactly one action at a time');
				if(change.save) {
					var element = change.save;
					var keyValue = table.keyValue(element);
					var columns = Object.keys(element).filter(k => k in table.spec.columns);
					var values: any[] = columns.map(k => element[k]);

					// append internal column values
					columns = [internal_column_time, ...columns];
					values = [time, ...values];
					
					p1 = p1.then(() => insert(transaction, table.spec.name, columns, values));
					toResolve.add(keyValue);
				}
				else if(change.change || change.delete) {
					// insert into change table
					var changeRow: ChangeRow = {
						key: null,
						time: time,
						change: null
					};
					if (change.change) {
						// store changes
						var mutator = clone(change.change);
						changeRow.key = table.keyValue(mutator);
						delete mutator[table.key];
						changeRow.change = JSON.stringify(mutator);
					}
					else {
						// mark deleted
						changeRow.key = change.delete;
						changeRow.change = JSON.stringify(deleteRow_action);
					}
					
					var columns = Object.keys(changeRow);
					var values: any[] = columns.map(k => changeRow[k]);
					p1 = p1.then(() => insert(transaction, changeTable, columns, values));
					toResolve.add(keyValue);
				}
				else {
					throw new Error("no operation specified for change- should be one of save, change, or delete");
				}
			});
			
			// these could be done in parallel
			toResolve.forEach((keyValue: KeyType) => {
				var baselineCols = [ROWID, internal_column_time, internal_column_deleted, ...Object.keys(table.spec.columns)];
				p1 = p1.then(() => transaction.executeSql(
					'SELECT ' + baselineCols.join(', ')
						+ ' FROM ' + table.spec.name
						+ ' WHERE ' + table.key + '=?'
						+ ' ORDER BY ' + internal_column_time + ' DESC'
						+ ' LIMIT 1', 
					[keyValue],
					(tx1: DbTransaction, baselineResults: any[]): Promise<any> => {
						var baseline = <Element>{};
						var baseTime = 0;
						var baseRowId = -1;
						if (baselineResults.length) {
							baseline = <Element>baselineResults[0];
							baseTime = baseline[internal_column_time];
						}
						else {
							baseline[table.key] = keyValue;
						}
						var mutation = baseline;
						var mutationTime = baseTime;
						
						return tx1.executeSql(
							'SELECT key, time, change'
								+ ' FROM ' + changeTable
								+ ' WHERE key=? AND time>=?'
								+ ' ORDER BY time ASC',
							[keyValue, baseTime],
							(tx2: DbTransaction, changeResults: any[]): Promise<any> => {
								var p2 = Promise.resolve();
								for(var i=0; i<changeResults.length; i++) {
									var row = <ChangeRow>changeResults[i];
									var mutator = <Mutator>JSON.parse(row.change);
									mutation = mutate(mutation, mutator);
									mutationTime = Math.max(mutationTime, row.time);
								}
								
								if(baseRowId != -1 && !isMutated(mutation, baseline)) {
									// mark it as latest (and others as not)
									p2 = p2.then(() => tx2.executeSql(
										'UPDATE ' + table.spec.name
											+ ' SET ' + internal_column_latest + '=( ' + ROWID + '=' + baseRowId + ' )'
											+ ' WHERE ' + table.key + '=?',
										[keyValue])
									);
								}
								else {
									// invalidate old latest rows
									p2 = p2.then(() => tx2.executeSql(
										'UPDATE ' + table.spec.name
											+ ' SET ' + internal_column_latest + '=0'
											+ ' WHERE ' + table.key + '=?',
										[keyValue])
									);
									
									// insert new latest row
									mutation[internal_column_latest] = true;
									mutation[internal_column_time] = mutationTime;
									var columns = Object.keys(mutation).filter(key => (key in table.spec.columns) || (key in internalColumn));
									var values = columns.map(col => mutation[col]);
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

	find<Element, Query>(table: Table<Element, any, Query>, query: Query): Promise<Element[]> {
		return null;
	}

}


export function createStore(params: CreateStoreParams): Store {
	return new Store(params);
}
