/// <reference path="../typings/tsd.d.ts" />
/// <reference path="./store.ts" />

module Updraft {

  interface Condition {
    conj: string;
    col: string;
    op: string;
    val: string;
    arg?: string;
  }


  /**
   * Do not construct objects of type Query directly- instead, use {@link ClassTemplate}.all
   * @constructor
   */
  export class Query<K, I extends Instance<any>> {
    private _model: ClassTemplate<K>;
    private _store: Store;
    private _justCount: boolean;
    private _tables: string[];
    private _columns: string[];
    private _conditions: Condition[];
    private _order: any;
    private _limit: any;
    private _offset: any;
    private _asc: boolean;
    private _nocase: boolean;

    constructor(model: ClassTemplate<K>, store: Store) {
      console.assert(model != null);
      console.assert(store != null);
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
        if(model.columns[col].type !== ColumnType.set) {
          this._columns.push(model.tableName + '.' + col);
        }
      }
    }


    all(): Promise<I[]> {
      return this.get();
    }


    private addCondition(conj: string, col: string, op: string, val: any): Query<K, I> {
      var fields = col.split(/\./);
      var field: string;
      var f = this._model;
      val = keyOf(val);

      for(var i=0; i<fields.length - 1; i++) {
        field = fields[i];
        console.assert(field in f.columns);
        var ref = f.columns[field].ref;
        console.assert(ref != null);
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
          console.assert(f.columns[field].type === ColumnType.set);
          var setTable = f.columns[field].setTable;
          console.assert(setTable != null);

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
          console.assert(f.columns[field].type !== ColumnType.set);
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
    }


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
    and(col: string, op: string, val: any): Query<K, I> {
      return this.addCondition('AND', col, op, val);
    }


    /**
     * alias for {@link and}
     *
     * @example
     * ```
     *
     *  return Class.all.where('col2', '>', 10).get();
     * ```
     */
    where(): Query<K, I> {
      return this.and.apply(this, arguments);
    }


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
    or(col: string, op: string, val: any): Query<K, I> {
      return this.addCondition('OR', col, op, val);
    }


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
    order(col: string, asc: boolean): Query<K, I> {
      this._order = this._model.tableName + '.' + col;
      if(typeof asc !== 'undefined') {
        this._asc = asc;
      }
      return this;
    }

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
    nocase(): Query<K, I> {
      this._nocase = true;
      return this;
    }


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
    limit(count: number): Query<K, I> {
      this._limit = count;
      return this;
    }


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
    offset(count: number): Query<K, I> {
      this._offset = count;
      return this;
    }


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
    count(): Promise<number> {
      this._justCount = true;
      return <Promise<number>><any>this.get();
    }


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
    get(): Promise<I[]> {
      var countProp = 'COUNT(*)';
      var stmt = 'SELECT ';
      var model: ClassTemplate<K> = this._model;
      if(this._justCount) {
        stmt += countProp;
      } else {
        stmt += this._columns.join(', ');
      }
      stmt += ' FROM ' + this._tables.join(', ');
      var args: string[] = [];
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

      var objects: I[] = [];
      var query = this;
      return this._store.execRead(stmt, args, function (tx: SQLTransaction, results: SQLResultSet) {
        if(query._justCount) {
          return results.rows.item(0)[countProp];
        }
        for (var i = 0; i < results.rows.length; i++) {
          var o = constructFromDb<K, I>(model, results.rows.item(i));
          objects.push(o);
        }
        var setcols = Object.keys(model.columns)
        .filter(function(col: string): boolean {
          return (model.columns[col].type === ColumnType.set);
        });
        return Promise.all(objects.map(function(o: I) {
          return Promise.all(
            setcols.map(function(col: string): Promise<any> {
              var setTable = model.columns[col].setTable;
              console.assert(setTable != null);
              var key = o._primaryKey();
              var s = 'SELECT ' + col;
              s += ' FROM ' + setTable.tableName;
              s += ' WHERE ' + query._model.key + ' = ?';
              return query._store.exec(tx, s, [key], function(tx: SQLTransaction, results: SQLResultSet) {
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
    }
  }

}
