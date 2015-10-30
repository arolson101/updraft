///<reference path="../typings/tsd.d.ts"/>
///<reference path="./websql.d.ts"/>

// compatible with sqlite3
export interface IDatabase {
	new (filename: string, callback?: (err: Error) => void): IDatabase;
    run(sql: string, callback?: (err: Error) => void): IDatabase;
    all(sql: string, callback?: (err: Error, rows: any[]) => void, ...params: any[]): IDatabase;
    serialize(callback?: () => void): void;
    parallelize(callback?: () => void): void;
}


class WebsqlWrapper implements Database {
	private db: IDatabase;
	version: string;

	constructor(creator: IDatabase, name: string, version: string, creationCallback?: DatabaseCallback) {
		this.version = version;
		this.db = new creator(name, (err: Error) => {
			this.checkError(err);
			if(creationCallback) {
				creationCallback(err ? null : this);
			}
		});
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

	private execute(inTransaction: boolean, callback: SQLTransactionCallback, errorCallback?: SQLTransactionErrorCallback, successCallback?: SQLVoidCallback): void {
		this.db.serialize(() => {
			if (inTransaction) {
				this.db.run("BEGIN", (err: Error) => this.checkError(err, errorCallback));
			}

			var transaction = <SQLTransaction>{
				executeSql: (sqlStatement: string, args?: string[], cb?: SQLStatementCallback, ecb?: SQLStatementErrorCallback) => {
					this.db.all(sqlStatement, (err: Error, rows: any[]) => {
						if(err) {
							ecb(transaction, err);
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

			if (inTransaction) {
				this.db.run("COMMIT", (err: Error) => this.checkError(err, errorCallback));
			}

			if (successCallback) {
				successCallback();
			}
		});
	}

	transaction(callback: SQLTransactionCallback, errorCallback?: SQLTransactionErrorCallback, successCallback?: SQLVoidCallback): void {
		this.execute(true, callback, errorCallback, successCallback);
	}

    readTransaction(callback: SQLTransactionCallback, errorCallback?: SQLTransactionErrorCallback, successCallback?: SQLVoidCallback): void {
		this.execute(false, callback, errorCallback, successCallback);
    }

    changeVersion(oldVersion: string, newVersion: string, callback?: SQLTransactionCallback, errorCallback?: SQLTransactionErrorCallback, successCallback?: SQLVoidCallback): void {
		throw new Error("changeVersion() not implemented");
    }
}


export interface CreateDatabaseFcn {
	(name: string, version: string, displayName: string, estimatedSize: number, creationCallback?: DatabaseCallback): Database;
}



export function wrapSql(creator: IDatabase): CreateDatabaseFcn {
	return function(name: string, version: string, displayName: string, estimatedSize: number, creationCallback?: DatabaseCallback): Database {
		return new WebsqlWrapper(creator, name, version, creationCallback);
	};
}
