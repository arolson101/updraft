///<reference path="../typings/tsd.d.ts"/>

import { DbWrapper, DbTransactionCallback, DbTransaction, DbResultsCallback, DbEachResultCallback } from "./Database";

// compatible with sqlite3
export interface IDatabase {
	run(sql: string, callback?: (err: Error) => void): IDatabase;
	all(sql: string, params?: any[], callback?: (err: Error, rows: any[]) => void): IDatabase;
	each(sql: string, params?: any[], callback?: (err: Error, row: any) => void, complete?: (err: Error, count: number) => void): IDatabase;
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
	
	all(tx: DbTransaction, sql: string, params?: (string | number)[], callback?: DbResultsCallback): Promise<any> {
		return new Promise((resolve, reject) => {
			this.db.all(sql, params, (err: Error, rows: any[]) => {
				if(err) {
					console.log("SQLiteWrapper.all(): error executing '" + sql + "': ", err);
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
	
	each(tx: DbTransaction, sql: string, params?: (string | number)[], callback?: DbEachResultCallback): Promise<any> {
		var p = Promise.resolve();
		return new Promise((resolve, reject) => {
			this.db.each(sql, params, (err: Error, row: any) => {
				if(err) {
					console.log("SQLiteWrapper.each(): error executing '" + sql + "': ", err);
					reject(err);
				}
				else {
					if (callback) {
						p = p.then(() => callback(tx, row));
					}
				}
			},
			(err: Error, count: number) => {
				if(err) {
					console.log("SQLiteWrapper.each(): error executing '" + sql + "': ", err);
					reject(err);
				}
				else {
					resolve(p);
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
					executeSql: (sql: string, params?: (string | number)[], callback?: DbResultsCallback): Promise<any> => {
						return this.all(tx, sql, params, callback);
					},
					each: (sql: string, params?: (string | number)[], callback?: DbEachResultCallback): Promise<any> => {
						return this.each(tx, sql, params, callback);
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
