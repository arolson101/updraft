///<reference path="../typings/tsd.d.ts"/>
///<reference path="./websql.d.ts"/>

// compatible with sqlite3
export interface IDatabase {
	run(sql: string, callback?: (err: Error) => void): IDatabase;
	all(sql: string, callback?: (err: Error, rows: any[]) => void, ...params: any[]): IDatabase;
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
			console.log(err);
			if(errorCallback) {
				errorCallback(err);
			} else {
				throw err;
			}
		}
	}

	transaction(callback: SQLTransactionCallback, errorCallback?: SQLTransactionErrorCallback, successCallback?: SQLVoidCallback): void {
		this.db.serialize(() => {
			this.db.run("BEGIN", (err: Error) => this.checkError(err, errorCallback));

			var transaction = <SQLTransaction>{
				executeSql: (sqlStatement: string, args?: string[], cb?: SQLStatementCallback, ecb?: SQLStatementErrorCallback) => {
					this.db.all(sqlStatement, (err: Error, rows: any[]) => {
						if(err) {
							if (ecb) {
								ecb(transaction, err);
							} else {
								throw err;
							}
						}
						else {
							var resultSet = <SQLResultSet>{
								rows: {
									length: rows.length,
									item: function(index: number): Object {
										return rows[index];
									}
								}
							}
							cb(transaction, resultSet);
						}
					}, ...args)
				}
			};

			callback(transaction);

			this.db.run("COMMIT", (err: Error) => {
				this.checkError(err, errorCallback);
				if (successCallback) {
					successCallback();
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
