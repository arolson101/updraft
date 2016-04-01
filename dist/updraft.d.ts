declare namespace Updraft {
    var assign: any;
}
declare namespace Updraft {
    function toText(o: any): string;
    function fromText(text: string): any;
}
declare namespace Updraft {
    /**
    * Use verify() to assert state which your program assumes to be true.
    *
    * Provide sprintf-style format (only %s is supported) and arguments
    * to provide information about what broke and what you were
    * expecting.
    */
    function verify(condition: any, format: string, ...args: any[]): void;
}
declare namespace Updraft {
    enum ColumnType {
        int = 0,
        real = 1,
        bool = 2,
        text = 3,
        enum = 4,
        date = 5,
        datetime = 6,
        json = 7,
        set = 8,
    }
    /** A typescript enum class will have string keys resolving to the enum values */
    interface TypeScriptEnum {
        [enumValue: number]: string;
    }
    interface EnumValue {
        toString(): string;
    }
    /** An enum class (e.g. (this one)[https://github.com/adrai/enum]) should provide a static method 'get' to resolve strings into enum values */
    interface EnumClass {
        get(value: string | number): EnumValue;
    }
    type Serializable = string | number;
    /**
    * Column in db.  Use static methods to create columns.
    */
    class Column {
        isKey: boolean;
        isIndex: boolean;
        type: ColumnType;
        defaultValue: number | boolean | string;
        enum: EnumClass | TypeScriptEnum;
        element: Column;
        constructor(type: ColumnType);
        /**
            * Column is the primary key.  Only one column can have this set.
            */
        Key(): Column;
        /**
            * Create an index for this column for faster queries.
            */
        Index(): Column;
        /**
            * Set a default value for the column
            */
        Default(value: number | boolean | string): Column;
        deserialize(value: Serializable): any;
        serialize(value: any): Serializable;
        /** create a column with "INTEGER" affinity */
        static Int(): Column;
        /** create a column with "REAL" affinity */
        static Real(): Column;
        /** create a column with "BOOL" affinity */
        static Bool(): Column;
        /** create a column with "TEXT" affinity */
        static Text(): Column;
        /** create a column with "TEXT" affinity */
        static String(): Column;
        /** a typescript enum or javascript object with instance method "toString" and class method "get" (e.g. {@link https://github.com/adrai/enum}). */
        static Enum(enum_: EnumClass | TypeScriptEnum): Column;
        /** a javascript Date objct, stored in db as seconds since Unix epoch (time_t) [note: precision is seconds] */
        static Date(): Column;
        /** a javascript Date objct, stored in db as seconds since Unix epoch (time_t) [note: precision is seconds] */
        static DateTime(): Column;
        /** object will be serialized & restored as JSON text */
        static JSON(): Column;
        /** unordered collection */
        static Set(type: ColumnType): Column;
        static sql(val: Column): string;
        static fromSql(text: string): Column;
        static equal(a: Column, b: Column): boolean;
    }
    interface ColumnSet {
        [name: string]: Column;
    }
}
declare namespace Updraft {
    interface Rejector {
        (err: Error): void;
    }
    interface DbStatement {
        sql: string;
        params?: (string | number)[];
    }
    function DbExecuteSequence(transaction: DbTransaction, statements: DbStatement[], nextCallback: DbTransactionCallback): void;
    interface DbErrorCallback {
        (error: Error): void;
    }
    interface DbWrapper {
        transaction(callback: DbTransactionCallback, errorCallback: DbErrorCallback): void;
        readTransaction(callback: DbTransactionCallback, errorCallback: DbErrorCallback): void;
    }
    interface DbTransactionCallback {
        (transaction: DbTransaction): void;
    }
    interface DbCommitCallback {
        (): void;
    }
    interface DbTransaction {
        executeSql(sql: string, params: (string | number)[], callback: DbResultsCallback): void;
        each(sql: string, params: (string | number)[], callback: DbEachResultCallback, final: DbTransactionCallback): void;
        commit(callback: DbCommitCallback): void;
    }
    interface DbResultsCallback {
        (transaction: DbTransaction, results: any[]): void;
    }
    interface DbEachResultCallback {
        (transaction: DbTransaction, result: any): void;
    }
    interface DbCallback<Result> {
        (transaction: DbTransaction, result: Result): void;
    }
}
declare namespace Updraft {
    namespace Mutate {
        interface setter<T> {
            $set: T;
        }
        interface increment {
            $inc: number;
        }
        interface push<T> {
            $push: Array<T>;
        }
        interface unshift<T> {
            $unshift: Array<T>;
        }
        interface splice<T> {
            $splice: Array<Array<number | T>>;
        }
        interface merge<T> {
            $merge: T;
        }
        interface add<T> {
            $add: Array<T>;
        }
        interface deleter<T> {
            $delete: Array<T>;
        }
        type primitive<T> = setter<T>;
        type none = void;
        type bool = primitive<boolean>;
        type num = primitive<number> | increment;
        type str = primitive<string>;
        type date = setter<Date>;
        type obj = primitive<Object> | merge<Object> | deleter<string>;
        type enm<T> = primitive<T>;
        type array<T> = setter<Array<T>> | push<T> | unshift<T> | splice<T> | merge<T>;
        type strArray = array<string>;
        type numArray = array<number>;
        type objArray = array<Object>;
        type set<T> = setter<Set<T>> | add<T> | deleter<T>;
        type strSet = set<string>;
    }
    function shallowCopy<T>(x: T): T;
    function shallowEqual<T>(a: T, b: T): boolean;
    let hasOwnProperty: (v: string) => boolean;
    function keyOf(obj: Object): string;
    function mutate<Element, Mutator>(value: Element, spec: Mutator): Element;
    function isMutated<Element>(a: Element, b: Element): boolean;
}
declare namespace Updraft {
    type KeyType = string | number;
    interface TableChange<Element, Mutator> {
        table?: Table<Element, Mutator, any>;
        time?: number;
        delete?: KeyType;
        change?: Mutator;
        save?: Element;
    }
    interface TableSpec<Element, Mutator, Query> {
        name: string;
        columns: ColumnSet;
        renamedColumns?: RenamedColumnSet;
        indices?: string[][];
        clazz?: new (props: Element) => Element;
    }
    interface RenamedColumnSet {
        [oldColumnName: string]: string;
    }
    enum OrderBy {
        ASC = 0,
        DESC = 1,
    }
    interface OrderBySpec {
        [name: string]: OrderBy;
    }
    interface FieldSpec {
        [fieldName: string]: boolean;
    }
    interface FindOpts {
        fields?: FieldSpec;
        orderBy?: OrderBySpec;
        offset?: number;
        limit?: number;
        count?: boolean;
    }
    class Table<Element, Mutator, Query> {
        spec: TableSpec<Element, Mutator, Query>;
        key: KeyType;
        constructor(spec: TableSpec<Element, Mutator, Query>);
        keyValue(element: Element | Mutator): KeyType;
        find: (query: Query | Query[], opts?: FindOpts) => Promise<Element[] | number>;
        add: (...changes: TableChange<Element, Mutator>[]) => Promise<any>;
    }
    function tableKey(spec: TableSpec<any, any, any>): KeyType;
}
declare namespace Updraft {
    type TableSpecAny = TableSpec<any, any, any>;
    type TableAny = Table<any, any, any>;
    interface CreateStoreParams {
        db: DbWrapper;
    }
    interface Schema {
        [table: string]: TableSpecAny;
    }
    class Store {
        private params;
        private tables;
        private db;
        private keyValueTable;
        private keyValues;
        constructor(params: CreateStoreParams);
        createTable<Element, Mutator, Query>(tableSpec: TableSpec<Element, Mutator, Query>): Table<Element, Mutator, Query>;
        open(): Promise<any>;
        readSchema(): Promise<Schema>;
        private syncTable(transaction, schema, spec, nextCallback);
        private loadKeyValues(transaction, nextCallback);
        getValue(key: string): any;
        setValue(key: string, value: any): Promise<any>;
        add(...changes: TableChange<any, any>[]): Promise<any>;
        find<Element, Query>(table: Table<Element, any, Query>, queryArg: Query | Query[], opts?: FindOpts): Promise<Element[] | number>;
    }
    function createStore(params: CreateStoreParams): Store;
    function makeSave<Element>(table: Updraft.Table<Element, any, any>, time: number): (save: Element) => TableChange<Element, any>;
    function makeChange<Mutator>(table: Updraft.Table<any, Mutator, any>, time: number): (change: Mutator) => TableChange<any, Mutator>;
    function makeDelete(table: Updraft.TableAny, time: number): (id: string | number) => TableChange<any, any>;
}
declare namespace Updraft.Query {
    interface Comparisons<T> {
        $gt?: T;
        $gte?: T;
        $lt?: T;
        $lte?: T;
        $ne?: T;
    }
    interface SetHasCondition<T> {
        $has: T;
    }
    interface SetHasAnyCondition<T> {
        $hasAny: T[];
    }
    interface SetHasAllConditions<T> {
        $hasAll: T[];
    }
    interface InCondition<T> {
        $in: T[];
    }
    interface LikeCondition {
        $like: string;
    }
    interface NotLikeCondition {
        $notLike: string;
    }
    type primitive<T> = T | InCondition<T>;
    type none = void;
    type bool = boolean;
    type num = primitive<number> | Comparisons<number>;
    type str = primitive<string> | LikeCondition | NotLikeCondition;
    type date = primitive<Date> | Comparisons<Date>;
    type enm<T> = primitive<T>;
    type set<T> = SetHasCondition<T> | SetHasAnyCondition<T> | SetHasAllConditions<T>;
    type strSet = set<string>;
    function escape(str: string): string;
}
declare namespace Updraft {
    interface IDatabase {
        run(sql: string, callback?: (err: Error) => void): IDatabase;
        all(sql: string, params?: any[], callback?: (err: Error, rows: any[]) => void): IDatabase;
        each(sql: string, params?: any[], callback?: (err: Error, row: any) => void, complete?: (err: Error, count: number) => void): IDatabase;
        serialize(callback?: () => void): void;
        parallelize(callback?: () => void): void;
    }
    function createSQLiteWrapper(db: IDatabase, traceCallback?: (trace: string) => any): DbWrapper;
}
declare namespace Updraft {
    function createWebsqlWrapper(name: string, version?: string, displayName?: string, estimatedSize?: number, traceCallback?: (trace: string) => any): DbWrapper;
}
declare module "updraft" {
	export = Updraft;
}
