///<reference path="../typings/main.d.ts"/>
///<reference path="./Database.ts"/>

namespace Updraft {

	interface WebsqlTransaction extends DbTransaction {
		realTransaction: SQLTransaction;
		errorCallback: DbErrorCallback;
	}
	
	
	/* istanbul ignore next: can't test websql in node */
	class WebsqlWrapper implements DbWrapper {
		db: Database;
		traceCallback: (trace: string) => any;
	
		constructor(name: string, version?: string, displayName?: string, estimatedSize?: number, traceCallback?: (trace: string) => any) {
			version = version || "1.0";
			displayName = displayName || name;
			estimatedSize = estimatedSize || 5 * 1024 * 1024;
	
			this.db = window.openDatabase(name, version, displayName, estimatedSize);
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
		
		all(tx: WebsqlTransaction, sql: string, params: (string | number)[], callback: DbResultsCallback): void {
			this.trace(sql, params);
			try {
				tx.realTransaction.executeSql(sql, params,
					(transaction: SQLTransaction, resultSet: SQLResultSet) => {
						let results: any[] = [];
						for (let i = 0; i < resultSet.rows.length; i++) {
							let row = resultSet.rows.item(i);
							results.push(row);
						}
	
						callback(this.wrapTransaction(transaction, tx.errorCallback), results);
					},
					(transaction: SQLTransaction, error: SQLError) => {
						console.error("error executing '" + this.stringify(sql, params) + "': ", error);
						if (tx.errorCallback) {
							tx.errorCallback(error as any);
						}
						else {
							throw error;
						}
						return true;
					}
				);
			}
			catch (error) {
				console.error("error executing '" + this.stringify(sql, params) + "': ", error);
				if (tx.errorCallback) {
					tx.errorCallback(error);
				}
				else {
					throw error;
				}
			}
		}
	
		each(tx: WebsqlTransaction, sql: string, params: (string | number)[], callback: DbEachResultCallback, final: DbTransactionCallback) {
			this.trace(sql, params);
			tx.realTransaction.executeSql(sql, params,
				(transaction: SQLTransaction, resultSet: SQLResultSet) => {
					for (let i = 0; i < resultSet.rows.length; i++) {
						let row = resultSet.rows.item(i);
						if (callback) {
							(function(row: any) {
								callback(tx, row);
							})(row);
						}
					}

					final(this.wrapTransaction(transaction, tx.errorCallback));
				},
				(transaction: SQLTransaction, error: SQLError) => {
					console.error("error executing '" + this.stringify(sql, params) + "': ", error);
					if (tx.errorCallback) {
						tx.errorCallback(error as any);
					}
					else {
						throw error;
					}
					return true;
				}
			);
		}
	
		private wrapTransaction(transaction: SQLTransaction, errorCallback: DbErrorCallback): WebsqlTransaction {
			let tx: WebsqlTransaction = {
				realTransaction: transaction,
				errorCallback: errorCallback,
				executeSql: (sql: string, params?: (string | number)[], callback?: DbResultsCallback): void => {
					this.all(tx, sql, params, callback);
				},
				each: (sql: string, params: (string | number)[], callback: DbEachResultCallback, final: DbTransactionCallback): void => {
					this.each(tx, sql, params, callback, final);
				},
				commit: (cb: DbCommitCallback) => {
					cb();
				}
			};
			return tx;
		}
	
		transaction(callback: DbTransactionCallback, errorCallback: DbErrorCallback): void {
			this.db.transaction((transaction: SQLTransaction) => {
				let tx = this.wrapTransaction(transaction, errorCallback);
				callback(tx);
			});
		}
	
		readTransaction(callback: DbTransactionCallback, errorCallback: DbErrorCallback): void {
			this.db.readTransaction((transaction: SQLTransaction) => {
				let tx = this.wrapTransaction(transaction, errorCallback);
				callback(tx);
			});
		}
	}
	
	/* istanbul ignore next: can't test websql in node */
	export function createWebsqlWrapper(name: string, version?: string, displayName?: string, estimatedSize?: number, traceCallback?: (trace: string) => any): DbWrapper {
		return new WebsqlWrapper(name, version, displayName, estimatedSize, traceCallback);
	}
}
