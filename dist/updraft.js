(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./src/main.js":[function(require,module,exports){
'use strict';

/* updraft main */
// TODO
//  lists

/**
 * @namespace Updraft
 */
var Updraft = {};
Updraft.VERSION = '0.4.0';

var util = require('./util');
var Model = require('./model');
var clone = util.clone;
var startsWith = util.startsWith;

/**
 * Column types.  Ignore the values; only use the keys.  Note that these are just column
 * affinities, and technically any value type can be stored in any column type.
 * see {@link https://www.sqlite.org/datatype3.html}
 *
 * @enum {string}
 * @readonly
 */
Updraft.columnType = {
  'int': 'INTEGER',
  'bool': 'BOOL',
  'real': 'REAL',
  'text': 'TEXT',
  'blob': 'BLOB',
  'date': 'DATE',
  'datetime': 'DATETIME',
  
  /** object will be serialized & restored as JSON text */
  'json': 'TEXT',

  /** points to an object in another table.  Its affinity will be that table's key's affinity */
  'ptr': 'ref',

  /** list of ptr */
  'list': 'ref',
};

var columnType = Updraft.columnType;

/**
 * The class template used by {@link Updraft.Store#createClass}.
 *
 * @typedef
 * @name Updraft.ClassTemplate
 * @property {string} tableName - the name of the table in which entities of this type will be stored.  Cannot begin with underscore.
 * @property {bool} [recreate=false] - whether the table should be recreated (dropped) if it exists.  All data will be lost.
 * @property {bool} [temp=false] - whether the table should be created as temporary (will not persist)
 * @property {Object} columns - an object describing the fields of objects of this type
 * @property {string} columns.key - name of the field
 * @property {object} columns.value
 * @property {columnType} columns.value.type - 'int', 'bool', etc.
 * @property {bool} [columns.value.key=false] - set to true on the field that should be the primary key.  Only set one.
 * @property {bool} [columns.value.index=false] - create an index on this field
 * @property {object} [renamedColumns] - old column name is the key, new column name is the value
 * @example
 *  {
 *    tableName: 'users',
 *    columns: {
 *      'id': { key: true, type: 'int' },
 *      'name': { type: 'text' },
 *      'address3': { type: 'text' }
 *    },
 *    renamedColumns: {
 *      // migrate 'address2' column data into column 'address3'
 *      // the column must be specified in 'columns'
 *      'address2': 'address3'
 *    }
 *  }
 */


/**
 * The parameters used to open a database
 *
 * @typedef
 * @name Updraft.StoreOptions
 * @property {string} name - the name of the database to open
 */


/**
 * Interface for creating classes & database interaction
 *
 * @class
 * @property {bool} [logSql=false] - log sql statements to console.log
 */
var Store = function () {
  var self = this;
  this.tables = [];
  this.triggers = {};
  this.logSql = false;

  
  /**
   * create a new type whose instances can be stored in a database
   * @param {Updraft.ClassTemplate} templ
   * @return {Model}
   * @see ExampleModel
   * @example 
   *  var ExampleModel = store.createClass({
   *    tableName: 'exampleModel',
   *    columns: {
   *      keyField: { type: 'int', key: true },
   *      stringField: { type: 'text' },
   *      jsonField: { type: 'json' },
   *      indexedField: { type: 'int', index: true },
   *      childField: { type: 'ptr', ref: ChildClass }
   *    }
   *  });
   */
  this.createClass = function(templ) {
    var m = new Model(self, templ);
    //var m = Model.createModel(self, templ);
    self.tables.push(m);
    return m;
  };
  

  /**
   * Delete all tables in database.  For development purposes; you probably don't want to ship with this.
   *
   * @global
   * @typedef
   * @param {Updraft.StoreOptions} opts
   * @return {Promise} a promise that resolves when all tables are deleted
   * @see Updraft.Store#open
   * @example
   *    store.purge({name: 'my cool db'}).then(function() {
   *      // everything is gone
   *    });
   */
  this.purge = function(opts) {
    console.assert(!self.db);

    self.db = window.openDatabase(opts.name, '1.0', 'updraft created database', 5 * 1024 * 1024);
    console.assert(self.db);
    return self.readSchema()
      .then(function(schema) {
        return new Promise(function(fulfill, reject) {
          self.db.transaction(function(tx) {
            var p = Promise.resolve();
            Object.keys(schema).forEach(function(table) {
              p = p.then(self.exec(tx, 'DROP TABLE ' + table));
            });
            return p.then(function() {
              self.db = null;
            })
            .then(fulfill, reject);
          });
        });
      });
  };


  /**
   * open the database
   *
   * @param {Updraft.StoreOptions} opts
   * @return {Promise} a promise that resolves with no parameters when the database is created and ready
   * @example
   *    store.open({name: 'my cool db'}).then(function() {
   *      // start loading & saving objects
   *    });
   */
  this.open = function (opts) {
    self.db = window.openDatabase(opts.name, '1.0', 'updraft created database', 5 * 1024 * 1024);
    console.assert(self.db);
    
    // add list tables
    var listTables = [];
    for(var i=0; i<self.tables.length; i++) {
      var table = self.tables[i];
      for(var col in table.columns) {
        if(table.columns[col].type === 'list') {
          var ref = table.columns[col].ref;
          console.assert(ref);
          var listTable = {};
          listTable.tableName = table.tableName + '_' + col;
          listTable.recreate = table.recreate;
          listTable.temp = table.temp;
          listTable.key = '';
          listTable.keyType = table.keyType;
          listTable.columns = {};
          listTable.columns[table.key] = { type: table.keyType }; // note: NOT setting key=true, as it would impose unique constraint
          listTable.columns[col] = { type: ref.keyType };
          listTable.indices = [ [table.key], [col] ];
          table.columns[col].listTable = listTable;
          listTables.push(listTable);
        }
      }
    }
    
    self.tables = self.tables.concat(listTables);
    
    return self.readSchema()
            .then(syncTables);
  };


  /**
   * close the database
   */
  this.close = function () {
    self.db = null;
    self.tables = [];
    self.triggers = {};
  };


  /**
   * exec a sql statement within a given transaction
   *
   * @param {SQLTransaction} tx - a transaction created by <tt>db.transaction</tt> or <tt>db.readTransaction</tt>
   * @param {string} stmt - sql statement to execute
   * @param {string[]} args - array of strings to substitute into <tt>stmt</tt>
   * @param {function} [callback=null] - callback with parameters (transaction, [SQLResultSet]{@link http://www.w3.org/TR/webdatabase/#sqlresultset})
   * @return {Promise} a promise that resolves with (transaction, return value of the callback)
   * @private
   */
  this.exec = function(tx, stmt, args, callback) {
    if(self.logSql) {
      console.log(stmt, args);
    }
    return new Promise(function (fulfill, reject) {
      try {
        tx.executeSql(stmt, args,
                      function (tx, results) {
                        var ret = callback ? callback(tx, results) : null;
                        return Promise.resolve(ret).then(fulfill, reject);
                      },
                      function (tx, error) {
                        reportError(error);
                        reject(error);
                      });
      } catch (reason) {
        console.log('Failed to exec "' + stmt + '":' + reason);
        throw reason;
      }
    });
  };


  /**
   * exec a sql statement within a new read transaction
   *
   * @param {string} stmt - sql statement to execute
   * @param {string[]} args - array of strings to substitute into <tt>stmt</tt>
   * @param {function} [callback=null] - callback with parameters (transaction, [SQLResultSet]{@link http://www.w3.org/TR/webdatabase/#sqlresultset})
   * @return {Promise} a promise that resolves with (transaction, return value of the callback)
   * @private
   */
  this.execRead = function(stmt, args, callback) {
    console.assert(self.db);
    return new Promise(function (fulfill, reject) {
      self.db.readTransaction(function (rtx) {
        return self.exec(rtx, stmt, args, callback)
                .then(fulfill, reject);
      });
    });
  };


  function reportError(error) {
    switch (error.code) {
      case error.SYNTAX_ERR:
        console.log("Syntax error: " + error.message);
        break;
      default:
        console.log(error);
    }
  }


  /**
   * Database schema.  The outer keys will be the tables in the database.  The values will consist of an
   * object whose keys will be the table's rows and values will be the row's type.  It will also have an
   * '_indices' object with all the indices found.
   * Note: tables or indices beginning with underscore or 'sqlite' will be ignored
   *
   * @typedef
   * @name Updraft.Schema
   * @example
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
   */


  /**
   * get the existing database's schema in object form
   *
   * @return {Promise} a promise that resolves with the {@link Updraft.Schema}
   */
  this.readSchema = function () {
    function tableFromSql(sql) {
      var table = { _indices: {}, _triggers: {} };
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

    return self.execRead('SELECT name, tbl_name, type, sql FROM sqlite_master', [], function (tx, results) {
      /*jshint camelcase:false*/
      var schema = {};
      for (var i = 0; i < results.rows.length; i++) {
        var row = results.rows.item(i);
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
  };


  /**
   * Check whether the tables in the current database match up with the ClassFactories.
   * They will be created or modified as needed.
   *
   * @param {Updraft.Schema} schema
   * @return {Promise} A promise that resolves with no parameters once all tables are up-to-date.
   * @private
   */
  function syncTables(schema) {
    console.assert(self.db);
    return new Promise(function (fulfill, reject) {
      self.db.transaction(function (tx) {
        return Promise.all(self.tables.map(function (f) { return syncTable(tx, schema, f); }))
          .then(fulfill, reject);
      });
    });
  }


  /**
   * Check whether an individual table in the current database matches up with its corresponding Model.
   * It will be created or modified as needed.
   *
   * @param {SQLTransaction} tx - a writeable transaction
   * @param {Updraft.Schema} schema
   * @param {object} f - a {@link Model} or other object that describes a table
   * @return {Promise} A promise that resolves with no parameters once the table is up-to-date.
   * @private
   */
  function syncTable(tx, schema, f) {
    // execute CREATE TABLE statement
    function createTable(name) {
      var cols = [];
      for (var col in f.columns) {
        var attrs = f.columns[col];
        var decl;
        console.assert(attrs.type in columnType);
        switch (attrs.type) {
          case 'ptr':
            console.assert(attrs.ref);
            console.assert(attrs.ref.columns);
            console.assert(attrs.ref.tableName);
            console.assert(attrs.ref.key);
            var foreignType = attrs.ref.columns[attrs.ref.key].type;
            console.assert(foreignType in columnType);
            decl = col + ' ' + columnType[foreignType];
            cols.push(decl);
            break;
            
          case 'list':
            break;

          default:
            console.assert(attrs.type in columnType);
            decl = col + ' ' + columnType[attrs.type];
            if (f.key === col) {
              decl += ' PRIMARY KEY';
            }
            cols.push(decl);
        }
      }
      return self.exec(tx, 'CREATE ' + (f.temp ? 'TEMP ' : '') + 'TABLE ' + name + ' (' + cols.join(', ') + ')');
    }

    function dropTable(name) {
      return self.exec(tx, 'DROP TABLE ' + name);
    }

    function createIndices(force) {
      var p = Promise.resolve();
      var toRemove = (f.tableName in schema) ? clone(schema[f.tableName]._indices) : {};
      f.indices.forEach(function (index) {
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
          p = p.then(self.exec(tx, 'DROP INDEX ' + name));
        }
        if (create || force) {
          p = p.then(self.exec(tx, sql));
        }
      });

      // delete orphaned indices
      Object.keys(toRemove).forEach(function (name) {
        p = p.then(self.exec(tx, 'DROP INDEX ' + name));
      });
      return p;
    }

    // check if table already exists
    if (f.tableName in schema) {
      if (f.recreate) {
        return Promise.resolve()
          .then(dropTable(f.tableName))
          .then(createTable(f.tableName))
          .then(createIndices(true));
      } else {
        //console.log("table " + f.tableName + " exists; checking columns");
        var columns = clone(schema[f.tableName]);
        delete columns._indices;
        delete columns._triggers;
        var key;

        var addedColumns = [];
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
          var copyData = function (oldName, newName) {
            var oldTableColumns = Object.keys(columns).filter(function (col) { return (col in f.columns) || (col in renamedColumns); });
            var newTableColumns = oldTableColumns.map(function (col) { return (col in renamedColumns) ? renamedColumns[col] : col; });
            var stmt = "INSERT INTO " + newName + " (" + newTableColumns.join(", ") + ") ";
            stmt += "SELECT " + oldTableColumns.join(", ") + " FROM " + oldName + ";";
            return self.exec(tx, stmt);
          };

          var renameTable = function (oldName, newName) {
            return self.exec(tx, 'ALTER TABLE ' + oldName + ' RENAME TO ' + newName);
          };

          var newTableName = 'new_' + f.tableName;
          console.assert(!(newTableName in schema));

          return Promise.resolve()
            .then(createTable(newTableName))
            .then(copyData(f.tableName, newTableName))
            .then(dropTable(f.tableName))
            .then(renameTable(newTableName, f.tableName))
            .then(createIndices(true));

        } else if (addedColumns.length > 0) {
          // alter table, add columns
          var p = Promise.resolve();
          addedColumns.map(function (columnName) {
            var attrs = f.columns[columnName];
            console.assert(attrs.type in columnType);
            var columnDecl = columnName + ' ' + columnType[attrs.type];
            p = p.then(self.exec(tx, 'ALTER TABLE ' + f.tableName + ' ADD COLUMN ' + columnDecl));
          });
          return p
            .then(createIndices());
        } else {
          // no table modification is required
          return createIndices();
        }
      }
    } else {
      //console.log('creating table: ' + f.tableName);
      return Promise.resolve()
        .then(createTable(f.tableName))
        .then(createIndices(true));
    }
  }


  /**
   * Save all objects to database.  Atomic operation- all objects will be saved within the same transaction
   * or nothing will be written.  Objects can be heterogeneous.
   *
   * @param {Updraft.Instance[]} objects
   */
  this.save = function (objects) {
    objects.map(function (o) {
      console.assert(('_' + o.model.key) in o, "object must have a key");
    });

    return new Promise(function (resolve, reject) {
      self.db.transaction(function (tx) {
        function value(o, col) {
          var val = o['_' + col];
          if(typeof val === 'object') {
            val = JSON.stringify(val);
          }
          return val;
        }
        
        function insertLists(o, force) {
          var changes = o.changes();
          var f = o.model;
          var promises = [];
          Object.keys(f.columns)
          .filter(function(col) {
            return (f.columns[col].type === 'list') && (force || changes.indexOf(col) > -1);
          })
          .forEach(function(col) {
            var ref = f.columns[col].ref;
            var listTable = f.columns[col].listTable;
            console.assert(ref);
            console.assert(listTable);
            var values = o['_' + col];
            var key = o[f.key];
            promises.push( self.exec(tx, 'DELETE FROM ' + listTable.tableName + ' WHERE ' + f.key + '=?', [ key ]) );
            values.forEach(function(value) {
              promises.push( self.exec(tx, 'INSERT INTO ' + listTable.tableName + ' (' + f.key + ', ' + col + ') VALUES (?, ?)', [key, value]) );
            });
          });
          return Promise.all(promises);
        }
        
        function insert(o, callback) {
          var f = o.model;
          var isNotList = function(col) { return f.columns[col].type !== 'list'; };
          var cols = Object.keys(f.columns).filter(isNotList);
          var columns = cols.join(', ');
          var values = cols.map(function () { return '?'; }).join(', ');
          var args = cols.map(function(col) { return value(o, col); });
          return self.exec(tx, 'INSERT OR IGNORE INTO ' + f.tableName + ' (' + columns + ') VALUES (' + values + ')', args, function (tx, results) {
            var changes = results.rowsAffected !== 0;
            return callback ? callback(changes) : changes;
          });
        }

        function update(o, callback) {
          var f = o.model;
          var cols = o.changes();
          var isNotList = function(col) { return f.columns[col].type !== 'list'; };
          var isNotKey = function(col) { return col !== f.key; };
          var assignments = cols
            .filter(isNotList)
            .filter(isNotKey)
            .map(function (col) { return col + '=?'; })
            .join(', ');
          var values = cols
            .filter(isNotList)
            .filter(isNotKey)
            .map(function(col) { return value(o, col); });
          values.push(o['_' + f.key]); // for WHERE clause
          return self.exec(tx, 'UPDATE OR IGNORE ' + f.tableName + ' SET ' + assignments + ' WHERE ' + f.key + '=?', values, function (tx, results) {
            var changes = results.rowsAffected !== 0;
            return callback ? callback(changes) : changes;
          });
        }

        var upsert = function (o) {
          var p;
          if (o._isInDb) {
            p = update(o, function (changed) { return changed ? insertLists(o, false) : insert(o); });
          } else {
            p = insert(o, function (changed) { return changed ? insertLists(o, true) : update(o); });
          }
          return p
          .then(function (changed) {
            console.assert(changed);
            if(changed) {
              o._changes = 0;
              o._isInDb = true;
            }
          });
        };

        return Promise.all(objects.map(upsert)).then(resolve, reject);
      });
    });
  };

};


Updraft.Store = Store;

module.exports = Updraft;

if (window) {
  window.Updraft = Updraft;
}

},{"./model":"/Users/aolson/Developer/updraft/src/model.js","./util":"/Users/aolson/Developer/updraft/src/util.js"}],"/Users/aolson/Developer/updraft/src/model.js":[function(require,module,exports){
'use strict';

var util = require('./util');
var Query = require('./query');



/**
 * Instances of this type will have properties for all the columns defined in its {@link Model}.
 * You can add additional properties, but they will not be saved.  Object will track which properties have changed
 * since the last save.  Fields of type 'ptr' will return an object { [table's key]:[value], get: [function returning promise evaluating to object] }
 * 
 *  Do not create objects of type Instance directly; instead create instances of a Model created by {@link Store#createClass}
 *
 * @see Model
 * @class
 * @example
 *  var store = new Updraft.Store();
 *  var Model = store.createClass(...);
 *  var i = new Model(); // i is an Instance
 */
function Instance(props) {
  var o = this;
  o._changes = 0;
  Object.keys(this.model.columns).forEach(function(col) {
    if(o.model.columns[col].type === 'list') {
      o['_' + col] = [];

      // allow client to do object.field.push(otherobject); we'll transform it to object.field.push(otherobject.key())
      o['_' + col].push = function() {
        var args = Array.prototype.slice.call(arguments).map(function(arg) {
          if(typeof arg === 'object') {
            return arg.key();
          } else {
            return arg;
          }
        });
        var array = o['_' + col];
        var ret = Array.prototype.push.apply(array, args);
        o[col] = array; // this will mark it dirty
        return ret;
      };
    }
  });
  props = props || {};
  for (var key in props) {
    o[key] = props[key];
  }
}


/**
 * Return the object's primary key's value
 *
 * @returns {string} Value of primary key
 * @example
 *  var x = new Class();
 *  x.id = 123;
 *  console.log(x.key());
 *  // -> '123'
 */
Instance.prototype.key = function() {
  var key = '_' + this.model.key;
  console.assert(key in this);
  return this[key];
};



/**
 * Get the fields that have been changed since the object was last loaded/saved
 *
 * @returns {string[]} Names of the fields that have changed
 * @example
 *  var x = new Class();
 *  x.foo = 'bar';
 *  console.log(x.changes());
 *  // -> ['foo']
 */
Instance.prototype.changes = function () {
  var changes = [];
  var propIdx = 0;
  for (var col in this.model.columns) {
    var propMask = (1 << propIdx++);
    if (this._changes & propMask) {
      changes.push(col);
    }
  }
  return changes;
};



var addClassProperty = function(model, proto, col, propMask) {
  var prop = '_' + col;

  switch(model.columns[col].type) {
    default:
      Object.defineProperty(proto, col, {
        get: function () {
          return this[prop];
        },
        set: function (val) {
          if (this[prop] !== val) {
            this[prop] = val;
            this._changes |= propMask;
          }
        }
      });
      break;

    case 'ptr':
      Object.defineProperty(proto, col, {
        get: function () {
          var ref = this.model.columns[col].ref;
          console.assert(ref.get);
          var ret = {};
          ret.ref = ref;
          ret.own = this;
          ret[ref.key] = this[prop];
          ret.get = function () { return this.ref.get(this.own[prop]); };
          return ret;
        },
        set: function (val) {
          // allow client to do object.field = otherobject; we'll transform it to object.field = otherobject.key()
          if(typeof val === 'object') {
            val = val.key();
          }
          if (this[prop] !== val) {
            this[prop] = val;
            this._changes |= propMask;
          }
        }
      });
      break;

    case 'list':
      Object.defineProperty(proto, col, {
        get: function() {
          return this[prop];
        },
        set: function(val) {
          // allow client to do object.field = [otherobject]; we'll transform it to object.field = [otherobject.key()]
          val = val.map(function(arg) {
            if(typeof arg === 'object') {
              return arg.key();
            } else {
              return arg;
            }
          });
          this[prop] = val;
          this._changes |= propMask;
        }
      });
      break;
  }
};



/**
 * A class that you can use to create, save, and retrieve {@link Instance}s.
 * Do not create instances of type Model directly; instead use {@link Store#createClass}
 *
 * @property {string} tableName - the name of the table in which entities of this type will be stored.  Cannot begin with underscore.
 * @property {string} key - the name of the primary key for this table
 * @property {Updraft.columnType} keyType - the type of the primary key for this table
 * @property {Object} columns - an object describing the fields of objects of this type
 * @property {string} columns.key - name of the field
 * @property {object} columns.value
 * @property {Updraft.columnType} columns.value.type - 'int', 'bool', etc.
 * @property {bool} [columns.value.key=false] - set to true on the field that should be the primary key.  Only set one.
 * @property {bool} [columns.value.index=false] - create an index on this field
 * @property {Query} all - use to construct a query
 * @see ExampleModel
 * @class
 * @param {Store} store
 * @param {Updraft.ClassTemplate} templ
 * @example
 *  var ExampleModel = store.createClass({
 *    tableName: 'exampleModel',
 *    columns: {
 *      keyField: { type: 'int', key: true },
 *      stringField: { type: 'text' },
 *      jsonField: { type: 'json' },
 *      indexedField: { type: 'int', index: true },
 *      childField: { type: 'ptr', ref: ChildClass }
 *    }
 *  });
 *  
 *  var x = new ExampleModel({keyField: 123});
 */
function Model(store, templ) {
  console.assert(store);
  console.assert(templ);
  console.assert(templ.tableName);
  console.assert(templ.tableName[0] !== '_');
  console.assert(templ.columns);
  console.assert(Object.keys(templ.columns).length < 64);
  console.assert(!('changes' in templ.columns));
  console.assert(!('template' in templ.columns));
  console.assert(!templ.renamedColumns || Object.keys(templ.renamedColumns).every(function (old) { return !(old in templ.columns); }));
  
  var ModelInstance = function() {
    Instance.apply(this, arguments);
  };

  ModelInstance.prototype = Object.create(Instance.prototype);
  ModelInstance.prototype.constructor = ModelInstance;
  
  var m = function(props) {
    return new ModelInstance(props);
  };

  Object.setPrototypeOf(m, Model.prototype);
  
  Object.defineProperty(ModelInstance.prototype, 'model', { enumerable: true, value: m });
  Object.defineProperty(ModelInstance.prototype, 'factory', { enumerable: true, value: m });

  m.ModelInstance = ModelInstance;
  
  Object.defineProperty(m, 'store', { enumerable: true, value: store });
  
  Object.defineProperty(m, 'all', {
    get: function() {
      return new Query(this, this.store);
    }
  });

  m.indices = [];

  for (var key in templ) {
    m[key] = util.clone(templ[key]);
  }

  m.key = null;
  m.keyType = null;

  var propIdx = 0;
  for(var col in m.columns) {
    if (m.columns[col].key) {
      m.key = col;
      m.keyType = m.columns[col].type;
    }
    if (m.columns[col].index) {
      m.indices.push([col]);
    }

    var propMask = (1 << propIdx++);
    addClassProperty(m, ModelInstance.prototype, col, propMask);
    if (propIdx >= 63) {
      throw new Error("class has too many columns- max 63");
    }
  }

  console.assert(m.key);

  return m;
}


/**
 * Get a single object from database by its key
 *
 * @param id - value to find in table's primary key
 * @returns {Promise<Instance>} Promise that resolves with element or null if not found
 * @example
 *  Class.get(123).then(function(obj) {
 *    if(obj) {
 *      console.log('found object 123:', obj);
 *    } else {
 *      console.log('object 123 was not in db');
 *    }
 *  });
 */
Model.prototype.get = function (id) {
  return this.all.where(this.key, '=', id).get()
  .then(function(results) {
    console.assert(results.length < 2);
    if(results.length === 0) {
      return null;
    } else {
      return results[0];
    }
  });
};


/**
 * construct object from a database result row
 *
 * @param {SQLRow} row
 * @return instance of Model with fields initialized according to row, with _isInDb=true and no changes set
 * @private
 */
Model.prototype.constructFromDb = function(row) {
  var o = new this.ModelInstance();
  for(var col in row) {
    var val = row[col];
    var _col = '_' + col;
    switch(this.columns[col].type) {
      case 'json':
        o[_col] = JSON.parse(val);
        break;
      case 'list':
        o[_col].push(val);
        break;
      default:
        o[_col] = val;
        break;
    }
  }

  o._isInDb = true;
  console.assert(o._changes === 0);
  return o;
};



/**
 * Example class, an {@link Instance} returned by {@link Store#createClass}
 *
 * @class
 * @extends Instance
 * @name ExampleModel
 * @property {int} keyField - object's primary key, unique in the table
 * @property {string} stringField
 * @property {object} jsonField - can be any javascript type, object, or nesting of objects.  Will be 
 *           stored stringified, so any shared properties will no longer be shared after reloading from db.
 * @property {int} indexedField - a regular integer field, but queries testing indexed fields will be faster.
 *           Doesn't have to be <tt>int</tt>- any field type can be indexed.
 * @property childField - a pseudo 'ChildClass' object.  Although you can assign to it, the object won't be available.
 *           That is, you will always need to call 'childField.get()' and wait for the promise, even if you just
 *           assigned to it.
 * @property {int} childField.id - the key of the child object pointed to.  Note that the member 'id' is because 
 *           ChildClass's key is named 'id'; similarly the type is inherited from ChildClass's key type.  This 
 *           is the only part of the reference that is stored on the object.
 * @property {list} listField - a searchable collection of objects
 * @see Updraft.ClassTemplate, Model
 * @example
 *  var ChildClass = store.createClass({
 *    tableName: 'childClass',
 *    columns: {
 *      id: { type: 'int', key: true },
 *      intField: { type: 'int', index: true }
 *    }
 *  });
 *  var ExampleModel = store.createClass({
 *    tableName: 'exampleModel',
 *    columns: {
 *      keyField: { type: 'int', key: true },
 *      stringField: { type: 'text' },
 *      jsonField: { type: 'json' },
 *      indexedField: { type: 'int', index: true },
 *      childField: { type: 'ptr', ref: ChildClass }
 *    }
 *  });
 *
 *  var child = new ChildClass({id: 321, intField: 456});
 *
 *  var x = new ExampleModel();
 *  x.keyField = 123;
 *  x.stringField = 'string example';
 *  x.jsonField = { x: 1, y: 'a', z: { foo: 'bar' } };
 *  console.log(x.changes());
 *  // -> ['keyField', 'stringField', 'jsonField']
 *
 *  // the following lines are exactly equivalent:
 *  x.childField = child;
 *  x.childField = child.id;
 *  x.childField = 321;
 *
 *  console.log(x.childField.id); // -> 321
 *
 *  x.childField.get().then(function(c) {
 *    // child was never saved, so c is null, unless there was
 *    // already a ChildClass with id=321 in the db');
 *  });
 *
 *  // ... assume more objects have been created and saved ...
 *
 *  ExampleModel.all.where('childField.intField', '=', 456).get()
 *  .then(function(results) {
 *    // results is an array containing (a copy of) x and anything
 *    // else that has the same 
 *  });
 */


module.exports = Model;

},{"./query":"/Users/aolson/Developer/updraft/src/query.js","./util":"/Users/aolson/Developer/updraft/src/util.js"}],"/Users/aolson/Developer/updraft/src/query.js":[function(require,module,exports){
'use strict';


/**
 * Do not construct objects of type Query directly- instead, use {@link Model}.all
 * @class
 * @constructor
 * @param {Model} model
 * @param {Store} store
 */
var Query = function(model, store) {
  console.assert(model);
  console.assert(store);
  this._model = model;
  this._store = store;
  this._justCount = false;
  this._tables = [model.tableName];
  this._columns = [];
  this._conditions = [];
  this._order = undefined;
  this._asc = true;
  this._nocase = false;

  // add child tables
  for(var col in model.columns) {
    if(model.columns[col].type !== 'list') {
      this._columns.push(model.tableName + '.' + col);
    }
  }
};


Query.prototype.all = function() {
  return this.get();
};


Query.prototype.addCondition = function(conj, col, op, val) {
  var fields = col.split(/\./);
    var f = this._model;
    for(var i=0; i<fields.length - 1; i++) {
      var field = fields[i];
      console.assert(field in f.columns);
      var ref = f.columns[field].ref;
      console.assert(ref);
      if(this._tables.indexOf(ref.tableName)) {
        this._tables.push(ref.tableName);
        this._conditions.push({
          conj: 'AND',
          col: f.tableName + '.' + field,
          op: '=',
          val: ref.tableName + '.' + ref.key
        });
      }
      f = ref;
    }
    this._conditions.push({
      conj: conj,
      col: f.tableName + '.' + fields[fields.length - 1],
      op: op,
      val: '?',
      arg: val
    });
  return this;
};


/**
 * Adds an 'AND' condition to the query
 *
 * @method
 * @param {string} col - column field to match on
 * @param {string} op - SQLite binary [operator]{@link https://www.sqlite.org/lang_expr.html}
 * @param val - value to match against {@linkcode col}
 * @return {Query}
 * @see Query#or
 * @example
 *  return Class.all.where('col2', '>', 10).and('col2', '<', 30).get();
 *  // -> SELECT ... WHERE col2 > 10 AND col2 < 30
 */
Query.prototype.and = function(col, op, val) {
  return this.addCondition('AND', col, op, val);
};


/**
 * alias for {@link Query#and}
 *
 * @method
 * @return {Query}
 * @example
 *  return Class.all.where('col2', '>', 10).get();
 */
Query.prototype.where = Query.prototype.and;


/**
 * Adds an 'OR' condition to the query
 *
 * @param {string} col - column field to match on
 * @param {string} op - SQLite binary [operator]{@link https://www.sqlite.org/lang_expr.html}
 * @param val - value to match against {@linkcode col}
 * @return {Query}
 * @see Query#and
 * @example
 *  return Class.all.where('col2', '=', 10).and('col2', '=', 30).get();
 *  // -> SELECT ... WHERE col2 = 10 OR col2 = 30
 */
Query.prototype.or = function(col, op, val) {
  return this.addCondition('OR', col, op, val);
};


/**
 * Sort the results by specified field
 *
 * @param {string} col - column to sort by
 * @param {bool} [asc=true] - sort ascending (true, default) or descending (false)
 * @return {Query}
 * @see Query#nocase
 * @example
 *  return Class.all.order('x').get();
 *  // -> SELECT ... ORDER BY x
 */
Query.prototype.order = function(col, asc) {
  this._order = col;
  if(typeof asc !== 'undefined') {
    this._asc = asc;
  }
  return this;
};

/**
 * Changes the match collation to be case-insensitive.  Only applies to result sorting, as 'LIKE' is 
 * always case-insensitive
 *
 * @return {Query}
 * @see Query#order
 * @example
 *  return Class.all.order('x').nocase().get();
 *  // -> SELECT ... ORDER BY x COLLATE NOCASE
 */
Query.prototype.nocase = function() {
  this._nocase = true;
  return this;
};


/**
 * Executes the query, returning a promise resolving with the count of objects that match
 *
 * @return {Promise<int>}
 * @see Query#get
 * @example
 *  return Class.all.count()
 *  .then(function(count) { console.log(count + " objects") });
 *  // -> SELECT COUNT(*) FROM ...
 */
Query.prototype.count = function() {
  this._justCount = true;
  return this.get();
};


/**
 * Executes the query, returning a promise resolving with the array of objects that match any conditions
 * set on the Query
 *
 * @return {Promise<Instance[]>}
 * @see Query#count
 * @example
 *  return Class.all.where('x', '>', 0).get();
 *  // -> SELECT ... WHERE x > 0
 */
Query.prototype.get = function() {
  var countProp = 'COUNT(*)';
  var stmt = 'SELECT ';
  var model = this._model;
  if(this._justCount) {
    stmt += countProp;
  } else {
    stmt += this._columns.join(', ');
  }
  stmt += ' FROM ' + this._tables.join(', ');
  var args = [];
  for(var i=0; i<this._conditions.length; i++) {
    var cond = this._conditions[i];
    stmt += (i === 0) ? ' WHERE ' : (' ' + cond.conj + ' ');
    stmt += cond.col + ' ' + cond.op + ' ' + cond.val;
    if('arg' in cond) {
      args.push(cond.arg);
    }
  }
  if(this._order) {
    stmt += ' ORDER BY ' + this._order;
    stmt += (this._nocase ? ' COLLATE NOCASE' : '');
    stmt += (this._asc ? ' ASC' : ' DESC');
  }

  var objects = [];
  var query = this;
  return this._store.execRead(stmt, args, function (tx, results) {
    if(query._justCount) {
      return results.rows.item(0)[countProp];
    }
    for (var i = 0; i < results.rows.length; i++) {
      var o = model.constructFromDb(results.rows.item(i));
      objects.push(o);
    }
    return Promise.all(objects.map(function(o) {
      return Promise.all(
        Object.keys(model.columns)
        .filter(function(col) {
          return (model.columns[col].type === 'list');
        })
        .map(function(col) {
          var listTable = model.columns[col].listTable;
          console.assert(listTable);
          var key = o.key();
          var s = 'SELECT ' + col;
          s += ' FROM ' + listTable.tableName;
          s += ' WHERE ' + query._model.key + ' = ?';
          return query._store.exec(tx, s, [key], function(tx, results) {
            for(var i=0; i<results.rows.length; i++) {
              var row = results.rows.item(i);
              o['_' + col].push(row[col]);
            }
            o._changes = 0;
          });
        })
      );
    }))
    .then(function() {
      return objects;
    });
  });
};


module.exports = Query;

},{}],"/Users/aolson/Developer/updraft/src/util.js":[function(require,module,exports){
'use strict';

function startsWith(str, val) {
  return str.lastIndexOf(val, 0) === 0;
}


function clone(obj) {
  var copy;

  // Handle the 3 simple types, and null or undefined
  if (null === obj || "object" !== typeof obj) {
    return obj;
  }

  // Handle Array
  if (obj instanceof Array) {
    copy = [];
    for (var i = 0, len = obj.length; i < len; i++) {
      copy[i] = clone(obj[i]);
    }
    return copy;
  }

  // Handle Object
  if (obj instanceof Object) {
    copy = {};
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) {
        copy[attr] = clone(obj[attr]);
      }
    }
    return copy;
  }

  throw new Error("Unable to copy obj! Its type isn't supported.");
}


function inherits( child, Parent ) { 
  if (Parent.constructor == Function) {
    //Normal Inheritance 
    child.prototype = Object.create(Parent.prototype);
    child.prototype.constructor = child;
    child.prototype.parent = Parent.prototype;
  } else {
    //Pure Virtual Inheritance 
    child.prototype = Parent;
    child.prototype.constructor = child;
    child.prototype.parent = Parent;
  }

  // inherit class methods
//  for (var prop in Parent) {
//    //if (typeof(Parent[prop]) === 'function' ) {
//      child[prop] = Parent[prop];
//    //}
//  }
  
  return child;
} 

module.exports.startsWith = startsWith;
module.exports.clone = clone;
module.exports.inherits = inherits;

},{}]},{},["./src/main.js"])


//# sourceMappingURL=updraft.js.map