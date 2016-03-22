///<reference path="../typings/tsd.d.ts"/>
///<reference path="./Database"/>
"use strict";

namespace Updraft {
	// compatible with sqlite3
	export interface IDatabase {
		run(sql: string, callback?: (err: Error) => void): IDatabase;
		all(sql: string, params?: any[], callback?: (err: Error, rows: any[]) => void): IDatabase;
		each(sql: string, params?: any[], callback?: (err: Error, row: any) => void, complete?: (err: Error, count: number) => void): IDatabase;
		serialize(callback?: () => void): void;
		parallelize(callback?: () => void): void;
	}
	
	interface SQLiteTransaction extends DbTransaction {
		errorCallback: DbErrorCallback;
	}
	
	
	class SQLiteWrapper implements DbWrapper {
		private db: IDatabase;
	
		constructor(db: IDatabase) {
			this.db = db;
		}
	
		run(sql: string): void {
			this.db.run(sql, (err: Error) => {
				/* istanbul ignore if */
				if (err) {
					console.log("SQLiteWrapper.run(): error executing '" + sql + "': ", err);
					throw err;
				}
			});
		}
	
		executeSql(tx: SQLiteTransaction, sql: string, params: (string | number)[], callback: DbResultsCallback): void {
			this.db.all(sql, params, (err: Error, rows: any[]) => {
				/* istanbul ignore if */
				if (err) {
					console.log("SQLiteWrapper.all(): error executing '" + sql + "': ", err);
					if (tx.errorCallback) {
						tx.errorCallback(err);
					}
					else {
						throw err;
					}
				}
				else {
					callback(tx, rows);
				}
			});
		}
			
		each(tx: SQLiteTransaction, sql: string, params: (string | number)[], callback: DbEachResultCallback, final: DbTransactionCallback): void {
			this.db.each(sql, params, (err: Error, row: any) => {
				/* istanbul ignore if */
				if (err) {
					console.log("SQLiteWrapper.each(): error executing '" + sql + "': ", err);
					if (tx.errorCallback) {
						tx.errorCallback(err);
					}
					else {
						throw err;
					}
				}
				else {
					callback(tx, row);
				}
			},
			(err: Error, count: number) => {
				/* istanbul ignore if */
				if (err) {
					console.log("SQLiteWrapper.each(): error executing '" + sql + "': ", err);
					if (tx.errorCallback) {
						tx.errorCallback(err);
					}
					else {
						throw err;
					}
				}
				else {
					final(tx);
				}
			});
		}

		transaction(callback: DbTransactionCallback, errorCallback: DbErrorCallback): void {
      this.db.serialize(() => {
        this.run("BEGIN TRANSACTION");
        let tx: SQLiteTransaction = {
          errorCallback: errorCallback,
          executeSql: (sql: string, params: (string | number)[], resultsCb: DbResultsCallback): void => {
            this.executeSql(tx, sql, params, resultsCb);
          },
          each: (sql: string, params: (string | number)[], resultsCb: DbEachResultCallback, final: DbTransactionCallback): void => {
            this.each(tx, sql, params, resultsCb, final);
          }
        };
        callback(tx);
        this.run("COMMIT TRANSACTION");
      });
		}

		readTransaction(callback: DbTransactionCallback, errorCallback: DbErrorCallback): void {
			let result: any = undefined;
			let tx: SQLiteTransaction = {
				errorCallback: errorCallback,
				executeSql: (sql: string, params: (string | number)[], resultsCb: DbResultsCallback): void => {
					this.executeSql(tx, sql, params, resultsCb);
				},
				each: (sql: string, params: (string | number)[], resultsCb: DbEachResultCallback, final: DbTransactionCallback): void => {
					this.each(tx, sql, params, resultsCb, final);
				}
			};
			callback(tx);
		}
	}
	
	
	export function createSQLiteWrapper(db: IDatabase): DbWrapper {
		return new SQLiteWrapper(db);
	}
}
