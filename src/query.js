'use strict';

var Util = require('./util');
var keyOf = Util.keyOf;


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
  this._limit = undefined;
  this._offset = undefined;
  this._asc = true;
  this._nocase = false;

  // add child tables
  for(var col in model.columns) {
    if(model.columns[col].type !== 'set') {
      this._columns.push(model.tableName + '.' + col);
    }
  }
};


Query.prototype.all = function() {
  return this.get();
};


Query.prototype.addCondition = function(conj, col, op, val) {
  var fields = col.split(/\./);
  var field;
  var f = this._model;
  val = keyOf(val);

  for(var i=0; i<fields.length - 1; i++) {
    field = fields[i];
    console.assert(field in f.columns);
    var ref = f.columns[field].ref;
    console.assert(ref);
    if(this._tables.indexOf(ref.tableName) === -1) {
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
  
  field = fields[fields.length - 1];

  switch(op) {
    case 'contains':
      console.assert(f.columns[field].type === 'set');
      var setTable = f.columns[field].setTable;
      console.assert(setTable);

      if(this._tables.indexOf(setTable.tableName) === -1) {
        this._tables.push(setTable.tableName);
        this._conditions.push({
          conj: 'AND',
          col: f.tableName + '.' + f.key,
          op: '=',
          val: setTable.tableName + '.' + f.key
        });
      }

      this._conditions.push({
        conj: conj,
        col: setTable.tableName + '.' + field,
        op: '=',
        val: '?',
        arg: val
      });
      break;

    default:
      console.assert(f.columns[field].type !== 'set');
      this._conditions.push({
        conj: conj,
        col: f.tableName + '.' + field,
        op: op,
        val: '?',
        arg: val
      });
    break;
  }
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
  this._order = this._model.tableName + '.' + col;
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
 * Limits the result set to a certain number.  Useful in pagination
 *
 * @return {Query}
 * @see Query#offset
 * @example
 *  return Class.all.limit(5).get();
 *  // -> SELECT ... FROM ... LIMIT 5
 */
Query.prototype.limit = function(count) {
  this._limit = count;
  return this;
};


/**
 * Skip a number of results.  Useful in pagination
 *
 * @return {Query}
 * @see Query#limit
 * @example
 *  return Class.all.limit(10).offset(50).get();
 *  // -> SELECT ... FROM ... LIMIT 10 OFFSET 50
 */
Query.prototype.offset = function(count) {
  this._offset = count;
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
  console.assert(!this._offset || this._limit);
  if(this._limit) {
    stmt += ' LIMIT ' + this._limit;
    if(this._offset) {
      stmt += ' OFFSET ' + this._offset;
    }
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
          return (model.columns[col].type === 'set');
        })
        .map(function(col) {
          var setTable = model.columns[col].setTable;
          console.assert(setTable);
          var key = o.key();
          var s = 'SELECT ' + col;
          s += ' FROM ' + setTable.tableName;
          s += ' WHERE ' + query._model.key + ' = ?';
          return query._store.exec(tx, s, [key], function(tx, results) {
            if(results.rows.length > 0) {
              o[col].initFromDb(results);
            }
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
