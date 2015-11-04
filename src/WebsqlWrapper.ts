///<reference path="../typings/tsd.d.ts"/>
///<reference path="./websql.d.ts"/>
'use strict';
import clone = require("clone");

// compatible with sqlite3
export interface IDatabase {
	run(sql: string, callback?: (err: Error) => void): IDatabase;
	all(sql: string, params?: any[], callback?: (err: Error, rows: any[]) => void): IDatabase;
	serialize(callback?: () => void): void;
	parallelize(callback?: () => void): void;
}


class WebsqlWrapper implements Database {
	private db: IDatabase;
	version: string;

	constructor(db: IDatabase) {
		this.db = db;
	}

	checkError(err: Error, errorCallback?: SQLTransactionErrorCallback) {
		if (err) {
			console.log("checkerror: ", err);
			if(errorCallback) {
				errorCallback(err);
			} else {
				throw err;
			}
		}
	}

	transaction(callback: SQLTransactionCallback, errorCallback?: SQLTransactionErrorCallback, successCallback?: SQLVoidCallback): void {
		interface Tx extends SQLTransaction {
			commit: () => void;
		}

		var db = this.db;
		var checkError = this.checkError;

		function commit(): void {
			db.run("COMMIT TRANSACTION", (err: Error) => {
				checkError(err, errorCallback);
				if (successCallback) {
					successCallback();
				}
			});
		}
		
		function executeSql(thisTx: Tx, sqlStatement: string, args?: string[], cb?: SQLStatementCallback, ecb?: SQLStatementErrorCallback) {
			//console.log("execute: " + sqlStatement, args);
			db.all(sqlStatement, args, (err: Error, rows: any[]) => {
				if(err) {
					console.log("error while running '" + sqlStatement + "': ", err);
					if (ecb) {
						ecb(thisTx, err);
					} else {
						throw err;
					}
				}
				else {
					//console.log("results: ", rows);
					var resultSet = <SQLResultSet>{
						rows: {
							length: rows.length,
							item: function(index: number): Object {
								return rows[index];
							}
						}
					};

					if(cb) {
						var tx2: Tx = {
							commit: thisTx.commit,
							executeSql: (sqlStatement: string, args?: string[], cb?: SQLStatementCallback, ecb?: SQLStatementErrorCallback) => executeSql(tx2, sqlStatement, args, cb, ecb) 
						};
						thisTx.commit = null;
						cb(tx2, resultSet);
					}
					
					if(thisTx.commit) {
						thisTx.commit();
					}
				}
			});
		}

		db.serialize(() => {
			db.run("BEGIN TRANSACTION", (err: Error) => {
				if(err) {
					errorCallback(err);
				}
				
				var transaction: Tx = {
					commit: commit,
					executeSql: (sqlStatement: string, args?: string[], cb?: SQLStatementCallback, ecb?: SQLStatementErrorCallback) => executeSql(transaction, sqlStatement, args, cb, ecb) 
				};

				callback(transaction);
				
				if(transaction.commit) {
					transaction.commit();
				}
			});
		});
	}

	readTransaction(callback: SQLTransactionCallback, errorCallback?: SQLTransactionErrorCallback, successCallback?: SQLVoidCallback): void {
		this.transaction(callback, errorCallback, successCallback);
	}

	changeVersion(oldVersion: string, newVersion: string, callback?: SQLTransactionCallback, errorCallback?: SQLTransactionErrorCallback, successCallback?: SQLVoidCallback): void {
		throw new Error("changeVersion() not implemented");
	}
}



export function wrapSql(db: IDatabase): Database {
		return new WebsqlWrapper(db);
}
