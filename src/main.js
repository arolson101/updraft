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
