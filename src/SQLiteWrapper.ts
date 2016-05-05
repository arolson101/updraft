///<reference path="../typings/main.d.ts"/>
///<reference path="./Database.ts"/>

namespace Updraft {
	// compatible with sqlite3
	export interface IDatabase {
		run(sql: string, callback?: (err: Error) => void): IDatabase;
		all(sql: string, params?: any[], callback?: (err: Error, rows: any[]) => void): IDatabase;
		each(sql: string, params?: any[], callback?: (err: Error, row: any) => void, complete?: (err: Error, count: number) => void): IDatabase;
		serialize(callback?: () => void): void;
		parallelize(callback?: () => void): void;
		//wait(callback?: () => void): void;
	}
	
	interface SQLiteTransaction extends DbTransaction {
		errorCallback: DbErrorCallback;
	}
	
	
	class SQLiteWrapper implements DbWrapper {
		private db: IDatabase;
		traceCallback: (trace: string) => any;

		constructor(db: IDatabase, traceCallback?: (trace: string) => any) {
			this.db = db;
			this.traceCallback = traceCallback;
		}
			
		trace(sql: string, params?: (string | number)[]) {
			if (this.traceCallback) {
				let escapedString = this.stringify(sql, params);
				this.traceCallback(escapedString);
			}
		}
		
		stringify(sql: string, params?: (string | number)[]): string {
			let idx: number = 0;
			let escapedString = sql.replace(/\?/g, () => {
				let x = params[idx++];
				if (typeof x == "number") {
					return <string>x;
				} else {
					return "'" + x + "'";
				}
			});
			return escapedString;
		}

		run(sql: string, callback: () => void): void {
			this.trace(sql);
			this.db.run(sql, (err: Error) => {
				/* istanbul ignore if */
				if (err) {
					console.log("SQLiteWrapper.run(): error executing '" + sql + "': ", err);
					throw err;
				}
				else {
					callback();
				}
			});
		}
	
		executeSql(tx: SQLiteTransaction, sql: string, params: (string | number)[], callback: DbResultsCallback): void {
			this.trace(sql, params);
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
			this.trace(sql, params);
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
			this.run("BEGIN TRANSACTION", () => {
				let tx: SQLiteTransaction = {
					errorCallback: errorCallback,
					executeSql: (sql: string, params: (string | number)[], resultsCb: DbResultsCallback): void => {
						this.executeSql(tx, sql, params, resultsCb);
					},
					each: (sql: string, params: (string | number)[], resultsCb: DbEachResultCallback, final: DbTransactionCallback): void => {
						this.each(tx, sql, params, resultsCb, final);
					},
					commit: (cb: DbCommitCallback) => {
						this.run("COMMIT TRANSACTION", () => {
							cb();
						});
					}
				};
				callback(tx);
			});
		}

		readTransaction(callback: DbTransactionCallback, errorCallback: DbErrorCallback): void {
			let result: any = undefined;
			let tx: SQLiteTransaction = {
				errorCallback: errorCallback,
				executeSql: (sql: string, params: (string | number)[], resultsCb: DbResultsCallback): void => {
					this.executeSql(tx, sql, params, resultsCb);
				},
				each: /* istanbul ignore next */ (sql: string, params: (string | number)[], resultsCb: DbEachResultCallback, final: DbTransactionCallback): void => {
					this.each(tx, sql, params, resultsCb, final);
				},
				commit: (cb: DbCommitCallback) => {
					cb();
				}
			};
			callback(tx);
		}
	}
	
	
	export function createSQLiteWrapper(db: IDatabase, traceCallback?: (trace: string) => any): DbWrapper {
		return new SQLiteWrapper(db, traceCallback);
	}
}
