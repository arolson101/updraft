/// <reference path="../src/websql.d.ts" />
/// <reference path="../typings/tsd.d.ts" />
declare module Updraft {
    /**
     * @private
     */
    function startsWith(str: string, val: string): boolean;
    /**
     * @private
     */
    function clone(obj: any): any;
    /**
     * @private
     */
    function keyOf(obj: any): string;
    /**
     * In non-typescript environments, use this function to derive a class from {@link Instance}
     * @example
     * ```
     *
     *   function Task() { Updraft.Instance.apply(this, arguments); }
     *   var Task = Updraft.createClass({
     *     tableName: 'tasks',
     *     columns: {
     *       name: Updraft.Column.Text().Key(),
     *       description: Updraft.Column.Text(),
     *       done: Updraft.Column.Bool()
     *     }
     *   });
     * ```
     */
    function createClass(proto: Function, descriptor: ClassTemplate<Instance>): Function;
}
declare module Updraft {
    interface DirtyFunc {
        (): void;
    }
    class Set<K> {
        private _dirtyFcn;
        private _states;
        /**
         * @param dirtyFcn - function to call when set's state changes
         */
        constructor(dirtyFcn: DirtyFunc);
        /**
         * load values from a database; initialize values
         * @private
         * @param results - database row
         */
        initFromDb(results: SQLResultSet): void;
        /**
         * Set all values from an array.  <tt>Add</tt>s all values, and <tt>remove</tt>s any existing set values that are
         * not in <tt>arr</tt>
         * @param objects - array of values to assign.  If values are {@link Instance}s, assign their <tt>_primaryKey()</tt>s instead
         */
        assign(objects: K[]): void;
        /**
         * Removes all objects from set
         */
        clear(): void;
        /**
         * Adds value(s) to set
         * @param objects - array of values to assign.  If values are {@link Instance}s, assign their <tt>_primaryKey()</tt>s instead
         */
        add(...objects: K[]): void;
        /**
         * Alias for {@link add}
         * @param objects - values to add
         */
        push(...objects: K[]): void;
        /**
         * Removes value(s) from set
         * @param objects - values to remove
         */
        remove(...objects: K[]): void;
        /**
         * Gets values from set which match the given <tt>stateMask</tt>
         * @param stateMask - states of objects to return
         * @return values that match <tt>stateMask</tt>
         * @private
         */
        private which(stateMask);
        /**
         * Gets valid (added or saved) values of the set
         */
        values(): string[];
        /**
         * Gets the values that have been added to the set since it was last saved
         */
        getAdded(): string[];
        /**
         * Gets the values that have been removed from the set since it was last saved
         */
        getRemoved(): string[];
        /**
         * Marks the values in the set as saved.  Any objects marked 'remove' will be
         * expunged from the set.
         */
        clearChanges(): void;
    }
}
declare module Updraft {
    /**
     * Do not construct objects of type Query directly- instead, use {@link ClassTemplate}.all
     * @constructor
     */
    class Query<I extends Instance> {
        private _model;
        private _store;
        private _justCount;
        private _tables;
        private _columns;
        private _conditions;
        private _order;
        private _limit;
        private _offset;
        private _asc;
        private _nocase;
        constructor(model: ClassTemplate<I>, store: Store);
        all(): Promise<I[]>;
        private addCondition(conj, col, op, val);
        /**
         * Adds an 'AND' condition to the query
         *
         * @param col - column field to match on
         * @param op - SQLite binary [operator]{@link https://www.sqlite.org/lang_expr.html}
         * @param val - value to match against `col`
         * @see {@link or}
         * @example
         * ```
         *
         *  return Class.all.where('col2', '>', 10).and('col2', '<', 30).get();
         *  // -> SELECT ... WHERE col2 > 10 AND col2 < 30
         * ```
         */
        and(col: string, op: string, val: any): Query<I>;
        /**
         * alias for {@link and}
         *
         * @example
         * ```
         *
         *  return Class.all.where('col2', '>', 10).get();
         * ```
         */
        where(): Query<I>;
        /**
         * Adds an 'OR' condition to the query
         *
         * @param col - column field to match on
         * @param op - SQLite binary [operator]{@link https://www.sqlite.org/lang_expr.html}
         * @param val - value to match against `col`
         * @see {@link and}
         * @example
         * ```
         *
         *  return Class.all.where('col2', '=', 10).or('col2', '=', 30).get();
         *  // -> SELECT ... WHERE col2 = 10 OR col2 = 30
         * ```
         */
        or(col: string, op: string, val: any): Query<I>;
        /**
         * Sort the results by specified field
         *
         * @param col - column to sort by
         * @param asc - sort ascending (true, default) or descending (false)
         * @see {@link nocase}
         * @example
         * ```
         *
         *  return Class.all.order('x').get();
         *  // -> SELECT ... ORDER BY x
         * ```
         */
        order(col: string, asc: boolean): Query<I>;
        /**
         * Changes the match collation to be case-insensitive.  Only applies to result sorting, as 'LIKE' is
         * always case-insensitive
         *
         * @see {@link order}
         * @example
         * ```
         *
         *  return Class.all.order('x').nocase().get();
         *  // -> SELECT ... ORDER BY x COLLATE NOCASE
         * ```
         */
        nocase(): Query<I>;
        /**
         * Limits the result set to a certain number.  Useful in pagination
         *
         * @see {@link offset}
         * @example
         * ```
         *
         *  return Class.all.limit(5).get();
         *  // -> SELECT ... FROM ... LIMIT 5
         * ```
         */
        limit(count: number): Query<I>;
        /**
         * Skip a number of results.  Useful in pagination
         *
         * @see {@link limit}
         * @example
         * ```
         *
         *  return Class.all.limit(10).offset(50).get();
         *  // -> SELECT ... FROM ... LIMIT 10 OFFSET 50
         * ```
         */
        offset(count: number): Query<I>;
        /**
         * Executes the query, returning a promise resolving with the count of objects that match
         *
         * @see {@link get}
         * @example
         * ```
         *
         *  return Class.all.count()
         *  .then(function(count) { console.log(count + " objects") });
         *  // -> SELECT COUNT(*) FROM ...
         * ```
         */
        count(): Promise<number>;
        /**
         * Executes the query, returning a promise resolving with the array of objects that match any conditions
         * set on the Query
         *
         * @see {@link count}
         * @example
         * ```
         *
         *  return Class.all.where('x', '>', 0).get();
         *  // -> SELECT ... WHERE x > 0
         * ```
         */
        get(): Promise<I[]>;
    }
}
declare module Updraft {
    interface RenamedColumnSet {
        [oldColumnName: string]: string;
    }
    /**
     * Describes the static members of a class used to create {@link Instance}s
     * @see {link @createClass}
     */
    interface ClassTemplate<I extends Instance> {
        tableName: string;
        recreate?: boolean;
        temp?: boolean;
        columns: ColumnSet;
        renamedColumns?: RenamedColumnSet;
        indices?: string[][];
        key?: string;
        keyType?: ColumnType;
        all?: Query<I>;
        get(id: string): Promise<I>;
    }
    /**
     * Instances of this type will have properties for all the columns defined in its {@link ClassTemplate}.
     *  Do not create objects of type Instance directly; instead create subclassed objects
     *
     * @see {@link createClass}
     * @example
     * ```
     *
     *   // ------ typescript ------
     *   class Task extends Updraft.Instance {
     *     constructor() {
     *       super.apply(this, arguments);
     *     }
     *
     *     public name: string;
     *     public description: string;
     *     public done: boolean;
     *
     *     static tableName: string = 'tasks';
     *     static columns: Updraft.ColumnSet = {
     *       name: Updraft.Column.Text().Key(),
     *       description: Updraft.Column.Text(),
     *       done: Updraft.Column.Bool()
     *     };
     *   }
     * ```
     */
    class Instance {
        _changeMask: number;
        _isInDb: boolean;
        _model: ClassTemplate<Instance>;
        _store: Store;
        constructor(props?: any);
        /**
         * Return the object's primary key's value
         *
         * @returns Value of primary key
         * @private
         * @example
         * ```
         *
         *  var x = new Class();
         *  x.id = 123;
         *  console.log(x._primaryKey());
         *  // -> '123'
         * ```
         */
        _primaryKey(): string;
        /**
         * Get the fields that have been changed since the object was last loaded/saved
         *
         * @returns Names of the fields that have changed
         * @private
         * @example
         * ```
         *
         *  var x = new Class();
         *  x.foo = 'bar';
         *  console.log(x.changes());
         *  // -> ['foo']
         * ```
         */
        _changes(): string[];
        /**
         * Set state to be have no changes
         * @private
         */
        _clearChanges(): void;
    }
    /**
     * Add properties to a provided {@link Instance} subclass that can be created, saved and retrieved from the db
     * @private
     */
    function MakeClassTemplate<I extends Instance>(templ: ClassTemplate<I>, store: Store): void;
    /**
     * construct object from a database result row
     *
     * @return Instance with fields initialized according to row, with _isInDb=true and no changes set
     * @private
     */
    function constructFromDb<I extends Instance>(model: ClassTemplate<I>, row: Object): I;
}
declare module Updraft {
    /**
     * Column types.  Note that these are just column affinities, and technically any value type can be stored in any column type.
     * see {@link https://www.sqlite.org/datatype3.html}
     */
    enum ColumnType {
        int = 0,
        real = 1,
        bool = 2,
        text = 3,
        blob = 4,
        enum = 5,
        date = 6,
        datetime = 7,
        json = 8,
        ptr = 9,
        set = 10,
    }
    /** An enum class (e.g. (this one)[https://github.com/adrai/enum]) should provide a static method 'get' to resolve strings into enum values */
    interface EnumClass {
        get(value: string): any;
    }
    /** A typescript enum class will have string keys resolving to the enum values */
    interface TypeScriptEnum {
        [enumValue: string]: number;
    }
    /**
     * Column in db.  Use static methods to create columns.
     */
    class Column {
        isKey: boolean;
        isIndex: boolean;
        type: ColumnType;
        ref: ClassTemplate<Instance>;
        setTable: ClassTemplate<Instance>;
        defaultValue: number | boolean | string;
        enum: EnumClass | TypeScriptEnum;
        constructor(type: ColumnType);
        /**
         * Column is the primary key.  Only one column can have this set.
         */
        Key(value?: boolean): Column;
        /**
         * Create an index for this column for faster queries.
         */
        Index(value?: boolean): Column;
        /**
         * Set a default value for the column
         */
        Default(value: number | boolean | string): Column;
        /** create a column with 'INTEGER' affinity */
        static Int(): Column;
        /** create a column with 'REAL' affinity */
        static Real(): Column;
        /** create a column with 'BOOL' affinity */
        static Bool(): Column;
        /** create a column with 'TEXT' affinity */
        static Text(): Column;
        /** create a column with 'TEXT' affinity */
        static String(): Column;
        /** create a column with 'BLOB' affinity */
        static Blob(): Column;
        /** a javascript object with instance method 'toString' and class method 'get' (e.g. {@link https://github.com/adrai/enum}). */
        static Enum(enum_: EnumClass | TypeScriptEnum): Column;
        /** a javascript Date objct, stored in db as seconds since Unix epoch (time_t) [note: precision is seconds] */
        static Date(): Column;
        /** a javascript Date objct, stored in db as seconds since Unix epoch (time_t) [note: precision is seconds] */
        static DateTime(): Column;
        /** object will be serialized & restored as JSON text */
        static JSON(): Column;
        /** points to an object in another table.  Its affinity will automatically be that table's key's affinity */
        static Ptr(ref: ClassTemplate<Instance>): Column;
        /** unordered collection */
        static Set(ref: ClassTemplate<Instance>): Column;
        static sqlType(type: ColumnType): string;
    }
    interface ColumnSet {
        [name: string]: Column;
    }
    /**
     * The parameters used to open a database
     *
     * @property name - the name of the database to open
     */
    class StoreOptions {
        name: string;
    }
    /**
     * Database schema.  The outer keys will be the tables in the database.  The values will consist of an
     * object whose keys will be the table's rows and values will be the row's type.  It will also have an
     * '_indices' object with all the indices found.
     * Note: tables or indices beginning with underscore or 'sqlite' will be ignored
     *
     * @private
     * @example
     * ```
     *
     *    var schema = {
     *      'todos': {
     *        _indices: {
     *          'index_todos__name': 'CREATE INDEX ...',
     *        },
     *        _triggers: {
     *          'trigger_todos__task': 'CREATE TRIGGER ...',
     *        },
     *        'id': 'INTEGER PRIMARY KEY',
     *        'name': 'TEXT',
     *      },
     *      'tasks': {
     *        'id': 'INTEGER PRIMARY KEY',
     *        'description': 'TEXT',
     *      }
     *    };
     * ```
     */
    class Schema {
        [table: string]: SchemaTable;
    }
    /**
     * @private
     */
    class SchemaTable {
        _indices: Object;
        _triggers: Object;
        [column: string]: any;
    }
    /**
     * @private
     */
    interface ExecCallback<T> {
        (tx: SQLTransaction, results: SQLResultSet): T;
    }
    /**
     * Interface for creating classes & database interaction
     */
    class Store {
        logSql: boolean;
        tables: ClassTemplate<Instance>[];
        KeyValue: ClassTemplate<Instance>;
        kv: Object;
        db: Database;
        constructor();
        /**
         * create a new type whose instances can be stored in a database
         * @param templ
         */
        addClass(templ: ClassTemplate<Instance>): void;
        /**
         * set a key/value pair
         *
         * @param key
         * @param value - value will be stored as JSON text, so value can be any object that will
         *        survive serialization
         * @return a promise that will resolve once the value is saved.  Key/values are cached
         *         on the <tt>Store</tt>, so you can use the value immediately and don't need to wait for
         *         the promise to resolve.
         */
        set(key: string, value: Object): Promise<any>;
        /**
         * gets a key/value pair.  Values are cached on the <tt>Store</tt> so they are immediately available
         *
         * @param key
         * @return value
         */
        get(key: string): Object;
        /**
         * read the key/value pairs from the database, caching them on the <tt>Store</tt>
         * @private
         */
        loadKeyValues(): Promise<any>;
        /**
         * Delete all tables in database.  For development purposes; you probably don't want to ship with this.
         *
         * @param opts
         * @return a promise that resolves when all tables are deleted
         * @see {@link open}
         * @example
         * ```
         *
         *    store.purge({name: 'my cool db'}).then(function() {
         *      // everything is gone
         *    });
         * ```
         */
        purge(opts: StoreOptions): Promise<any>;
        /**
         * open the database
         *
         * @param opts
         * @return a promise that resolves with no parameters when the database is created and ready
         * @example
         * ```
         *
         *    store.open({name: 'my cool db'}).then(function() {
         *      // start loading & saving objects
         *    });
         * ```
         */
        open(opts: StoreOptions): Promise<any>;
        /**
         * close the database
         */
        close(): void;
        /**
         * exec a sql statement within a given transaction
         *
         * @param tx - a transaction created by <tt>db.transaction</tt> or <tt>db.readTransaction</tt>
         * @param stmt - sql statement to execute
         * @param args - array of strings to substitute into <tt>stmt</tt>
         * @param callback - callback with parameters (transaction, [SQLResultSet]{@link http://www.w3.org/TR/webdatabase/#sqlresultset})
         * @return a promise that resolves with (transaction, return value of the callback)
         * @private
         */
        exec<T>(tx: SQLTransaction, stmt: string, args?: string[], callback?: ExecCallback<T>): Promise<T>;
        /**
         * exec a sql statement within a new read transaction
         *
         * @param stmt - sql statement to execute
         * @param args - array of strings to substitute into <tt>stmt</tt>
         * @param callback - callback with parameters (transaction, [SQLResultSet]{@link http://www.w3.org/TR/webdatabase/#sqlresultset})
         * @return a promise that resolves with (transaction, return value of the callback)
         * @private
         */
        execRead<T>(stmt: string, args: string[], callback: ExecCallback<T>): Promise<T>;
        reportError(error: SQLError): void;
        /**
         * get the existing database's schema in object form
         *
         * @return a promise that resolves with the {@link Schema}
         */
        readSchema(): Promise<Schema>;
        /**
         * Check whether the tables in the current database match up with the ClassFactories.
         * They will be created or modified as needed.
         *
         * @param schema
         * @return A promise that resolves with no parameters once all tables are up-to-date.
         * @private
         */
        syncTables(schema: Schema): Promise<any>;
        /**
         * Check whether an individual table in the current database matches up with its corresponding ClassTemplate.
         * It will be created or modified as needed.
         *
         * @param tx - a writeable transaction
         * @param schema
         * @param f
         * @return A promise that resolves with no parameters once the table is up-to-date.
         * @private
         */
        syncTable(tx: SQLTransaction, schema: Schema, f: ClassTemplate<any>): Promise<any>;
        /**
         * Save all objects to database.  Atomic operation- all objects will be saved within the same transaction
         * or nothing will be written.  Objects can be heterogeneous.
         *
         * @param objects - objects to save
         */
        save(...objects: Instance[]): Promise<{}>;
    }
}
declare module Updraft {
}
declare var module: any;
