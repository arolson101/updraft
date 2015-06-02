var Updraft;
(function (Updraft) {
    /**
     * @private
     */
    function startsWith(str, val) {
        return str.lastIndexOf(val, 0) === 0;
    }
    Updraft.startsWith = startsWith;
    /**
     * @private
     */
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
        // Handle complicated (read: enum) objects
        if (obj instanceof Object && obj.constructor.name !== "Object") {
            return obj;
        }
        // Handle simple Objects
        if (obj instanceof Object && obj.constructor.name === "Object") {
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
    Updraft.clone = clone;
    /**
     * @private
     */
    function keyOf(obj) {
        if (obj instanceof Updraft.Instance) {
            return obj._primaryKey();
        }
        if (typeof (obj) === 'object' && typeof (obj.toString) === 'function') {
            return obj.toString();
        }
        return obj;
    }
    Updraft.keyOf = keyOf;
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
    function createClass(proto, descriptor) {
        console.assert(typeof proto === 'function');
        console.assert(typeof descriptor === 'object');
        proto.prototype = Object.create(Updraft.Instance.prototype);
        proto.prototype.constructor = proto;
        for (var key in descriptor) {
            var value = descriptor[key];
            if (typeof value === 'function') {
                proto.prototype[key] = value;
            }
            else {
                proto[key] = descriptor[key];
            }
        }
        return proto;
    }
    Updraft.createClass = createClass;
})(Updraft || (Updraft = {}));
/// <reference path="./websql.d.ts" />
var Updraft;
(function (Updraft) {
    /**
     * State that a value can be in
     * @private
     * @enum
     */
    var State;
    (function (State) {
        State[State["saved"] = 2] = "saved";
        State[State["added"] = 4] = "added";
        State[State["removed"] = 8] = "removed";
    })(State || (State = {}));
    var Set = (function () {
        /**
         * @param dirtyFcn - function to call when set's state changes
         */
        function Set(dirtyFcn) {
            this._dirtyFcn = dirtyFcn;
            this._states = {};
        }
        /**
         * load values from a database; initialize values
         * @private
         * @param results - database row
         */
        Set.prototype.initFromDb = function (results) {
            for (var i = 0; i < results.rows.length; i++) {
                var row = results.rows.item(i);
                console.assert(Object.keys(row).length === 1);
                var item = row[Object.keys(row)[0]];
                this._states[item] = State.saved;
            }
        };
        /**
         * Set all values from an array.  <tt>Add</tt>s all values, and <tt>remove</tt>s any existing set values that are
         * not in <tt>arr</tt>
         * @param objects - array of values to assign.  If values are {@link Instance}s, assign their <tt>_primaryKey()</tt>s instead
         */
        Set.prototype.assign = function (objects) {
            this.clear();
            this.add.apply(this, objects);
        };
        /**
         * Removes all objects from set
         */
        Set.prototype.clear = function () {
            for (var val in this._states) {
                this._states[val] = State.removed;
            }
        };
        /**
         * Adds value(s) to set
         * @param objects - array of values to assign.  If values are {@link Instance}s, assign their <tt>_primaryKey()</tt>s instead
         */
        Set.prototype.add = function () {
            var objects = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                objects[_i - 0] = arguments[_i];
            }
            var dirty = false;
            var self = this;
            objects
                .map(Updraft.keyOf)
                .forEach(function (arg) {
                console.assert(typeof (arg) !== 'object');
                if (self._states[arg] !== State.saved) {
                    self._states[arg] = State.added;
                    dirty = true;
                }
            });
            if (dirty) {
                this._dirtyFcn();
            }
        };
        /**
         * Alias for {@link add}
         * @param objects - values to add
         */
        Set.prototype.push = function () {
            var objects = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                objects[_i - 0] = arguments[_i];
            }
            return this.add.apply(this, objects);
        };
        /**
         * Removes value(s) from set
         * @param objects - values to remove
         */
        Set.prototype.remove = function () {
            var objects = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                objects[_i - 0] = arguments[_i];
            }
            var dirty = false;
            var self = this;
            objects
                .map(Updraft.keyOf)
                .forEach(function (arg) {
                self._states[arg] = State.removed;
                dirty = true;
            });
            if (dirty) {
                this._dirtyFcn();
            }
        };
        /**
         * Gets values from set which match the given <tt>stateMask</tt>
         * @param stateMask - states of objects to return
         * @return values that match <tt>stateMask</tt>
         * @private
         */
        Set.prototype.which = function (stateMask) {
            var self = this;
            return Object.keys(this._states)
                .filter(function (element, index, array) {
                return (self._states[element] & stateMask) ? true : false;
            });
        };
        /**
         * Gets valid (added or saved) values of the set
         */
        Set.prototype.values = function () {
            return this.which(State.saved | State.added);
        };
        /**
         * Gets the values that have been added to the set since it was last saved
         */
        Set.prototype.getAdded = function () {
            return this.which(State.added);
        };
        /**
         * Gets the values that have been removed from the set since it was last saved
         */
        Set.prototype.getRemoved = function () {
            return this.which(State.removed);
        };
        /**
         * Marks the values in the set as saved.  Any objects marked 'remove' will be
         * expunged from the set.
         */
        Set.prototype.clearChanges = function () {
            var newValues = {};
            for (var val in this._states) {
                if (this._states[val] !== State.removed) {
                    newValues[val] = State.saved;
                }
            }
            this._states = newValues;
        };
        return Set;
    })();
    Updraft.Set = Set;
})(Updraft || (Updraft = {}));
/// <reference path="../typings/tsd.d.ts" />
/// <reference path="./store.ts" />
var Updraft;
(function (Updraft) {
    /**
     * Do not construct objects of type Query directly- instead, use {@link ClassTemplate}.all
     * @constructor
     */
    var Query = (function () {
        function Query(model, store) {
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
            for (var col in model.columns) {
                if (model.columns[col].type !== Updraft.ColumnType.set) {
                    this._columns.push(model.tableName + '.' + col);
                }
            }
        }
        Query.prototype.all = function () {
            return this.get();
        };
        Query.prototype.addCondition = function (conj, col, op, val) {
            var fields = col.split(/\./);
            var field;
            var f = this._model;
            val = Updraft.keyOf(val);
            for (var i = 0; i < fields.length - 1; i++) {
                field = fields[i];
                console.assert(field in f.columns);
                var ref = f.columns[field].ref;
                console.assert(ref != null);
                if (this._tables.indexOf(ref.tableName) === -1) {
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
            switch (op) {
                case 'contains':
                    console.assert(f.columns[field].type === Updraft.ColumnType.set);
                    var setTable = f.columns[field].setTable;
                    console.assert(setTable != null);
                    if (this._tables.indexOf(setTable.tableName) === -1) {
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
                    console.assert(f.columns[field].type !== Updraft.ColumnType.set);
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
        Query.prototype.and = function (col, op, val) {
            return this.addCondition('AND', col, op, val);
        };
        /**
         * alias for {@link and}
         *
         * @example
         * ```
         *
         *  return Class.all.where('col2', '>', 10).get();
         * ```
         */
        Query.prototype.where = function () {
            return this.and.apply(this, arguments);
        };
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
        Query.prototype.or = function (col, op, val) {
            return this.addCondition('OR', col, op, val);
        };
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
        Query.prototype.order = function (col, asc) {
            this._order = this._model.tableName + '.' + col;
            if (typeof asc !== 'undefined') {
                this._asc = asc;
            }
            return this;
        };
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
        Query.prototype.nocase = function () {
            this._nocase = true;
            return this;
        };
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
        Query.prototype.limit = function (count) {
            this._limit = count;
            return this;
        };
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
        Query.prototype.offset = function (count) {
            this._offset = count;
            return this;
        };
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
        Query.prototype.count = function () {
            this._justCount = true;
            return this.get();
        };
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
        Query.prototype.get = function () {
            var countProp = 'COUNT(*)';
            var stmt = 'SELECT ';
            var model = this._model;
            if (this._justCount) {
                stmt += countProp;
            }
            else {
                stmt += this._columns.join(', ');
            }
            stmt += ' FROM ' + this._tables.join(', ');
            var args = [];
            for (var i = 0; i < this._conditions.length; i++) {
                var cond = this._conditions[i];
                stmt += (i === 0) ? ' WHERE ' : (' ' + cond.conj + ' ');
                stmt += cond.col + ' ' + cond.op + ' ' + cond.val;
                if ('arg' in cond) {
                    args.push(cond.arg);
                }
            }
            if (this._order) {
                stmt += ' ORDER BY ' + this._order;
                stmt += (this._nocase ? ' COLLATE NOCASE' : '');
                stmt += (this._asc ? ' ASC' : ' DESC');
            }
            console.assert(!this._offset || this._limit);
            if (this._limit) {
                stmt += ' LIMIT ' + this._limit;
                if (this._offset) {
                    stmt += ' OFFSET ' + this._offset;
                }
            }
            var objects = [];
            var query = this;
            return this._store.execRead(stmt, args, function (tx, results) {
                if (query._justCount) {
                    return results.rows.item(0)[countProp];
                }
                for (var i = 0; i < results.rows.length; i++) {
                    var o = Updraft.constructFromDb(model, results.rows.item(i));
                    objects.push(o);
                }
                var setcols = Object.keys(model.columns)
                    .filter(function (col) {
                    return (model.columns[col].type === Updraft.ColumnType.set);
                });
                return Promise.all(objects.map(function (o) {
                    return Promise.all(setcols.map(function (col) {
                        var setTable = model.columns[col].setTable;
                        console.assert(setTable != null);
                        var key = o._primaryKey();
                        var s = 'SELECT ' + col;
                        s += ' FROM ' + setTable.tableName;
                        s += ' WHERE ' + query._model.key + ' = ?';
                        return query._store.exec(tx, s, [key], function (tx, results) {
                            if (results.rows.length > 0) {
                                o[col].initFromDb(results);
                            }
                        });
                    }));
                }))
                    .then(function () {
                    return objects;
                });
            });
        };
        return Query;
    })();
    Updraft.Query = Query;
})(Updraft || (Updraft = {}));
/// <reference path="./util.ts" />
/// <reference path="./store.ts" />
/// <reference path="./set.ts" />
/// <reference path="./query.ts" />
var Updraft;
(function (Updraft) {
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
    var Instance = (function () {
        function Instance(props) {
            var o = this;
            o._changeMask = 0;
            for (var key in this._model.columns) {
                var col = this._model.columns[key];
                if ('defaultValue' in col) {
                    o['_' + key] = col.defaultValue;
                }
            }
            props = props || {};
            for (var key in props) {
                var value = props[key];
                if (value instanceof Instance) {
                    value = value._primaryKey();
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
        Instance.prototype._primaryKey = function () {
            var key = '_' + this._model.key;
            console.assert(key in this);
            return this[key];
        };
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
        Instance.prototype._changes = function () {
            var changes = [];
            var propIdx = 0;
            for (var col in this._model.columns) {
                var propMask = (1 << propIdx++);
                if (this._changeMask & propMask) {
                    changes.push(col);
                }
            }
            return changes;
        };
        /**
         * Set state to be have no changes
         * @private
         */
        Instance.prototype._clearChanges = function () {
            this._changeMask = 0;
            for (var col in this._model.columns) {
                if (col in this
                    && typeof this[col] !== 'undefined'
                    && typeof this[col]['clearChanges'] === 'function') {
                    this[col].clearChanges();
                }
            }
        };
        return Instance;
    })();
    Updraft.Instance = Instance;
    /**
     * Add a get/set property to the class
     *
     * @param model - class template
     * @param proto - function prototype
     * @param col - the column/field to set the property on
     * @param propMask - the bits to set on <tt>_changes</tt>
     * @private
     */
    function addClassProperty(model, proto, col, propMask) {
        var prop = '_' + col;
        switch (model.columns[col].type) {
            default:
                Object.defineProperty(proto, col, {
                    configurable: true,
                    get: function () {
                        return this[prop];
                    },
                    set: function (val) {
                        if (this[prop] !== val) {
                            this[prop] = val;
                            this._changeMask |= propMask;
                        }
                    }
                });
                break;
            case Updraft.ColumnType.ptr:
                Object.defineProperty(proto, col, {
                    configurable: true,
                    get: function () {
                        var ref = this._model.columns[col].ref;
                        console.assert(ref.get != null);
                        var ret = {
                            ref: ref,
                            own: this,
                            get: function () { return this.ref.get(this.own[prop]); }
                        };
                        ret[ref.key] = this[prop];
                        return ret;
                    },
                    set: function (val) {
                        // allow client to do object.field = otherobject; we'll transform it to object.field = otherobject._primaryKey()
                        val = Updraft.keyOf(val);
                        if (this[prop] !== val) {
                            this[prop] = val;
                            this._changeMask |= propMask;
                        }
                    }
                });
                break;
            case Updraft.ColumnType.set:
                Object.defineProperty(proto, col, {
                    configurable: true,
                    get: function () {
                        if (!(prop in this)) {
                            var o = this;
                            o[prop] = new Updraft.Set(function () { o._changeMask |= propMask; });
                        }
                        return this[prop];
                    },
                    set: function (val) {
                        if (!(prop in this)) {
                            var o = this;
                            o[prop] = new Updraft.Set(function () { o._changeMask |= propMask; });
                        }
                        this[prop].assign(val);
                        this._changeMask |= propMask;
                    }
                });
                break;
        }
    }
    /**
     * Add properties to a provided {@link Instance} subclass that can be created, saved and retrieved from the db
     * @private
     */
    function MakeClassTemplate(templ, store) {
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
        var proto = templ.prototype;
        Object.defineProperty(proto, '_model', { configurable: true, enumerable: true, value: templ });
        Object.defineProperty(proto, '_store', { configurable: true, enumerable: true, value: store });
        // class static methods/properties
        templ.get = function (id) {
            return this.all.where(this.key, '=', id).get()
                .then(function (results) {
                console.assert(results.length < 2);
                if (results.length === 0) {
                    return null;
                }
                else {
                    return results[0];
                }
            });
        };
        Object.defineProperty(templ, 'all', {
            configurable: true,
            get: function () {
                return new Updraft.Query(this, store);
            }
        });
        templ.indices = templ.indices || [];
        var key = null;
        var keyType = null;
        var propIdx = 0;
        for (var col in templ.columns) {
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
    Updraft.MakeClassTemplate = MakeClassTemplate;
    /**
     * construct object from a database result row
     *
     * @return Instance with fields initialized according to row, with _isInDb=true and no changes set
     * @private
     */
    function constructFromDb(model, row) {
        var o = new model();
        console.assert(o instanceof Instance);
        for (var col in row) {
            var val = row[col];
            var _col = '_' + col;
            // TODO: refactor this into column class
            switch (model.columns[col].type) {
                case Updraft.ColumnType.json:
                    o[_col] = JSON.parse(val);
                    break;
                case Updraft.ColumnType.date:
                case Updraft.ColumnType.datetime:
                    o[_col] = new Date(val * 1000);
                    break;
                case Updraft.ColumnType.enum:
                    var enumClass = o._model.columns[col].enum;
                    console.assert(enumClass != null);
                    if (typeof enumClass === 'object' && typeof enumClass.get == 'function') {
                        o[_col] = enumClass.get(val);
                    }
                    else {
                        console.assert(val in enumClass);
                        o[_col] = enumClass[val];
                    }
                    break;
                case Updraft.ColumnType.set:
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
    Updraft.constructFromDb = constructFromDb;
})(Updraft || (Updraft = {}));
/// <reference path="../typings/tsd.d.ts" />
/// <reference path="./util.ts" />
/// <reference path="./model.ts" />
/// <reference path="./websql.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Updraft;
(function (Updraft) {
    /**
     * Column types.  Note that these are just column affinities, and technically any value type can be stored in any column type.
     * see {@link https://www.sqlite.org/datatype3.html}
     */
    (function (ColumnType) {
        ColumnType[ColumnType["int"] = 0] = "int";
        ColumnType[ColumnType["real"] = 1] = "real";
        ColumnType[ColumnType["bool"] = 2] = "bool";
        ColumnType[ColumnType["text"] = 3] = "text";
        ColumnType[ColumnType["blob"] = 4] = "blob";
        ColumnType[ColumnType["enum"] = 5] = "enum";
        ColumnType[ColumnType["date"] = 6] = "date";
        ColumnType[ColumnType["datetime"] = 7] = "datetime";
        ColumnType[ColumnType["json"] = 8] = "json";
        ColumnType[ColumnType["ptr"] = 9] = "ptr";
        ColumnType[ColumnType["set"] = 10] = "set";
    })(Updraft.ColumnType || (Updraft.ColumnType = {}));
    var ColumnType = Updraft.ColumnType;
    /**
     * Column in db.  Use static methods to create columns.
     */
    var Column = (function () {
        function Column(type) {
            this.type = type;
        }
        /**
         * Column is the primary key.  Only one column can have this set.
         */
        Column.prototype.Key = function (value) {
            if (value === void 0) { value = true; }
            this.isKey = value;
            return this;
        };
        /**
         * Create an index for this column for faster queries.
         */
        Column.prototype.Index = function (value) {
            if (value === void 0) { value = true; }
            this.isIndex = value;
            return this;
        };
        /**
         * Set a default value for the column
         */
        // TODO
        Column.prototype.Default = function (value) {
            this.defaultValue = value;
            return this;
        };
        /** create a column with 'INTEGER' affinity */
        Column.Int = function () {
            return new Column(ColumnType.int);
        };
        /** create a column with 'REAL' affinity */
        Column.Real = function () {
            return new Column(ColumnType.real);
        };
        /** create a column with 'BOOL' affinity */
        Column.Bool = function () {
            return new Column(ColumnType.bool);
        };
        /** create a column with 'TEXT' affinity */
        Column.Text = function () {
            return new Column(ColumnType.text);
        };
        /** create a column with 'TEXT' affinity */
        Column.String = function () {
            return new Column(ColumnType.text);
        };
        /** create a column with 'BLOB' affinity */
        Column.Blob = function () {
            var c = new Column(ColumnType.blob);
            return c;
        };
        /** a javascript object with instance method 'toString' and class method 'get' (e.g. {@link https://github.com/adrai/enum}). */
        Column.Enum = function (enum_) {
            var c = new Column(ColumnType.enum);
            c.enum = enum_;
            return c;
        };
        /** a javascript Date objct, stored in db as seconds since Unix epoch (time_t) [note: precision is seconds] */
        Column.Date = function () {
            return new Column(ColumnType.date);
        };
        /** a javascript Date objct, stored in db as seconds since Unix epoch (time_t) [note: precision is seconds] */
        Column.DateTime = function () {
            return new Column(ColumnType.datetime);
        };
        /** object will be serialized & restored as JSON text */
        Column.JSON = function () {
            return new Column(ColumnType.json);
        };
        /** points to an object in another table.  Its affinity will automatically be that table's key's affinity */
        Column.Ptr = function (ref) {
            var c = new Column(ColumnType.ptr);
            c.ref = ref;
            return c;
        };
        /** unordered collection */
        Column.Set = function (ref /*| ColumnType*/) {
            var c = new Column(ColumnType.set);
            c.ref = ref;
            return c;
        };
        Column.sql = function (val) {
            var stmt = "";
            switch (val.type) {
                case ColumnType.int:
                    stmt = 'INTEGER';
                    break;
                case ColumnType.bool:
                    stmt = 'BOOL';
                    break;
                case ColumnType.real:
                    stmt = 'REAL';
                    break;
                case ColumnType.text:
                case ColumnType.json:
                case ColumnType.enum:
                    stmt = 'TEXT';
                    break;
                case ColumnType.blob:
                    stmt = 'BLOB';
                    break;
                case ColumnType.date:
                    stmt = 'DATE';
                    break;
                case ColumnType.datetime:
                    stmt = 'DATETIME';
                    break;
                default:
                    throw new Error("unsupported type");
            }
            if ('defaultValue' in val) {
                stmt += ' DEFAULT ' + val.defaultValue;
            }
            return stmt;
        };
        return Column;
    })();
    Updraft.Column = Column;
    /**
     * The parameters used to open a database
     *
     * @property name - the name of the database to open
     */
    var StoreOptions = (function () {
        function StoreOptions() {
        }
        return StoreOptions;
    })();
    Updraft.StoreOptions = StoreOptions;
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
    var Schema = (function () {
        function Schema() {
        }
        return Schema;
    })();
    Updraft.Schema = Schema;
    /**
     * @private
     */
    var SchemaTable = (function () {
        function SchemaTable() {
        }
        return SchemaTable;
    })();
    Updraft.SchemaTable = SchemaTable;
    /**
     * Internal class used in key/value storage
     * @private
     */
    var KeyValue = (function (_super) {
        __extends(KeyValue, _super);
        function KeyValue(props) {
            _super.call(this, props);
        }
        KeyValue.get = function (id) { return null; };
        KeyValue.tableName = 'updraft_kv';
        KeyValue.columns = {
            key: Column.String().Key(),
            value: Column.String(),
        };
        return KeyValue;
    })(Updraft.Instance);
    /**
     * @private
     */
    function anyFcn(tx, results) { }
    /**
     * Interface for creating classes & database interaction
     */
    var Store = (function () {
        function Store() {
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
        Store.prototype.addClass = function (templ) {
            Updraft.MakeClassTemplate(templ, this);
            this.tables.push(templ);
        };
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
        Store.prototype.set = function (key, value) {
            this.kv[key] = value;
            var pair = new KeyValue({ key: key, value: JSON.stringify(value) });
            return this.save(pair);
        };
        /**
         * gets a key/value pair.  Values are cached on the <tt>Store</tt> so they are immediately available
         *
         * @param key
         * @return value
         */
        Store.prototype.get = function (key) {
            return this.kv[key];
        };
        /**
         * read the key/value pairs from the database, caching them on the <tt>Store</tt>
         * @private
         */
        Store.prototype.loadKeyValues = function () {
            var self = this;
            return KeyValue.all.get().then(function (vals) {
                for (var i = 0; i < vals.length; i++) {
                    var val = vals[i];
                    self.kv[val.key] = JSON.parse(val.value);
                }
            });
        };
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
        Store.prototype.purge = function (opts) {
            console.assert(!this.db);
            this.db = window.openDatabase(opts.name, '1.0', 'updraft created database', 5 * 1024 * 1024);
            console.assert(this.db != null);
            var self = this;
            console.assert(this instanceof Store);
            return self.readSchema()
                .then(function (schema) {
                return new Promise(function (fulfill, reject) {
                    self.db.transaction(function (tx) {
                        var promises = [];
                        Object.keys(schema).forEach(function (table) {
                            promises.push(self.exec(tx, 'DROP TABLE ' + table));
                        });
                        return Promise.all(promises)
                            .then(function () {
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
        Store.prototype.open = function (opts) {
            this.db = window.openDatabase(opts.name, '1.0', 'updraft created database', 5 * 1024 * 1024);
            console.assert(this.db != null);
            // add tables for 'set' columns
            var setTables = [];
            for (var i = 0; i < this.tables.length; i++) {
                var table = this.tables[i];
                for (var col in table.columns) {
                    if (table.columns[col].type === ColumnType.set) {
                        var ref = table.columns[col].ref;
                        console.assert(ref != null);
                        var setTable = {
                            tableName: table.tableName + '_' + col,
                            recreate: table.recreate,
                            temp: table.temp,
                            key: '',
                            keyType: table.keyType,
                            columns: {},
                            indices: [[table.key], [col]],
                            get: function (id) { throw new Error("not callable"); }
                        };
                        setTable.columns[table.key] = new Column(table.keyType),
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
        };
        /**
         * close the database
         */
        Store.prototype.close = function () {
            this.db = null;
            this.constructor();
        };
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
        Store.prototype.exec = function (tx, stmt, args, callback) {
            if (callback === void 0) { callback = anyFcn; }
            if (this.logSql) {
                console.log(stmt, args);
            }
            var self = this;
            return new Promise(function (fulfill, reject) {
                try {
                    tx.executeSql(stmt, args, function (tx, results) {
                        var ret = callback ? callback(tx, results) : null;
                        return Promise.resolve(ret).then(fulfill, reject);
                    }, function (tx, error) {
                        self.reportError(error);
                        reject(error);
                        return false;
                    });
                }
                catch (reason) {
                    console.log('Failed to exec "' + stmt + '":' + reason);
                    throw reason;
                }
            });
        };
        /**
         * exec a sql statement within a new read transaction
         *
         * @param stmt - sql statement to execute
         * @param args - array of strings to substitute into <tt>stmt</tt>
         * @param callback - callback with parameters (transaction, [SQLResultSet]{@link http://www.w3.org/TR/webdatabase/#sqlresultset})
         * @return a promise that resolves with (transaction, return value of the callback)
         * @private
         */
        Store.prototype.execRead = function (stmt, args, callback) {
            var self = this;
            console.assert(self.db != null);
            return new Promise(function (fulfill, reject) {
                self.db.readTransaction(function (rtx) {
                    return self.exec(rtx, stmt, args, callback)
                        .then(fulfill, reject);
                });
            });
        };
        Store.prototype.reportError = function (error) {
            switch (error.code) {
                case error.SYNTAX_ERR:
                    console.log("Syntax error: " + error.message);
                    break;
                default:
                    console.log(error);
            }
        };
        /**
         * get the existing database's schema in object form
         *
         * @return a promise that resolves with the {@link Schema}
         */
        Store.prototype.readSchema = function () {
            function tableFromSql(sql) {
                var table = { _indices: {}, _triggers: {} };
                var matches = sql.match(/\((.*)\)/);
                if (matches) {
                    var fields = matches[1].split(',');
                    for (var i = 0; i < fields.length; i++) {
                        var ignore = /^\s*(primary|foreign)\s+key/i; // ignore standalone 'PRIMARY KEY xxx'
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
                var schema = {};
                for (var i = 0; i < results.rows.length; i++) {
                    var row = results.rows.item(i);
                    if (row.name[0] != '_' && !Updraft.startsWith(row.name, 'sqlite')) {
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
         * @param schema
         * @return A promise that resolves with no parameters once all tables are up-to-date.
         * @private
         */
        Store.prototype.syncTables = function (schema) {
            var self = this;
            console.assert(self.db != null);
            return new Promise(function (fulfill, reject) {
                self.db.transaction(function (tx) {
                    return Promise.all(self.tables.map(function (f) { return self.syncTable(tx, schema, f); }))
                        .then(fulfill, reject);
                });
            });
        };
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
        Store.prototype.syncTable = function (tx, schema, f) {
            var self = this;
            // execute CREATE TABLE statement
            function createTable(name) {
                var cols = [];
                for (var col in f.columns) {
                    var attrs = f.columns[col];
                    var decl;
                    switch (attrs.type) {
                        case ColumnType.ptr:
                            console.assert(attrs.ref != null);
                            console.assert(attrs.ref.columns != null);
                            console.assert(attrs.ref.tableName != null);
                            console.assert(attrs.ref.key != null);
                            var foreignCol = attrs.ref.columns[attrs.ref.key];
                            decl = col + ' ' + Column.sql(foreignCol);
                            cols.push(decl);
                            break;
                        case ColumnType.set:
                            break;
                        default:
                            decl = col + ' ' + Column.sql(attrs);
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
                if (force === void 0) { force = false; }
                var promises = [];
                var toRemove = (f.tableName in schema) ? Updraft.clone(schema[f.tableName]._indices) : {};
                f.indices.forEach(function (index) {
                    var name = 'index_' + f.tableName + '__' + index.join('_');
                    var sql = 'CREATE INDEX ' + name + ' ON ' + f.tableName + ' (' + index.join(', ') + ')';
                    delete toRemove[name];
                    var create = true;
                    var drop = false;
                    if (schema[f.tableName] && schema[f.tableName]._indices && schema[f.tableName]._indices[name]) {
                        if (schema[f.tableName]._indices[name] === sql) {
                            create = false;
                        }
                        else {
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
                Object.keys(toRemove).forEach(function (name) {
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
                }
                else {
                    //console.log("table " + f.tableName + " exists; checking columns");
                    var columns = Updraft.clone(schema[f.tableName]);
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
                    var renamedColumns = Updraft.clone(f.renamedColumns) || {};
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
                            if (oldTableColumns.length && newTableColumns.length) {
                                var stmt = "INSERT INTO " + newName + " (" + newTableColumns.join(", ") + ") ";
                                stmt += "SELECT " + oldTableColumns.join(", ") + " FROM " + oldName + ";";
                                return self.exec(tx, stmt);
                            }
                        };
                        var renameTable = function (oldName, newName) {
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
                    }
                    else if (addedColumns.length > 0) {
                        // alter table, add columns
                        var promises = [];
                        addedColumns.forEach(function (columnName) {
                            var attrs = f.columns[columnName];
                            var columnDecl = columnName + ' ' + Column.sql(attrs);
                            promises.push(self.exec(tx, 'ALTER TABLE ' + f.tableName + ' ADD COLUMN ' + columnDecl));
                        });
                        promises.push(createIndices());
                        return Promise.all(promises);
                    }
                    else {
                        // no table modification is required
                        return createIndices();
                    }
                }
            }
            else {
                //console.log('creating table: ' + f.tableName);
                return Promise.all([
                    createTable(f.tableName),
                    createIndices(true)
                ]);
            }
        };
        /**
         * Save all objects to database.  Atomic operation- all objects will be saved within the same transaction
         * or nothing will be written.  Objects can be heterogeneous.
         *
         * @param objects - objects to save
         */
        Store.prototype.save = function () {
            var objects = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                objects[_i - 0] = arguments[_i];
            }
            objects = Array.prototype.concat.apply([], objects); // flatten array
            objects.map(function (o) {
                console.assert(('_' + o._model.key) in o, "object must have a key");
            });
            var self = this;
            return new Promise(function (resolve, reject) {
                self.db.transaction(function (tx) {
                    function value(o, col) {
                        var val = o['_' + col];
                        switch (o._model.columns[col].type) {
                            case ColumnType.date:
                            case ColumnType.datetime:
                                if (typeof val !== 'undefined') {
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
                    function insertSets(o, force) {
                        var changes = o._changes();
                        var f = o._model;
                        var promises = [];
                        Object.keys(f.columns)
                            .filter(function (col) {
                            return (f.columns[col].type === ColumnType.set) && (force || changes.indexOf(col) > -1);
                        })
                            .forEach(function (col) {
                            var ref = f.columns[col].ref;
                            var setTable = f.columns[col].setTable;
                            console.assert(ref != null);
                            console.assert(setTable != null);
                            var set = o['_' + col];
                            if (set) {
                                var key = o._primaryKey();
                                var deletions = set.getRemoved();
                                var additions = set.getAdded();
                                deletions.forEach(function (del) {
                                    promises.push(self.exec(tx, 'DELETE FROM ' + setTable.tableName + ' WHERE ' + f.key + '=? AND ' + col + '=?', [key, del]));
                                });
                                additions.forEach(function (add) {
                                    promises.push(self.exec(tx, 'INSERT INTO ' + setTable.tableName + ' (' + f.key + ', ' + col + ') VALUES (?, ?)', [key, add]));
                                });
                            }
                        });
                        return Promise.all(promises).then(function () { return true; });
                    }
                    function insert(o, callback) {
                        if (callback === void 0) { callback = null; }
                        var f = o._model;
                        var isNotSet = function (col) { return f.columns[col].type !== ColumnType.set; };
                        var cols = Object.keys(f.columns).filter(isNotSet);
                        var columns = cols.join(', ');
                        var values = cols.map(function () { return '?'; }).join(', ');
                        var args = cols.map(function (col) { return value(o, col); });
                        return self.exec(tx, 'INSERT OR IGNORE INTO ' + f.tableName + ' (' + columns + ') VALUES (' + values + ')', args, function (tx, results) {
                            var changes = results.rowsAffected !== 0;
                            return callback ? callback(changes) : changes;
                        });
                    }
                    function update(o, callback) {
                        if (callback === void 0) { callback = null; }
                        var f = o._model;
                        var cols = o._changes();
                        var isNotSet = function (col) { return f.columns[col].type !== ColumnType.set; };
                        var isNotKey = function (col) { return col !== f.key; };
                        var assignments = cols
                            .filter(isNotSet)
                            .filter(isNotKey)
                            .map(function (col) { return col + '=?'; })
                            .join(', ');
                        var values = cols
                            .filter(isNotSet)
                            .filter(isNotKey)
                            .map(function (col) { return value(o, col); });
                        values.push(o['_' + f.key]); // for WHERE clause
                        return self.exec(tx, 'UPDATE OR IGNORE ' + f.tableName + ' SET ' + assignments + ' WHERE ' + f.key + '=?', values, function (tx, results) {
                            var changes = results.rowsAffected !== 0;
                            return callback ? callback(changes) : changes;
                        });
                    }
                    var upsert = function (o) {
                        var p;
                        if (o._isInDb) {
                            p = update(o, function (changed) { return changed ? insertSets(o, false) : insert(o); });
                        }
                        else {
                            p = insert(o, function (changed) { return changed ? insertSets(o, true) : update(o); });
                        }
                        return p
                            .then(function (changed) {
                            console.assert(changed);
                            if (changed) {
                                o._clearChanges();
                                o._isInDb = true;
                            }
                        });
                    };
                    return Promise.all(objects.map(upsert)).then(resolve, reject);
                });
            });
        };
        return Store;
    })();
    Updraft.Store = Store;
})(Updraft || (Updraft = {}));
/// <reference path="./store.ts" />
/// <reference path="./query.ts" />
if (typeof module !== "undefined") {
    module.exports = Updraft;
}

//# sourceMappingURL=../dist/updraft.js.map