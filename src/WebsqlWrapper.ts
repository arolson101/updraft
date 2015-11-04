///<reference path="./websql.d.ts"/>

import { DbWrapper, DbTransactionCallback, DbTransaction, DbResultsCallback } from "./Database";

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
	
	all(tx: WebsqlTransaction, statement: string, params?: (string | number)[], callback?: DbResultsCallback): Promise<any> {
		return new Promise((resolve, reject) => {
			tx.realTransaction.executeSql(statement, params,
				(transaction: SQLTransaction, resultSet: SQLResultSet) => {
					var results: any[] = [];
					for(var i=0; i<resultSet.rows.length; i++) {
						var row = resultSet.rows.item(i);
						results.push(row);
					}
					
					if(callback) {
						callback(this.wrapTransaction(transaction), results)
						.then(resolve, reject);
					}
					else {
						resolve();
					}
				},
				(transaction: SQLTransaction, error: SQLError) => {
					reject(error);
					return true;
				}
			);
		});
	}
	
	private wrapTransaction(transaction: SQLTransaction): WebsqlTransaction {
		var tx: WebsqlTransaction = {
			realTransaction: transaction,
			executeSql: (statement: string, params?: (string | number)[], callback?: DbResultsCallback): Promise<any> => {
				return this.all(tx, statement, params, callback);
			}
		}
		return tx;
	}
	
	transaction(callback: DbTransactionCallback): Promise<any> {
		return new Promise((resolve, reject) => {
			this.db.transaction((transaction: SQLTransaction) => {
				var tx = this.wrapTransaction(transaction);
				callback(tx).then(resolve, reject);
			});
		});
	}

	readTransaction(callback: DbTransactionCallback): Promise<any> {
		return new Promise((resolve, reject) => {
			this.db.readTransaction((transaction: SQLTransaction) => {
				var tx = this.wrapTransaction(transaction);
				callback(tx).then(resolve, reject);
			});
		});
	}
}


export function wrapWebsql(name: string, version?: string, displayName?: string, estimatedSize?: number): DbWrapper {
		return new WebsqlWrapper(name, version, displayName, estimatedSize);
}
