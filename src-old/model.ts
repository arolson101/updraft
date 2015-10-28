/// <reference path="./util.ts" />
/// <reference path="./store.ts" />
/// <reference path="./set.ts" />
/// <reference path="./query.ts" />

module Updraft {

  export interface RenamedColumnSet {
    [oldColumnName: string]: string;
  }


  /**
   * Describes the static members of a class used to create {@link Instance}s
   * @see {link @createClass}
   */
  export interface ClassTemplate<K> {
    tableName: string;
    recreate?: boolean;
    temp?: boolean;
    columns: ColumnSet;
    renamedColumns?: RenamedColumnSet;
    indices?: string[][];
    key?: string;
    keyType?: ColumnType;
    all?: Query<K, Instance<K>>;
    get(id: K): Promise<Instance<K>>;
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
  export class Instance<K> {
    _changeMask: number;
    _isInDb: boolean;
    _model: ClassTemplate<K>;
    _store: Store;

    constructor(props?: any) {
      var o = this;
      o._changeMask = 0;

      for (var key in this._model.columns) {
        var col: Column = this._model.columns[key];
        if('defaultValue' in col) {
          o['_' + key] = col.defaultValue;
        }
      }

      props = props || {};
      for (var key in props) {
        var value = props[key];
        if(value instanceof Instance) {
          value = (<Instance<K>>value)._primaryKey();
        }
        o[key] = value;
      }
    }


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
    _primaryKey(): K {
      var key = '_' + this._model.key;
      console.assert(key in this);
      return this[key];
    }



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
    _changes(): string[] {
      var changes: string[] = [];
      var propIdx = 0;
      for (var col in this._model.columns) {
        var propMask = (1 << propIdx++);
        if (this._changeMask & propMask) {
          changes.push(col);
        }
      }
      return changes;
    }


    /**
     * Set state to be have no changes
     * @private
     */
    _clearChanges() {
      this._changeMask = 0;
      for (var col in this._model.columns) {
        if(col in this
          && typeof this[col] !== 'undefined'
          && typeof this[col]['clearChanges'] === 'function') {
          this[col].clearChanges();
        }
      }
    }
  }


  interface Wrapper<I extends Instance<any>> {
    ref: ClassTemplate<I>;
    own: I;
    get: () => Promise<I>;
  }


  /**
   * Add a get/set property to the class
   *
   * @param model - class template
   * @param proto - function prototype
   * @param col - the column/field to set the property on
   * @param propMask - the bits to set on <tt>_changes</tt>
   * @private
   */
  function addClassProperty<K>(model: ClassTemplate<K>, proto: any, col: string, propMask: number) {
    var prop = '_' + col;

    switch(model.columns[col].type) {
      default:
        Object.defineProperty(proto, col, {
          configurable: true,
          get: function () {
            return (<Instance<K>>this)[prop];
          },
          set: function (val) {
            if ((<Instance<K>>this)[prop] !== val) {
              (<Instance<K>>this)[prop] = val;
              (<Instance<K>>this)._changeMask |= propMask;
            }
          }
        });
        break;

      case ColumnType.ptr:
        Object.defineProperty(proto, col, {
          configurable: true,
          get: function () {
            var ref: ClassTemplate<any> = (<Instance<any>>this)._model.columns[col].ref;
            console.assert(ref.get != null);
            var ret: Wrapper<Instance<K>> = {
              ref: ref,
              own: (<Instance<K>>this),
              get: function () { return (<Wrapper<K>>this).ref.get(this.own[prop]); }
            };
            ret[ref.key] = (<Instance<K>>this)[prop];
            return ret;
          },
          set: function (val) {
            // allow client to do object.field = otherobject; we'll transform it to object.field = otherobject._primaryKey()
            val = keyOf(val);
            if ((<Instance<K>>this)[prop] !== val) {
              (<Instance<K>>this)[prop] = val;
              (<Instance<K>>this)._changeMask |= propMask;
            }
          }
        });
        break;

      case ColumnType.set:
        Object.defineProperty(proto, col, {
          configurable: true,
          get: function() {
            if(!(prop in (<Instance<K>>this))) {
              var o: Instance<K> = this;
              o[prop] = new Set(function() { o._changeMask |= propMask; });
            }
            return (<Instance<K>>this)[prop];
          },
          set: function(val) {
            if(!(prop in (<Instance<K>>this))) {
              var o: Instance<K> = this;
              o[prop] = new Set(function() { o._changeMask |= propMask; });
            }
            (<Instance<K>>this)[prop].assign(val);
            (<Instance<K>>this)._changeMask |= propMask;
          }
        });
        break;
    }
  }



  /**
   * Add properties to a provided {@link Instance} subclass that can be created, saved and retrieved from the db
   * @private
   */
  export function MakeClassTemplate<K>(templ: ClassTemplate<K>, store: Store) {
    console.assert(store != null);
    console.assert(templ != null);
    console.assert(templ.tableName != null);
    console.assert(templ.tableName[0] !== '_');
    console.assert(templ.columns != null);
    console.assert(Object.keys(templ.columns).length < 64);
    console.assert(!('changes' in templ.columns));
    console.assert(!('template' in templ.columns));
    console.assert(!templ.renamedColumns || Object.keys(templ.renamedColumns).every(function (old) { return !(old in templ.columns); }));

    // instance properties
    var proto = (<any>templ).prototype;
    Object.defineProperty(proto, '_model', { configurable: true, enumerable: true, value: templ });
    Object.defineProperty(proto, '_store', { configurable: true, enumerable: true, value: store });

    // class static methods/properties
    templ.get = function (id: K): Promise<Instance<K>> {
      return this.all.where(this.key, '=', id).get()
      .then(function(results: Instance<K>[]) {
        console.assert(results.length < 2);
        if(results.length === 0) {
          return null;
        } else {
          return results[0];
        }
      });
    }

    Object.defineProperty(templ, 'all', {
      configurable: true,
      get: function() {
        return new Query(this, store);
      }
    });

    templ.indices = templ.indices || [];

    var key: string = null;
    var keyType: ColumnType = null;

    var propIdx = 0;
    for(var col in templ.columns) {
      if (templ.columns[col].isKey) {
        key = col;
        keyType = templ.columns[col].type;
      }
      if (templ.columns[col].isIndex) {
        templ.indices.push([col]);
      }

      var propMask = (1 << propIdx++);
      addClassProperty(templ, proto, col, propMask);
      if (propIdx >= 63) {
        throw new Error("class has too many columns- max 63");
      }
    }

    console.assert(key != null);

    templ.key = key;
    templ.keyType = keyType;
  }



  /**
   * construct object from a database result row
   *
   * @return Instance with fields initialized according to row, with _isInDb=true and no changes set
   * @private
   */
  export function constructFromDb<K, I extends Instance<any>>(model: ClassTemplate<K>, row: Object): I {
    var o: I = new (<any>model)();
    console.assert(o instanceof Instance);
    for(var col in row) {
      var val = row[col];
      var _col = '_' + col;
      // TODO: refactor this into column class
      switch(model.columns[col].type) {
        case ColumnType.json:
          o[_col] = JSON.parse(val);
          break;
        case ColumnType.date:
        case ColumnType.datetime:
          o[_col] = new Date(val * 1000);
          break;
        case ColumnType.enum:
          var enumClass = o._model.columns[col].enum;
          console.assert(enumClass != null);
          if(typeof enumClass === 'object' && typeof (<EnumClass>enumClass).get == 'function') {
            o[_col] = (<EnumClass>enumClass).get(val);
          } else {
            console.assert(val in enumClass);
            o[_col] = enumClass[val];
          }
          break;
        case ColumnType.set:
          o[_col].push(val);
          break;
        default:
          o[_col] = val;
          break;
      }
    }

    o._isInDb = true;
    console.assert(o._changeMask === 0);
    return o;
  }

}
