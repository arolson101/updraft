/// <reference path="../typings/tsd.d.ts" />
/// <reference path="./util.ts" />
/// <reference path="./model.ts" />
/// <reference path="./websql.d.ts" />

module Updraft {


  /**
   * Column types.  Note that these are just column affinities, and technically any value type can be stored in any column type.
   * see {@link https://www.sqlite.org/datatype3.html}
   */
  export enum ColumnType {
    int,
    real,
    bool,
    text,
    blob,
    enum,
    date,
    datetime,
    json,
    ptr,
    set
  }

  /** An enum class (e.g. (this one)[https://github.com/adrai/enum]) should provide a static method 'get' to resolve strings into enum values */
  export interface EnumClass {
    get(value: string): any;
  }

  /** A typescript enum class will have string keys resolving to the enum values */
  export interface TypeScriptEnum {
    [enumValue: string]: number
  }


  /**
   * Column in db.  Use static methods to create columns.
   */
  export class Column {
    public isKey: boolean;
    public isIndex: boolean;
    public type: ColumnType;
    public ref: ClassTemplate /*| ColumnType*/; // TODO: add set(string|number|etc)
    public setTable: ClassTemplate;
    public defaultValue: number | boolean | string;
    public enum: EnumClass | TypeScriptEnum;

    constructor(type: ColumnType) {
      this.type = type;
    }

    /**
     * Column is the primary key.  Only one column can have this set.
     */
    Key(value: boolean = true): Column {
      this.isKey = value;
      return this;
    }

    /**
     * Create an index for this column for faster queries.
     */
    Index(value: boolean = true): Column {
      this.isIndex = value;
      return this;
    }

    /**
     * Set a default value for the column
     */
     // TODO
    Default(value: number | boolean | string): Column {
      this.defaultValue = value;
      return this;
    }

    /** create a column with 'INTEGER' affinity */
    static Int(): Column {
      return new Column(ColumnType.int);
    }

    /** create a column with 'REAL' affinity */
    static Real(): Column {
      return new Column(ColumnType.real);
    }

    /** create a column with 'BOOL' affinity */
    static Bool(): Column {
      return new Column(ColumnType.bool);
    }

    /** create a column with 'TEXT' affinity */
    static Text(): Column {
      return new Column(ColumnType.text);
    }

    /** create a column with 'TEXT' affinity */
    static String(): Column {
      return new Column(ColumnType.text);
    }

    /** create a column with 'BLOB' affinity */
    static Blob(): Column {
      var c = new Column(ColumnType.blob);
      return c;
    }

    /** a javascript object with instance method 'toString' and class method 'get' (e.g. {@link https://github.com/adrai/enum}). */
    static Enum(enum_: EnumClass | TypeScriptEnum): Column {
      var c = new Column(ColumnType.enum);
      c.enum = enum_;
      return c;
    }

    /** a javascript Date objct, stored in db as seconds since Unix epoch (time_t) [note: precision is seconds] */
    static Date(): Column {
      return new Column(ColumnType.date);
    }

    /** a javascript Date objct, stored in db as seconds since Unix epoch (time_t) [note: precision is seconds] */
    static DateTime(): Column {
      return new Column(ColumnType.datetime);
    }

    /** object will be serialized & restored as JSON text */
    static JSON(): Column {
      return new Column(ColumnType.json);
    }

    /** points to an object in another table.  Its affinity will automatically be that table's key's affinity */
    static Ptr(ref: ClassTemplate): Column {
      var c = new Column(ColumnType.ptr);
      c.ref = ref;
      return c;
    }

    /** unordered collection */
    static Set(ref: ClassTemplate /*| ColumnType*/): Column {
      var c = new Column(ColumnType.set);
      c.ref = ref;
      return c;
    }


    static sqlType(type: ColumnType) : string {
      switch(type) {
        case ColumnType.int:
          return 'INTEGER';
        case ColumnType.bool:
          return 'BOOL';
        case ColumnType.real:
          return 'REAL';
        case ColumnType.text:
        case ColumnType.json:
        case ColumnType.enum:
          return 'TEXT';
        case ColumnType.blob:
          return 'BLOB';
        case ColumnType.date:
          return 'DATE';
        case ColumnType.datetime:
          return 'DATETIME';
        default:
          throw new Error("unsupported type");
      }
    }
  }


  export interface ColumnSet {
    [name: string]: Column;
  }


  /**
   * The parameters used to open a database
   *
   * @property name - the name of the database to open
   */
  export class StoreOptions {
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
  export class Schema {
    [table: string]: SchemaTable;
  }

  /**
   * @private
   */
  export class SchemaTable {
    _indices: Object;
    _triggers: Object;
    [column: string]: any;
  }


  /**
   * Internal class used in key/value storage
   * @private
   */
  class KeyValue extends Instance {
    static tableName: string = 'updraft_kv';
    static columns: ColumnSet = {
      key: Column.String().Key(),
      value: Column.String(),
    };
    static all: Query;
    static get(id: string): Promise<Instance> { return null; }

    key: string;
    value: string;

    constructor(props?: Object) {
      super(props);
    }
  }


  /**
   * @private
   */
  export interface ExecCallback<T> {
    (tx: SQLTransaction, results: SQLResultSet): T;
  }

  /**
   * @private
   */
  function anyFcn(tx: SQLTransaction, results: SQLResultSet): any {}


  /**
   * Interface for creating classes & database interaction
   */
  export class Store {
    logSql: boolean;
    tables: ClassTemplate[];
    KeyValue: ClassTemplate;
    kv: Object;
    db: Database;

    constructor() {
      var self = this;
      this.logSql = false;

      self.tables = [];
      self.kv = {};

      this.addClass(KeyValue);
    }

    /**
     * create a new type whose instances can be stored in a database
     * @param templ
     */
     addClass(templ: ClassTemplate) {
       MakeClassTemplate(templ, this);
       this.tables.push(templ);
     }


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
    set(key: string, value: Object): Promise<any> {
      this.kv[key] = value;
      var pair = new KeyValue({key: key, value: JSON.stringify(value)});
      return this.save(pair);
    }


    /**
     * gets a key/value pair.  Values are cached on the <tt>Store</tt> so they are immediately available
     *
     * @param key
     * @return value
     */
    get(key: string): Object {
      return this.kv[key];
    }


    /**
     * read the key/value pairs from the database, caching them on the <tt>Store</tt>
     * @private
     */
    loadKeyValues(): Promise<any> {
      var self = this;
      return KeyValue.all.get().then(function(vals: KeyValue[]) {
        for(var i=0; i<vals.length; i++) {
          var val = vals[i];
          self.kv[val.key] = JSON.parse(val.value);
        }
      });
    }


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
    purge(opts: StoreOptions): Promise<any> {
      console.assert(!this.db);

      this.db = window.openDatabase(opts.name, '1.0', 'updraft created database', 5 * 1024 * 1024);
      console.assert(this.db != null);

      var self = this;
      console.assert(this instanceof Store);
      return self.readSchema()
      .then(function(schema: Schema) {
        return new Promise<any>(function(fulfill, reject) {
          self.db.transaction(function(tx) {
            var promises: Promise<any>[] = [];
            Object.keys(schema).forEach(function(table) {
              promises.push(self.exec(tx, 'DROP TABLE ' + table));
            });
            return Promise.all(promises)
            .then(function() {
              self.db = null;
            })
            .then(fulfill, reject);
          });
        });
      });
    }


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
    open(opts: StoreOptions): Promise<any> {
      this.db = window.openDatabase(opts.name, '1.0', 'updraft created database', 5 * 1024 * 1024);
      console.assert(this.db != null);

      // add tables for 'set' columns
      var setTables: ClassTemplate[] = [];
      for(var i=0; i<this.tables.length; i++) {
        var table = this.tables[i];
        for(var col in table.columns) {
          if(table.columns[col].type === ColumnType.set) {
            var ref = table.columns[col].ref;
            console.assert(ref != null);
            var setTable: ClassTemplate = {
              tableName: table.tableName + '_' + col,
              recreate: table.recreate,
              temp: table.temp,
              key: '',
              keyType: table.keyType,
              columns: {},
              indices: [ [table.key], [col] ],
              get: function(id: string): Promise<Instance> { throw new Error("not callable"); }
            };
            setTable.columns[table.key] = new Column(table.keyType), // note: NOT setting key=true, as it would impose unique constraint
            setTable.columns[col] = new Column(ref.keyType),
            table.columns[col].setTable = setTable;
            setTables.push(setTable);
          }
        }
      }

      this.tables = this.tables.concat(setTables);
      var self = this;
      console.assert(this instanceof Store);
      return self.readSchema()
              .then(self.syncTables.bind(self))
              .then(self.loadKeyValues.bind(self));
    }


    /**
     * close the database
     */
    close() {
      this.db = null;
      this.constructor();
    }


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
    exec<T>(tx: SQLTransaction, stmt: string, args?: string[], callback: ExecCallback<T> = anyFcn): Promise<T> {
      if(this.logSql) {
        console.log(stmt, args);
      }
      var self = this;
      return new Promise(function (fulfill, reject) {
        try {
          tx.executeSql(stmt, args,
                        function (tx, results) {
                          var ret = callback ? callback(tx, results) : null;
                          return Promise.resolve(ret).then(fulfill, reject);
                        },
                        function (tx, error) {
                          self.reportError(error);
                          reject(error);
                          return false;
                        });
        } catch (reason) {
          console.log('Failed to exec "' + stmt + '":' + reason);
          throw reason;
        }
      });
    }


    /**
     * exec a sql statement within a new read transaction
     *
     * @param stmt - sql statement to execute
     * @param args - array of strings to substitute into <tt>stmt</tt>
     * @param callback - callback with parameters (transaction, [SQLResultSet]{@link http://www.w3.org/TR/webdatabase/#sqlresultset})
     * @return a promise that resolves with (transaction, return value of the callback)
     * @private
     */
    execRead<T>(stmt: string, args: string[], callback: ExecCallback<T>): Promise<T> {
      var self = this;
      console.assert(self.db != null);
      return new Promise(function (fulfill, reject) {
        self.db.readTransaction(function (rtx) {
          return self.exec(rtx, stmt, args, callback)
                  .then(fulfill, reject);
        });
      });
    }


    reportError(error: SQLError) {
      switch (error.code) {
        case error.SYNTAX_ERR:
          console.log("Syntax error: " + error.message);
          break;
        default:
          console.log(error);
      }
    }


    /**
     * get the existing database's schema in object form
     *
     * @return a promise that resolves with the {@link Schema}
     */
    readSchema(): Promise<Schema> {
      function tableFromSql(sql: string): SchemaTable {
        var table = <SchemaTable>{ _indices: {}, _triggers: {} };
        var matches = sql.match(/\((.*)\)/);
        if (matches) {
          var fields = matches[1].split(',');
          for (var i = 0; i < fields.length; i++) {
            var ignore = /^\s*(primary|foreign)\s+key/i;  // ignore standalone 'PRIMARY KEY xxx'
            if (fields[i].match(ignore)) {
              continue;
            }
            var quotedName = /"(.+)"\s+(.*)/;
            var unquotedName = /(\w+)\s+(.*)/;
            var parts = fields[i].match(quotedName);
            if (!parts) {
              parts = fields[i].match(unquotedName);
            }
            if (parts) {
              table[parts[1]] = parts[2];
            }
          }
        }
        return table;
      }

      return this.execRead('SELECT name, tbl_name, type, sql FROM sqlite_master', [], function (tx, results) {
        /*jshint camelcase:false*/
        var schema: Schema = {};
        for (var i = 0; i < results.rows.length; i++) {
          var row: any = results.rows.item(i);
          if (row.name[0] != '_' && !startsWith(row.name, 'sqlite')) {
            switch (row.type) {
              case 'table':
                schema[row.name] = tableFromSql(row.sql);
                break;
              case 'index':
                schema[row.tbl_name]._indices = schema[row.tbl_name]._indices || {};
                schema[row.tbl_name]._indices[row.name] = row.sql;
                break;
              case 'trigger':
                schema[row.tbl_name]._triggers = schema[row.tbl_name]._triggers || {};
                schema[row.tbl_name]._triggers[row.name] = row.sql;
                break;
            }
          }
        }
        return schema;
      });
    }


    /**
     * Check whether the tables in the current database match up with the ClassFactories.
     * They will be created or modified as needed.
     *
     * @param schema
     * @return A promise that resolves with no parameters once all tables are up-to-date.
     * @private
     */
    syncTables(schema: Schema): Promise<any> {
      var self = this;
      console.assert(self.db != null);
      return new Promise(function (fulfill, reject) {
        self.db.transaction(function (tx) {
          return Promise.all(self.tables.map(function (f) { return self.syncTable(tx, schema, f); }))
            .then(fulfill, reject);
        });
      });
    }


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
    syncTable(tx: SQLTransaction, schema: Schema, f: ClassTemplate) {
      var self = this;
      // execute CREATE TABLE statement
      function createTable(name: string): Promise<any> {
        var cols: string[] = [];
        for (var col in f.columns) {
          var attrs: Column = f.columns[col];
          var decl: string;
          switch (attrs.type) {
            case ColumnType.ptr:
              console.assert(attrs.ref != null);
              console.assert(attrs.ref.columns != null);
              console.assert(attrs.ref.tableName != null);
              console.assert(attrs.ref.key != null);
              var foreignType: ColumnType = attrs.ref.columns[attrs.ref.key].type;
              decl = col + ' ' + Column.sqlType(foreignType);
              cols.push(decl);
              break;

            case ColumnType.set:
              break;

            default:
              decl = col + ' ' + Column.sqlType(attrs.type);
              if (f.key === col) {
                decl += ' PRIMARY KEY';
              }
              cols.push(decl);
          }
        }
        return self.exec(tx, 'CREATE ' + (f.temp ? 'TEMP ' : '') + 'TABLE ' + name + ' (' + cols.join(', ') + ')');
      }

      function dropTable(name: string): Promise<any> {
        return self.exec(tx, 'DROP TABLE ' + name);
      }

      function createIndices(force: boolean = false): Promise<any> {
        var promises: Promise<any>[] = [];
        var toRemove = (f.tableName in schema) ? clone(schema[f.tableName]._indices) : {};
        f.indices.forEach(function (index: string[]) {
          var name = 'index_' + f.tableName + '__' + index.join('_');
          var sql = 'CREATE INDEX ' + name + ' ON ' + f.tableName + ' (' + index.join(', ') + ')';
          delete toRemove[name];
          var create = true;
          var drop = false;
          if (schema[f.tableName] && schema[f.tableName]._indices && schema[f.tableName]._indices[name]) {
            if (schema[f.tableName]._indices[name] === sql) {
              create = false;
            } else {
              drop = true;
            }
          }

          if (drop) {
            promises.push(self.exec(tx, 'DROP INDEX ' + name));
          }
          if (create || force) {
            promises.push(self.exec(tx, sql));
          }
        });

        // delete orphaned indices
        Object.keys(toRemove).forEach(function (name: string) {
          promises.push(self.exec(tx, 'DROP INDEX ' + name));
        });
        return Promise.all(promises);
      }

      // check if table already exists
      if (f.tableName in schema) {
        if (f.recreate) {
          return Promise.all([
            dropTable(f.tableName),
            createTable(f.tableName),
            createIndices(true),
          ]);
        } else {
          //console.log("table " + f.tableName + " exists; checking columns");
          var columns = clone(schema[f.tableName]);
          delete columns._indices;
          delete columns._triggers;
          var key: string;

          var addedColumns: string[] = [];
          var addedForeignKey = false;
          for (key in f.columns) {
            if (!(key in columns)) {
              addedColumns.push(key);
              if (f.columns[key].ref) {
                addedForeignKey = true;
              }
            }
          }

          var renamedColumns = clone(f.renamedColumns) || {};
          for (key in Object.keys(renamedColumns)) {
            if (!(key in columns)) {
              delete renamedColumns[key];
            }
          }

          var deletedColumns = Object.keys(columns).filter(function (col) {
            return !(col in f.columns);
          });

          if (addedForeignKey || Object.keys(renamedColumns).length > 0 || deletedColumns.length > 0) {
            // must recreate table and migrate data
            var copyData = function (oldName: string, newName: string) {
              var oldTableColumns = Object.keys(columns).filter(function (col) { return (col in f.columns) || (col in renamedColumns); });
              var newTableColumns = oldTableColumns.map(function (col) { return (col in renamedColumns) ? renamedColumns[col] : col; });
              if(oldTableColumns.length && newTableColumns.length) {
                var stmt = "INSERT INTO " + newName + " (" + newTableColumns.join(", ") + ") ";
                stmt += "SELECT " + oldTableColumns.join(", ") + " FROM " + oldName + ";";
                return self.exec(tx, stmt);
              }
            };

            var renameTable = function (oldName: string, newName: string) {
              return self.exec(tx, 'ALTER TABLE ' + oldName + ' RENAME TO ' + newName);
            };

            var newTableName = 'new_' + f.tableName;
            console.assert(!(newTableName in schema));

            return Promise.all([
                createTable(newTableName),
                copyData(f.tableName, newTableName),
                dropTable(f.tableName),
                renameTable(newTableName, f.tableName),
                createIndices(true)
              ]);

          } else if (addedColumns.length > 0) {
            // alter table, add columns
            var promises: Promise<any>[] = [];
            addedColumns.forEach(function (columnName: string) {
              var attrs: Column = f.columns[columnName];
              var columnDecl = columnName + ' ' + Column.sqlType(attrs.type);
              promises.push(self.exec(tx, 'ALTER TABLE ' + f.tableName + ' ADD COLUMN ' + columnDecl));
            });
            promises.push(createIndices());
            return Promise.all(promises);
          } else {
            // no table modification is required
            return createIndices();
          }
        }
      } else {
        //console.log('creating table: ' + f.tableName);
        return Promise.all([
          createTable(f.tableName),
          createIndices(true)
        ]);
      }
    }


    /**
     * Save all objects to database.  Atomic operation- all objects will be saved within the same transaction
     * or nothing will be written.  Objects can be heterogeneous.
     *
     * @param objects - objects to save
     */
    save(...objects: Instance[]) {
      objects.map(function (o: Instance) {
        console.assert(('_' + o._model.key) in o, "object must have a key");
      });

      var self = this;

      return new Promise(function (resolve, reject) {
        self.db.transaction(function (tx: SQLTransaction): Promise<any> {
          function value(o: Instance, col: string) {
            var val = o['_' + col];
            switch(o._model.columns[col].type) {
              case ColumnType.date:
              case ColumnType.datetime:
                if(typeof val !== 'undefined') {
                  console.assert(val instanceof Date);
                  val = Math.floor(val.getTime() / 1000);
                }
                break;

              case ColumnType.json:
                val = JSON.stringify(val);
                break;

              case ColumnType.enum:
                console.assert(o._model.columns[col].enum != null);
                val = val.toString();
                break;

              default:
                console.assert(typeof val !== 'object');
                break;
            }
            return val;
          }

          function insertSets(o: Instance, force: boolean): Promise<boolean> {
            var changes = o._changes();
            var f = o._model;
            var promises: Promise<void>[] = [];
            Object.keys(f.columns)
            .filter(function(col: string) {
              return (f.columns[col].type === ColumnType.set) && (force || changes.indexOf(col) > -1);
            })
            .forEach(function(col: string) {
              var ref = f.columns[col].ref;
              var setTable = f.columns[col].setTable;
              console.assert(ref != null);
              console.assert(setTable != null);
              var set: Set = o['_' + col];
              if(set) {
                var key = o._primaryKey();
                var deletions = set.getRemoved();
                var additions = set.getAdded();
                deletions.forEach(function(del) {
                  promises.push( self.exec<void>(tx, 'DELETE FROM ' + setTable.tableName + ' WHERE ' + f.key + '=? AND ' + col + '=?', [ key, del ]) );
                });
                additions.forEach(function(add) {
                  promises.push( self.exec<void>(tx, 'INSERT INTO ' + setTable.tableName + ' (' + f.key + ', ' + col + ') VALUES (?, ?)', [key, add]) );
                });
              }
            });
            return Promise.all(promises).then(() => true);
          }

          function insert(o: Instance, callback: (changes: boolean) => Promise<boolean> = null): Promise<boolean> {
            var f = o._model;
            var isNotSet = function(col: string) { return f.columns[col].type !== ColumnType.set; };
            var cols = Object.keys(f.columns).filter(isNotSet);
            var columns = cols.join(', ');
            var values = cols.map(function () { return '?'; }).join(', ');
            var args = cols.map(function(col) { return value(o, col); });
            return self.exec(tx, 'INSERT OR IGNORE INTO ' + f.tableName + ' (' + columns + ') VALUES (' + values + ')', args, function (tx, results) {
              var changes = results.rowsAffected !== 0;
              return callback ? callback(changes) : changes;
            });
          }

          function update(o: Instance, callback: (changes: boolean) => Promise<boolean> = null): Promise<boolean> {
            var f = o._model;
            var cols = o._changes();
            var isNotSet = function(col: string) { return f.columns[col].type !== ColumnType.set; };
            var isNotKey = function(col: string) { return col !== f.key; };
            var assignments = cols
              .filter(isNotSet)
              .filter(isNotKey)
              .map(function (col) { return col + '=?'; })
              .join(', ');
            var values = cols
              .filter(isNotSet)
              .filter(isNotKey)
              .map(function(col) { return value(o, col); });
            values.push(o['_' + f.key]); // for WHERE clause
            return self.exec(tx, 'UPDATE OR IGNORE ' + f.tableName + ' SET ' + assignments + ' WHERE ' + f.key + '=?', values, function (tx, results) {
              var changes = results.rowsAffected !== 0;
              return callback ? callback(changes) : changes;
            });
          }

          var upsert = function (o: Instance): Promise<any> {
            var p: Promise<any>;
            if (o._isInDb) {
              p = update(o, function (changed) { return changed ? insertSets(o, false) : insert(o); });
            } else {
              p = insert(o, function (changed) { return changed ? insertSets(o, true) : update(o); });
            }
            return p
            .then(function (changed: boolean) {
              console.assert(changed);
              if(changed) {
                o._clearChanges();
                o._isInDb = true;
              }
            });
          };

          return Promise.all(objects.map(upsert)).then(resolve, reject);
        });
      });
    }
  }

}
