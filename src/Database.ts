
export interface DbWrapper {
	transaction(callback: DbTransactionCallback): Promise<any>;
	readTransaction(callback: DbTransactionCallback): Promise<any>;
}

export interface DbTransactionCallback {
	(transaction: DbTransaction): Promise<any>;
}

export interface DbTransaction {
	executeSql(statement: string, params?: (string | number)[], callback?: DbResultsCallback): Promise<any>;
}

export interface DbResultsCallback {
	(transaction: DbTransaction, results: any[]): any | Promise<any>;
}
