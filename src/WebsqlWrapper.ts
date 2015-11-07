///<reference path="./websql.d.ts"/>
"use strict";

import { DbWrapper, DbTransactionCallback, DbTransaction, DbResultsCallback, DbEachResultCallback } from "./Database";

interface WebsqlTransaction extends DbTransaction {
	realTransaction: SQLTransaction;
}

class WebsqlWrapper implements DbWrapper {
	db: Database;

	constructor(name: string, version?: string, displayName?: string, estimatedSize?: number) {
		version = version || "1.0";
		displayName = displayName || name;
		estimatedSize = estimatedSize || 5 * 1024 * 1024;

		this.db = window.openDatabase(name, version, displayName, estimatedSize);
	}

	all(tx: WebsqlTransaction, sql: string, params?: (string | number)[], callback?: DbResultsCallback): Promise<any> {
		return new Promise((resolve, reject) => {
			tx.realTransaction.executeSql(sql, params,
				(transaction: SQLTransaction, resultSet: SQLResultSet) => {
					let results: any[] = [];
					for (let i = 0; i < resultSet.rows.length; i++) {
						let row = resultSet.rows.item(i);
						results.push(row);
					}

					if (callback) {
						resolve(callback(this.wrapTransaction(transaction), results));
					}
					else {
						resolve(results);
					}
				},
				(transaction: SQLTransaction, error: SQLError) => {
					reject(error);
					return true;
				}
			);
		});
	}

	each(tx: WebsqlTransaction, sql: string, params?: (string | number)[], callback?: DbEachResultCallback): Promise<any> {
		return new Promise((resolve, reject) => {
			tx.realTransaction.executeSql(sql, params,
				(transaction: SQLTransaction, resultSet: SQLResultSet) => {
					let p = Promise.resolve();
					for (let i = 0; i < resultSet.rows.length; i++) {
						let row = resultSet.rows.item(i);
						if (callback) {
							(function(row: any) {
								p = p.then(() => callback(tx, row));
							})(row);
						}
					}

					resolve(p);
				},
				(transaction: SQLTransaction, error: SQLError) => {
					reject(error);
					return true;
				}
			);
		});
	}

	private wrapTransaction(transaction: SQLTransaction): WebsqlTransaction {
		let tx: WebsqlTransaction = {
			realTransaction: transaction,
			executeSql: (sql: string, params?: (string | number)[], callback?: DbResultsCallback): Promise<any> => {
				return this.all(tx, sql, params, callback);
			},
			each: (sql: string, params?: (string | number)[], callback?: DbEachResultCallback): Promise<any> => {
				return this.each(tx, sql, params, callback);
			}
		};
		return tx;
	}

	transaction(callback: DbTransactionCallback): Promise<any> {
		return new Promise((resolve, reject) => {
			this.db.transaction((transaction: SQLTransaction) => {
				let tx = this.wrapTransaction(transaction);
				resolve(callback(tx));
			});
		});
	}

	readTransaction(callback: DbTransactionCallback): Promise<any> {
		return new Promise((resolve, reject) => {
			this.db.readTransaction((transaction: SQLTransaction) => {
				let tx = this.wrapTransaction(transaction);
				resolve(callback(tx));
			});
		});
	}
}


export function wrapWebsql(name: string, version?: string, displayName?: string, estimatedSize?: number): DbWrapper {
		return new WebsqlWrapper(name, version, displayName, estimatedSize);
}
