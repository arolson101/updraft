///<reference path="../typings/tsd.d.ts"/>

import { DbWrapper, DbTransactionCallback, DbTransaction, DbResultsCallback } from "./Database";

// compatible with sqlite3
export interface IDatabase {
	run(sql: string, callback?: (err: Error) => void): IDatabase;
	all(sql: string, params?: any[], callback?: (err: Error, rows: any[]) => void): IDatabase;
	serialize(callback?: () => void): void;
	parallelize(callback?: () => void): void;
}


class SQLiteWrapper implements DbWrapper {
	private db: IDatabase;
	
	constructor(db: IDatabase) {
		this.db = db;
	}
	
	run(sql: string): Promise<any> {
		return new Promise((resolve, reject) => {
			this.db.run(sql, (err: Error) => {
				if(err) {
					console.log("SQLiteWrapper.run(): error executing '" + sql + "': ", err);
					reject(err);
				}
				else {
					resolve();
				}
			})
		});
	}
	
	all(tx: DbTransaction, statement: string, params?: (string | number)[], callback?: DbResultsCallback): Promise<any> {
		return new Promise((resolve, reject) => {
			this.db.all(statement, params, (err: Error, rows: any[]) => {
				if(err) {
					console.log("SQLiteWrapper.all(): error executing '" + statement + "': ", err);
					reject(err);
				}
				else {
					if (callback) {
						resolve(callback(tx, rows));
					} else {
						resolve(rows);
					}
				}
			});
		});
	}
	
	transaction(callback: DbTransactionCallback): Promise<any> {
		var result: any = undefined;
		return Promise.resolve()
			.then(() => this.run("BEGIN TRANSACTION"))
			.then(() => {
				var tx: DbTransaction = {
					executeSql: (statement: string, params?: (string | number)[], callback?: DbResultsCallback): Promise<any> => {
						return this.all(tx, statement, params, callback);
					}
				}
				return callback(tx);
			})
			.then((ret) => result = ret)
			.then(() => this.run("COMMIT TRANSACTION"))
			.then(() => result)
			.catch((err: Error) => {
				console.log("encountered error, rolling back transaction: ", err);
				this.run("ROLLBACK TRANSACTION");
				throw err;
			})
		;
	}

	readTransaction(callback: DbTransactionCallback): Promise<any> {
		return this.transaction(callback);
	}
}


export function wrapSql(db: IDatabase): DbWrapper {
		return new SQLiteWrapper(db);
}
