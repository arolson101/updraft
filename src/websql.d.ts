// http://www.w3.org/TR/webdatabase/

// 4.1 Databases
interface Window {
    openDatabase(name: string, version: string, displayName: string, estimatedSize: number, creationCallback?: DatabaseCallback): Database;
}

interface DatabaseCallback {
  (database: Database): void;
}


// 4.3 Asynchronous database API
interface Database {
  transaction(callback: SQLTransactionCallback, errorCallback?: SQLTransactionErrorCallback, successCallback?: SQLVoidCallback): void;
  readTransaction(callback: SQLTransactionCallback, errorCallback?: SQLTransactionErrorCallback, successCallback?: SQLVoidCallback): void;

  version: string;
  changeVersion(oldVersion: string, newVersion: string, callback?: SQLTransactionCallback, errorCallback?: SQLTransactionErrorCallback, successCallback?: SQLVoidCallback): void;
}

interface SQLVoidCallback {
  (): void;
}

interface SQLTransactionCallback {
  (transaction: SQLTransaction): void;
}

interface SQLTransactionErrorCallback {
  (error: SQLError): void;
}


// 4.3.1 Executing SQL statements
interface SQLTransaction {
  executeSql(sqlStatement: string, arguments?: (string | number)[], callback?: SQLStatementCallback, errorCallback?: SQLStatementErrorCallback): void;
}

interface SQLStatementCallback {
  (transaction: SQLTransaction, resultSet: SQLResultSet): void;
}

interface SQLStatementErrorCallback {
  (transaction: SQLTransaction, error: SQLError): boolean;
}


// 4.5 Database query results
interface SQLResultSet {
  insertId?: number;
  rowsAffected?: number;
  rows: SQLResultSetRowList;
}

interface SQLResultSetRowList {
  length: number;
  item(index: number): Object;
}


// 4.6 Errors and exceptions
interface SQLError {
  UNKNOWN_ERR?: number;
  DATABASE_ERR?: number;
  VERSION_ERR?: number;
  TOO_LARGE_ERR?: number;
  QUOTA_ERR?: number;
  SYNTAX_ERR?: number;
  CONSTRAINT_ERR?: number;
  TIMEOUT_ERR?: number;
  code?: number;
  message: string;
  name: string; // not in spec, but for compatibility with Error
}
