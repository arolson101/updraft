namespace Updraft {
	export interface DbWrapper {
		transaction(callback: DbTransactionCallback): Promise<any>;
		readTransaction(callback: DbTransactionCallback): Promise<any>;
	}
	
	export interface DbTransactionCallback {
		(transaction: DbTransaction): Promise<any>;
	}
	
	export interface DbTransaction {
		executeSql(sql: string, params?: (string | number)[], callback?: DbResultsCallback): Promise<any>;
		each(sql: string, params: (string | number)[], callback: DbEachResultCallback): Promise<any>;
	}
	
	export interface DbResultsCallback {
		(transaction: DbTransaction, results: any[]): any | Promise<any>;
	}
	
	export interface DbEachResultCallback {
		(transaction: DbTransaction, result: any): any | Promise<any>;
	}
}
