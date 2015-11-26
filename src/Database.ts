namespace Updraft {
	export interface Rejector {
		(err: Error): void;
	}
	
	export interface DbStatement {
		sql: string;
		params?: (string | number)[];
	}
	
	export function DbExecuteSequence(transaction: DbTransaction, statements: DbStatement[], nextCallback: DbTransactionCallback) {
		let i = 0;
		let act = (tx: DbTransaction): void => {
			if (i < statements.length) {
				let which = statements[i];
				i++;
				tx.executeSql(which.sql, which.params, act);
			}
			else {
				nextCallback(tx);
			}
		};
		act(transaction);
	}
	
	export interface DbWrapper {
		transaction(callback: DbTransactionCallback): void;
		readTransaction(callback: DbTransactionCallback): void;
	}
	
	export interface DbTransactionCallback {
		(transaction: DbTransaction): void;
	}
	
	export interface DbTransaction {
		executeSql(sql: string, params: (string | number)[], callback: DbResultsCallback): void;
		each(sql: string, params: (string | number)[], callback: DbEachResultCallback, final: DbTransactionCallback): void;
	}
	
	export interface DbResultsCallback {
		(transaction: DbTransaction, results: any[]): void;
	}
	
	export interface DbEachResultCallback {
		(transaction: DbTransaction, result: any): void;
	}
	
	export interface DbCallback<Result> {
		(transaction: DbTransaction, result: Result): void;
	}
}
