var updraft =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Column_ = __webpack_require__(1);
	var Mutate_ = __webpack_require__(3);
	var Query_ = __webpack_require__(5);
	var Store_ = __webpack_require__(6);
	var Table_ = __webpack_require__(7);
	var SQLiteWrapper_ = __webpack_require__(8);
	var WebsqlWrapper_ = __webpack_require__(9);
	var Updraft;
	(function (Updraft) {
	    Updraft.Query = Query_;
	    Updraft.Mutate = Mutate_;
	    Updraft.ColumnType = Column_.ColumnType;
	    Updraft.Column = Column_.Column;
	    Updraft.OrderBy = Table_.OrderBy;
	    Updraft.Table = Table_.Table;
	    Updraft.Store = Store_.Store;
	    Updraft.createStore = Store_.createStore;
	    Updraft.mutate = Mutate_.mutate;
	    Updraft.wrapSql = SQLiteWrapper_.wrapSql;
	    Updraft.wrapWebSql = WebsqlWrapper_.wrapWebsql;
	})(Updraft = exports.Updraft || (exports.Updraft = {}));
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Updraft;


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var verify_1 = __webpack_require__(2);
	(function (ColumnType) {
	    ColumnType[ColumnType["int"] = 0] = "int";
	    ColumnType[ColumnType["real"] = 1] = "real";
	    ColumnType[ColumnType["bool"] = 2] = "bool";
	    ColumnType[ColumnType["text"] = 3] = "text";
	    ColumnType[ColumnType["blob"] = 4] = "blob";
	    // enum,
	    ColumnType[ColumnType["date"] = 5] = "date";
	    ColumnType[ColumnType["datetime"] = 6] = "datetime";
	    ColumnType[ColumnType["json"] = 7] = "json";
	    ColumnType[ColumnType["ptr"] = 8] = "ptr";
	    ColumnType[ColumnType["set"] = 9] = "set";
	})(exports.ColumnType || (exports.ColumnType = {}));
	var ColumnType = exports.ColumnType;
	/**
	 * Column in db.  Use static methods to create columns.
	 */
	var Column = (function () {
	    //public enum: EnumClass | TypeScriptEnum;
	    function Column(type) {
	        this.type = type;
	        if (type == ColumnType.bool) {
	            this.defaultValue = 0;
	        }
	    }
	    /**
	        * Column is the primary key.  Only one column can have this set.
	        */
	    Column.prototype.Key = function () {
	        this.isKey = true;
	        return this;
	    };
	    /**
	        * Create an index for this column for faster queries.
	        */
	    Column.prototype.Index = function () {
	        this.isIndex = true;
	        return this;
	    };
	    /**
	        * Set a default value for the column
	        */
	    // TODO
	    Column.prototype.Default = function (value) {
	        if (this.type == ColumnType.bool) {
	            value = (value != false) ? 1 : 0;
	        }
	        this.defaultValue = value;
	        return this;
	    };
	    /** create a column with "INTEGER" affinity */
	    Column.Int = function () {
	        return new Column(ColumnType.int);
	    };
	    /** create a column with "REAL" affinity */
	    Column.Real = function () {
	        return new Column(ColumnType.real);
	    };
	    /** create a column with "BOOL" affinity */
	    Column.Bool = function () {
	        return new Column(ColumnType.bool);
	    };
	    /** create a column with "TEXT" affinity */
	    Column.Text = function () {
	        return new Column(ColumnType.text);
	    };
	    /** create a column with "TEXT" affinity */
	    Column.String = function () {
	        return new Column(ColumnType.text);
	    };
	    /** create a column with "BLOB" affinity */
	    Column.Blob = function () {
	        var c = new Column(ColumnType.blob);
	        return c;
	    };
	    // /** a javascript object with instance method "toString" and class method "get" (e.g. {@link https://github.com/adrai/enum}). */
	    // static Enum(enum_: EnumClass | TypeScriptEnum): Column {
	    //   let c = new Column(ColumnType.enum);
	    //   c.enum = enum_;
	    //   return c;
	    // }
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
	    // /** points to an object in another table.  Its affinity will automatically be that table's key's affinity */
	    // static Ptr(ref: ClassTemplate<any>): Column {
	    //   let c = new Column(ColumnType.ptr);
	    //   c.ref = ref;
	    //   return c;
	    // }
	    // /** unordered collection */
	    // static Set(ref: ClassTemplate<any> /*| ColumnType*/): Column {
	    //   let c = new Column(ColumnType.set);
	    //   c.ref = ref;
	    //   return c;
	    // }
	    Column.sql = function (val) {
	        var stmt = "";
	        switch (val.type) {
	            case ColumnType.int:
	                stmt = "INTEGER";
	                break;
	            case ColumnType.bool:
	                stmt = "BOOLEAN";
	                break;
	            case ColumnType.real:
	                stmt = "REAL";
	                break;
	            case ColumnType.text:
	                stmt = "TEXT";
	                break;
	            case ColumnType.json:
	                stmt = "CLOB";
	                break;
	            // case ColumnType.enum:
	            // 	stmt = "CHARACTER(20)";
	            // 	break;
	            case ColumnType.blob:
	                stmt = "BLOB";
	                break;
	            case ColumnType.date:
	                stmt = "DATE";
	                break;
	            case ColumnType.datetime:
	                stmt = "DATETIME";
	                break;
	            default:
	                throw new Error("unsupported type");
	        }
	        if ("defaultValue" in val) {
	            var escape = function (x) {
	                if (typeof x === "number") {
	                    return x;
	                }
	                else if (typeof x === "string") {
	                    return "'" + x.replace(/'/g, "''") + "'";
	                }
	                else {
	                    verify_1.verify(false, "default value (%s) must be number or string", x);
	                }
	            }
	            stmt += " DEFAULT " + escape(val.defaultValue);
	        }
	        return stmt;
	    };
	    Column.fromSql = function (text) {
	        var parts = text.split(" ");
	        var col = null;
	        switch (parts[0]) {
	            case "INTEGER":
	                col = Column.Int();
	                break;
	            case "BOOLEAN":
	                col = Column.Bool();
	                break;
	            case "REAL":
	                col = Column.Real();
	                break;
	            case "TEXT":
	                col = Column.Text();
	                break;
	            case "CLOB":
	                col = Column.JSON();
	                break;
	            // case "CHARACTER(20)";
	            // 	col = Column.Enum()
	            // 	break;
	            case "DATE":
	                col = Column.Date();
	                break;
	            case "DATETIME":
	                col = Column.DateTime();
	                break;
	            default:
	                throw new Error("unsupported type: " + parts[0]);
	        }
	        var match = text.match(/DEFAULT\s+'((?:[^']|'')*)'/i);
	        if (match) {
	            var val = match[1].replace(/''/g, "'");
	            col.Default(val);
	        }
	        else {
	            match = text.match(/DEFAULT\s+(\w+)/i);
	            if (match) {
	                var val = match[1];
	                var valnum = parseInt(val, 10);
	                if (val == valnum) {
	                    val = valnum;
	                }
	                col.Default(val);
	            }
	        }
	        return col;
	    };
	    Column.equal = function (a, b) {
	        if (a.type != b.type) {
	            return false;
	        }
	        if ((a.defaultValue || b.defaultValue) && (a.defaultValue != b.defaultValue)) {
	            return false;
	        }
	        if ((a.isKey || b.isKey) && (a.isKey != b.isKey)) {
	            return false;
	        }
	        return true;
	    };
	    return Column;
	})();
	exports.Column = Column;


/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";
	/**
	 * Use verify() to assert state which your program assumes to be true.
	 *
	 * Provide sprintf-style format (only %s is supported) and arguments
	 * to provide information about what broke and what you were
	 * expecting.
	 */
	function makePrintable(x) {
	    if (Array.isArray(x) || (x && typeof x === "object")) {
	        return JSON.stringify(x);
	    }
	    else {
	        return x;
	    }
	}
	function verify(condition, format) {
	    var args = [];
	    for (var _i = 2; _i < arguments.length; _i++) {
	        args[_i - 2] = arguments[_i];
	    }
	    if (!condition) {
	        var argIndex = 0;
	        var error = new Error(format.replace(/%s/g, function () { return makePrintable(args[argIndex++]); }));
	        error.framesToPop = 1; // we don't care about verify's own frame
	        throw error;
	    }
	}
	exports.verify = verify;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	// written to React"s immutability helpers spec
	// see https://facebook.github.io/react/docs/update.html
	///<reference path="../typings/tsd.d.ts"/>
	"use strict";
	var assign_1 = __webpack_require__(4);
	var verify_1 = __webpack_require__(2);
	function shallowCopy(x) {
	    if (Array.isArray(x)) {
	        return x.concat();
	    }
	    else if (x instanceof Set) {
	        return new Set(x);
	    }
	    else if (x && typeof x === "object") {
	        return assign_1.assign(new x.constructor(), x);
	    }
	    else {
	        return x;
	    }
	}
	exports.shallowCopy = shallowCopy;
	function shallowEqual(a, b) {
	    if (Array.isArray(a) && Array.isArray(b)) {
	        var aa = a;
	        var bb = b;
	        if (aa.length == bb.length) {
	            for (var i = 0; i < aa.length; i++) {
	                if (aa[i] != bb[i]) {
	                    return false;
	                }
	            }
	            return true;
	        }
	        return false;
	    }
	    else if (a instanceof Set && b instanceof Set) {
	        var aa = a;
	        var bb = b;
	        if (aa.size == bb.size) {
	            for (var elt in aa) {
	                if (!bb.has(elt)) {
	                    return false;
	                }
	            }
	            return true;
	        }
	        return false;
	    }
	    else if (typeof a == "object" && typeof b == "object") {
	        var akeys = Object.keys(a);
	        var bkeys = Object.keys(b);
	        if (akeys.length == bkeys.length) {
	            for (var _i = 0; _i < akeys.length; _i++) {
	                var key = akeys[_i];
	                if (!(key in b) || a[key] != b[key]) {
	                    return false;
	                }
	            }
	            return true;
	        }
	        return false;
	    }
	    return a == b;
	}
	exports.hasOwnProperty = {}.hasOwnProperty;
	function keyOf(obj) { return Object.keys(obj)[0]; }
	exports.keyOf = keyOf;
	var command = {
	    set: keyOf({ $set: null }),
	    increment: keyOf({ $inc: null }),
	    push: keyOf({ $push: null }),
	    unshift: keyOf({ $unshift: null }),
	    splice: keyOf({ $splice: null }),
	    merge: keyOf({ $merge: null }),
	    add: keyOf({ $add: null }),
	    deleter: keyOf({ $delete: null }),
	};
	function verifyArrayCase(value, spec, c) {
	    verify_1.verify(Array.isArray(value), "mutate(): expected target of %s to be an array; got %s.", c, value);
	    var specValue = spec[c];
	    verify_1.verify(Array.isArray(specValue), "mutate(): expected spec of %s to be an array; got %s. " +
	        "Did you forget to wrap your parameter in an array?", c, specValue);
	}
	function verifySetCase(value, spec, c) {
	    verify_1.verify(value instanceof Set, "mutate(): expected target of %s to be a set; got %s.", c, value);
	    var specValue = spec[c];
	    verify_1.verify(Array.isArray(specValue), "mutate(): expected spec of %s to be an array; got %s. " +
	        "Did you forget to wrap your parameter in an array?", c, specValue);
	}
	function mutate(value, spec) {
	    verify_1.verify(typeof spec === "object", "mutate(): You provided a key path to mutate() that did not contain one " +
	        "of %s. Did you forget to include {%s: ...}?", Object.keys(command).join(", "), command.set);
	    // verify(
	    // 	Object.keys(spec).reduce( function(previousValue: boolean, currentValue: string): boolean {
	    // 		return previousValue && (keyOf(spec[currentValue]) in command);
	    // 	}, true),
	    // 	"mutate(): argument has an unknown key; supported keys are (%s).  mutator: %s",
	    // 	Object.keys(command).join(", "),
	    // 	spec
	    // );
	    if (exports.hasOwnProperty.call(spec, command.set)) {
	        verify_1.verify(Object.keys(spec).length === 1, "Cannot have more than one key in an object with %s", command.set);
	        return shallowEqual(value, spec[command.set]) ? value : spec[command.set];
	    }
	    if (exports.hasOwnProperty.call(spec, command.increment)) {
	        verify_1.verify(typeof (value) === "number" && typeof (spec[command.increment]) === "number", "Source (%s) and argument (%s) to %s must be numbers", value, spec[command.increment], command.increment);
	        return value + spec[command.increment];
	    }
	    var changed = false;
	    if (exports.hasOwnProperty.call(spec, command.merge)) {
	        var mergeObj = spec[command.merge];
	        var nextValue_1 = shallowCopy(value);
	        verify_1.verify(mergeObj && typeof mergeObj === "object", "mutate(): %s expects a spec of type 'object'; got %s", command.merge, mergeObj);
	        verify_1.verify(nextValue_1 && typeof nextValue_1 === "object", "mutate(): %s expects a target of type 'object'; got %s", command.merge, nextValue_1);
	        assign_1.assign(nextValue_1, spec[command.merge]);
	        return shallowEqual(value, nextValue_1) ? value : nextValue_1;
	    }
	    if (exports.hasOwnProperty.call(spec, command.deleter) && (typeof value === "object") && !(value instanceof Set)) {
	        var key = spec[command.merge];
	        verify_1.verify(key && typeof key === "string", "mutate(): %s expects a spec of type 'string'; got %s", command.deleter, key);
	        if (key in value) {
	            var nextValue_2 = shallowCopy(value);
	            delete nextValue_2[key];
	            return nextValue_2;
	        }
	        else {
	            return value;
	        }
	    }
	    if (exports.hasOwnProperty.call(spec, command.push)) {
	        verifyArrayCase(value, spec, command.push);
	        if (spec[command.push].length) {
	            var nextValue_3 = shallowCopy(value);
	            nextValue_3.push.apply(nextValue_3, spec[command.push]);
	            return nextValue_3;
	        }
	        else {
	            return value;
	        }
	    }
	    if (exports.hasOwnProperty.call(spec, command.unshift)) {
	        verifyArrayCase(value, spec, command.unshift);
	        if (spec[command.unshift].length) {
	            var nextValue_4 = shallowCopy(value);
	            nextValue_4.unshift.apply(nextValue_4, spec[command.unshift]);
	            return nextValue_4;
	        }
	        else {
	            return value;
	        }
	    }
	    if (exports.hasOwnProperty.call(spec, command.splice)) {
	        var nextValue_5 = shallowCopy(value);
	        verify_1.verify(Array.isArray(value), "Expected %s target to be an array; got %s", command.splice, value);
	        verify_1.verify(Array.isArray(spec[command.splice]), "mutate(): expected spec of %s to be an array of arrays; got %s. " +
	            "Did you forget to wrap your parameters in an array?", command.splice, spec[command.splice]);
	        spec[command.splice].forEach(function (args) {
	            verify_1.verify(Array.isArray(args), "mutate(): expected spec of %s to be an array of arrays; got %s. " +
	                "Did you forget to wrap your parameters in an array?", command.splice, spec[command.splice]);
	            nextValue_5.splice.apply(nextValue_5, args);
	        });
	        return shallowEqual(nextValue_5, value) ? value : nextValue_5;
	    }
	    if (exports.hasOwnProperty.call(spec, command.add)) {
	        var nextValue_6 = shallowCopy(value);
	        verifySetCase(value, spec, command.add);
	        spec[command.add].forEach(function (item) {
	            if (!nextValue_6.has(item)) {
	                nextValue_6.add(item);
	                changed = true;
	            }
	        });
	        return changed ? nextValue_6 : value;
	    }
	    if (exports.hasOwnProperty.call(spec, command.deleter) && (value instanceof Set)) {
	        var nextValue_7 = shallowCopy(value);
	        verifySetCase(value, spec, command.deleter);
	        spec[command.deleter].forEach(function (item) {
	            if (nextValue_7.delete(item)) {
	                changed = true;
	            }
	        });
	        return changed ? nextValue_7 : value;
	    }
	    var nextValue;
	    for (var k in spec) {
	        if (!(command.hasOwnProperty(k) && command[k])) {
	            var oldValue = value[k];
	            var newValue = mutate(oldValue, spec[k]);
	            if (oldValue !== newValue) {
	                if (!nextValue) {
	                    nextValue = shallowCopy(value);
	                }
	                nextValue[k] = newValue;
	                changed = true;
	            }
	        }
	    }
	    return changed ? nextValue : value;
	}
	exports.mutate = mutate;
	function isMutated(a, b) {
	    // TODO: this isn"t right because mutate will always return a new object
	    return a !== b;
	}
	exports.isMutated = isMutated;


/***/ },
/* 4 */
/***/ function(module, exports) {

	"use strict";
	function toObject(val) {
	    if (val === null || val === undefined) {
	        throw new TypeError("Object.assign cannot be called with null or undefined");
	    }
	    return Object(val);
	}
	var ObjectAssign = Object.assign || function (target, source) {
	    var hasOwnProperty = Object.prototype.hasOwnProperty;
	    var propIsEnumerable = Object.prototype.propertyIsEnumerable;
	    var from;
	    var to = toObject(target);
	    var symbols;
	    for (var s = 1; s < arguments.length; s++) {
	        from = Object(arguments[s]);
	        for (var key in from) {
	            if (hasOwnProperty.call(from, key)) {
	                to[key] = from[key];
	            }
	        }
	        if (Object.getOwnPropertySymbols) {
	            symbols = Object.getOwnPropertySymbols(from);
	            for (var i = 0; i < symbols.length; i++) {
	                if (propIsEnumerable.call(from, symbols[i])) {
	                    to[symbols[i]] = from[symbols[i]];
	                }
	            }
	        }
	    }
	    return to;
	};
	exports.assign = ObjectAssign;


/***/ },
/* 5 */
/***/ function(module, exports) {

	"use strict";


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Mutate_1 = __webpack_require__(3);
	var Column_1 = __webpack_require__(1);
	var Table_1 = __webpack_require__(7);
	var verify_1 = __webpack_require__(2);
	function startsWith(str, val) {
	    return str.lastIndexOf(val, 0) === 0;
	}
	var Schema = (function () {
	    function Schema() {
	    }
	    return Schema;
	})();
	exports.Schema = Schema;
	var ROWID = "rowid";
	var COUNT = "COUNT(*)";
	var internal_prefix = "updraft_";
	var internal_column_deleted = internal_prefix + "deleted";
	var internal_column_time = internal_prefix + "time";
	var internal_column_latest = internal_prefix + "latest";
	var internal_column_composed = internal_prefix + "composed";
	var internalColumn = {};
	internalColumn[internal_column_deleted] = Column_1.Column.Bool();
	internalColumn[internal_column_time] = Column_1.Column.DateTime().Key();
	internalColumn[internal_column_latest] = Column_1.Column.Bool();
	internalColumn[internal_column_composed] = Column_1.Column.Bool();
	var deleteRow_action = { internal_column_deleted: { $set: true } };
	function getChangeTableName(name) {
	    return internal_prefix + "changes_" + name;
	}
	var Store = (function () {
	    function Store(params) {
	        this.params = params;
	        this.tables = [];
	        this.db = null;
	        verify_1.verify(this.params.db, "must pass a DbWrapper");
	    }
	    Store.prototype.createTable = function (tableSpec) {
	        var _this = this;
	        function buildIndices(spec) {
	            spec.indices = spec.indices || [];
	            for (var col in spec.columns) {
	                if (spec.columns[col].isIndex) {
	                    spec.indices.push([col]);
	                }
	            }
	        }
	        function createInternalTableSpec(spec) {
	            var newSpec = Mutate_1.shallowCopy(spec);
	            newSpec.columns = Mutate_1.shallowCopy(spec.columns);
	            for (var col in internalColumn) {
	                verify_1.verify(!spec.columns[col], "table %s cannot have reserved column name %s", spec.name, col);
	                newSpec.columns[col] = internalColumn[col];
	            }
	            buildIndices(newSpec);
	            return newSpec;
	        }
	        function createChangeTableSpec(spec) {
	            var newSpec = {
	                name: getChangeTableName(spec.name),
	                columns: {
	                    key: Column_1.Column.Int().Key(),
	                    time: Column_1.Column.DateTime().Key(),
	                    change: Column_1.Column.JSON(),
	                }
	            };
	            buildIndices(newSpec);
	            return newSpec;
	        }
	        verify_1.verify(!this.db, "createTable() can only be added before open()");
	        verify_1.verify(!startsWith(tableSpec.name, internal_prefix), "table name %s cannot begin with %s", tableSpec.name, internal_prefix);
	        for (var col in tableSpec.columns) {
	            verify_1.verify(!startsWith(col, internal_prefix), "table %s column %s cannot begin with %s", tableSpec.name, col, internal_prefix);
	        }
	        var table = new Table_1.Table(tableSpec);
	        table.add = function () {
	            var changes = [];
	            for (var _i = 0; _i < arguments.length; _i++) {
	                changes[_i - 0] = arguments[_i];
	            }
	            return _this.add.apply(_this, [table].concat(changes));
	        };
	        table.find = function (query, opts) { return _this.find(table, query, opts); };
	        this.tables.push(createInternalTableSpec(tableSpec));
	        this.tables.push(createChangeTableSpec(tableSpec));
	        return table;
	    };
	    Store.prototype.open = function () {
	        var _this = this;
	        verify_1.verify(!this.db, "open() called more than once!");
	        verify_1.verify(this.tables.length, "open() called before any tables were added");
	        this.db = this.params.db;
	        return Promise.resolve()
	            .then(function () { return _this.readSchema(); })
	            .then(function (schema) { return _this.syncTables(schema); });
	        //.then(() => this.loadKeyValues());
	    };
	    Store.prototype.readSchema = function () {
	        verify_1.verify(this.db, "readSchema(): not opened");
	        function tableFromSql(name, sql) {
	            var table = { name: name, columns: {}, indices: [], triggers: {} };
	            var matches = sql.match(/\((.*)\)/);
	            if (matches) {
	                var pksplit = matches[1].split(/PRIMARY KEY/i);
	                var fields = pksplit[0].split(",");
	                for (var i = 0; i < fields.length; i++) {
	                    var ignore = /^\s*(primary|foreign)\s+key/i; // ignore standalone "PRIMARY KEY xxx"
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
	                        table.columns[parts[1]] = Column_1.Column.fromSql(parts[2]);
	                    }
	                }
	                if (pksplit.length > 1) {
	                    var pk = pksplit[1].match(/\((.*)\)/);
	                    if (pk) {
	                        var keys = pk[1].split(",");
	                        for (var i = 0; i < keys.length; i++) {
	                            var key = keys[i].trim();
	                            table.columns[key].isKey = true;
	                        }
	                    }
	                }
	            }
	            return table;
	        }
	        function indexFromSql(sql) {
	            var regex = /\((.*)\)/;
	            var matches = regex.exec(sql);
	            verify_1.verify(matches, "bad format on index- couldn't determine column names from sql: %s", sql);
	            return matches[1].split(",").map(function (x) { return x.trim(); });
	        }
	        return this.db.readTransaction(function (transaction) {
	            return transaction.executeSql("SELECT name, tbl_name, type, sql FROM sqlite_master", [], function (tx, resultSet) {
	                var schema = {};
	                for (var i = 0; i < resultSet.length; i++) {
	                    var row = resultSet[i];
	                    if (row.name[0] != "_" && !startsWith(row.name, "sqlite")) {
	                        switch (row.type) {
	                            case "table":
	                                schema[row.name] = tableFromSql(row.name, row.sql);
	                                break;
	                            case "index":
	                                var index = indexFromSql(row.sql);
	                                if (index.length == 1) {
	                                    var col = index[0];
	                                    verify_1.verify(row.tbl_name in schema, "table %s used by index %s should have been returned first", row.tbl_name, row.name);
	                                    verify_1.verify(col in schema[row.tbl_name].columns, "table %s does not have column %s used by index %s", row.tbl_name, col, row.name);
	                                    schema[row.tbl_name].columns[col].isIndex = true;
	                                }
	                                else {
	                                    schema[row.tbl_name].indices.push(index);
	                                }
	                                break;
	                            case "trigger":
	                                //schema[row.tbl_name].triggers[row.name] = row.sql;
	                                break;
	                        }
	                    }
	                }
	                return schema;
	            });
	        });
	    };
	    Store.prototype.syncTables = function (schema) {
	        var _this = this;
	        verify_1.verify(this.db, "syncTables(): not opened");
	        return this.db.transaction(function (transaction) {
	            var p = Promise.resolve();
	            _this.tables.forEach(function (table) {
	                p = p.then(function () { return _this.syncTable(transaction, schema, table); });
	            });
	            return p;
	        });
	    };
	    Store.prototype.syncTable = function (transaction, schema, spec) {
	        function createTable(name) {
	            var cols = [];
	            var pk = [];
	            for (var col in spec.columns) {
	                var attrs = spec.columns[col];
	                var decl = void 0;
	                switch (attrs.type) {
	                    // case ColumnType.ptr:
	                    //   console.assert(attrs.ref != null);
	                    //   console.assert(attrs.ref.columns != null);
	                    //   console.assert(attrs.ret.table.name != null);
	                    //   console.assert(attrs.ref.key != null);
	                    //   let foreignCol: Column = attrs.ref.columns[attrs.ref.key];
	                    //   decl = col + " " + Column.sql(foreignCol);
	                    //   cols.push(decl);
	                    //   break;
	                    // case ColumnType.set:
	                    // 	break;
	                    default:
	                        decl = col + " " + Column_1.Column.sql(attrs);
	                        cols.push(decl);
	                        if (attrs.isKey) {
	                            pk.push(col);
	                        }
	                        break;
	                }
	            }
	            verify_1.verify(pk.length, "table %s has no keys", name);
	            cols.push("PRIMARY KEY(" + pk.join(", ") + ")");
	            return transaction.executeSql("CREATE " + (spec.temp ? "TEMP " : "") + "TABLE " + name + " (" + cols.join(", ") + ")");
	        }
	        function dropTable(name) {
	            return transaction.executeSql("DROP TABLE " + name);
	        }
	        function createIndices(force) {
	            if (force === void 0) { force = false; }
	            function indicesEqual(a, b) {
	                if (a.length != b.length) {
	                    return false;
	                }
	                for (var i = 0; i < a.length; i++) {
	                    if (a[i] != b[i]) {
	                        return false;
	                    }
	                }
	                return true;
	            }
	            var p = Promise.resolve();
	            var oldIndices = (spec.name in schema) ? schema[spec.name].indices : [];
	            var newIndices = spec.indices;
	            function getIndexName(indices) {
	                return "index_" + spec.name + "__" + indices.join("_");
	            }
	            oldIndices.forEach(function (value, i) {
	                var drop = true;
	                for (var j = 0; j < newIndices.length; j++) {
	                    if (indicesEqual(oldIndices[i], newIndices[j])) {
	                        drop = false;
	                        break;
	                    }
	                }
	                if (drop) {
	                    p = p.then(function () { return transaction.executeSql("DROP INDEX " + getIndexName(oldIndices[i])); });
	                }
	            });
	            newIndices.forEach(function (value, j) {
	                var create = true;
	                for (var i = 0; i < oldIndices.length; i++) {
	                    if (indicesEqual(oldIndices[i], newIndices[j])) {
	                        create = false;
	                        break;
	                    }
	                }
	                if (create || force) {
	                    var index = newIndices[j];
	                    var sql = "CREATE INDEX " + getIndexName(index) + " ON " + spec.name + " (" + index.join(", ") + ")";
	                    p = p.then(function () { return transaction.executeSql(sql); });
	                }
	            });
	            return p;
	        }
	        var p = Promise.resolve();
	        if (spec.name in schema) {
	            var oldColumns = schema[spec.name].columns;
	            var newColumns = spec.columns;
	            var recreateTable = false;
	            for (var colName in oldColumns) {
	                if (!(colName in newColumns)) {
	                    recreateTable = true;
	                    break;
	                }
	                var oldCol = oldColumns[colName];
	                var newCol = newColumns[colName];
	                if (!Column_1.Column.equal(oldCol, newCol)) {
	                    recreateTable = true;
	                    break;
	                }
	            }
	            var renamedColumns = spec.renamedColumns || {};
	            for (var colName in renamedColumns) {
	                if (colName in oldColumns) {
	                    recreateTable = true;
	                }
	            }
	            var addedColumns = {};
	            if (!recreateTable) {
	                for (var colName in newColumns) {
	                    if (!(colName in oldColumns)) {
	                        addedColumns[colName] = newColumns[colName];
	                    }
	                }
	            }
	            if (recreateTable) {
	                // recreate and migrate data
	                function copyData(oldName, newName) {
	                    var oldTableColumns = Object.keys(oldColumns).filter(function (col) { return (col in spec.columns) || (col in renamedColumns); });
	                    var newTableColumns = oldTableColumns.map(function (col) { return (col in renamedColumns) ? renamedColumns[col] : col; });
	                    var p2 = Promise.resolve();
	                    if (oldTableColumns.length && newTableColumns.length) {
	                        var stmt = "INSERT INTO " + newName + " (" + newTableColumns.join(", ") + ") ";
	                        stmt += "SELECT " + oldTableColumns.join(", ") + " FROM " + oldName + ";";
	                        p2 = transaction.executeSql(stmt);
	                    }
	                    return p2;
	                }
	                function migrateChangeTable(changeTableName) {
	                    var deletedColumns = Object.keys(oldColumns).filter(function (col) { return !(col in spec.columns) && !(col in renamedColumns); });
	                    var p2 = Promise.resolve();
	                    if (spec.renamedColumns || deletedColumns) {
	                        p2 = p2.then(function () {
	                            return transaction.each("SELECT " + ROWID + ", change"
	                                + " FROM " + changeTableName, [], function (selectChangeTransaction, row) {
	                                var change = JSON.parse(row.change);
	                                var changed = false;
	                                for (var oldCol in spec.renamedColumns) {
	                                    var newCol = spec.renamedColumns[oldCol];
	                                    if (oldCol in change) {
	                                        change[newCol] = change[oldCol];
	                                        delete change[oldCol];
	                                        changed = true;
	                                    }
	                                }
	                                for (var _i = 0; _i < deletedColumns.length; _i++) {
	                                    var oldCol = deletedColumns[_i];
	                                    if (oldCol in change) {
	                                        delete change[oldCol];
	                                        changed = true;
	                                    }
	                                }
	                                if (changed) {
	                                    if (Object.keys(change).length) {
	                                        return selectChangeTransaction.executeSql("UPDATE " + changeTableName
	                                            + " SET change=?"
	                                            + " WHERE " + ROWID + "=?", [JSON.stringify(change), row[ROWID]]);
	                                    }
	                                    else {
	                                        return selectChangeTransaction.executeSql("DELETE FROM " + changeTableName
	                                            + " WHERE " + ROWID + "=?", [row[ROWID]]);
	                                    }
	                                }
	                            });
	                        });
	                    }
	                    return p2;
	                }
	                function renameTable(oldName, newName) {
	                    return transaction.executeSql("ALTER TABLE " + oldName + " RENAME TO " + newName);
	                }
	                var tempTableName = "temp_" + spec.name;
	                var changeTableName = getChangeTableName(spec.name);
	                if (tempTableName in schema) {
	                    // yikes!  migration failed but transaction got committed?
	                    p = p.then(function () { return dropTable(tempTableName); });
	                }
	                p = p.then(function () { return createTable(tempTableName); });
	                p = p.then(function () { return copyData(spec.name, tempTableName); });
	                p = p.then(function () { return dropTable(spec.name); });
	                p = p.then(function () { return renameTable(tempTableName, spec.name); });
	                p = p.then(function () { return migrateChangeTable(changeTableName); });
	                p = p.then(function () { return createIndices(true); });
	            }
	            else if (addedColumns != {}) {
	                // alter table, add columns
	                Object.keys(addedColumns).forEach(function (colName) {
	                    var col = spec.columns[colName];
	                    var columnDecl = colName + " " + Column_1.Column.sql(col);
	                    p = p.then(function () { return transaction.executeSql("ALTER TABLE " + spec.name + " ADD COLUMN " + columnDecl); });
	                });
	                p = p.then(function () { return createIndices(); });
	            }
	            else {
	                // no table modification is required
	                p = p.then(function () { return createIndices(); });
	            }
	        }
	        else {
	            // create new table
	            p = p.then(function () { return createTable(spec.name); });
	            p = p.then(function () { return createIndices(true); });
	        }
	        return p;
	    };
	    Store.prototype.add = function (table) {
	        var changes = [];
	        for (var _i = 1; _i < arguments.length; _i++) {
	            changes[_i - 1] = arguments[_i];
	        }
	        function insert(transaction, tableName, columns, values) {
	            var questionMarks = values.map(function (v) { return "?"; });
	            return transaction.executeSql("INSERT OR REPLACE INTO " + tableName + " (" + columns.join(", ") + ") VALUES (" + questionMarks.join(", ") + ")", values);
	        }
	        verify_1.verify(this.db, "apply(): not opened");
	        var changeTable = getChangeTableName(table.spec.name);
	        return this.db.transaction(function (transaction) {
	            var p1 = Promise.resolve();
	            var toResolve = new Set();
	            changes.forEach(function (change) {
	                var time = change.time || Date.now();
	                verify_1.verify((change.save ? 1 : 0) + (change.change ? 1 : 0) + (change.delete ? 1 : 0) === 1, "change (%s) must specify exactly one action at a time", change);
	                if (change.save) {
	                    var element = change.save;
	                    var keyValue = table.keyValue(element);
	                    var columns = Object.keys(element).filter(function (k) { return k in table.spec.columns; });
	                    var values = columns.map(function (k) { return element[k]; });
	                    // append internal column values
	                    columns = [internal_column_time].concat(columns);
	                    values = [time].concat(values);
	                    p1 = p1.then(function () { return insert(transaction, table.spec.name, columns, values); });
	                    toResolve.add(keyValue);
	                }
	                else if (change.change || change.delete) {
	                    // insert into change table
	                    var changeRow = {
	                        key: null,
	                        time: time,
	                        change: null
	                    };
	                    if (change.change) {
	                        // store changes
	                        var mutator = Mutate_1.shallowCopy(change.change);
	                        changeRow.key = table.keyValue(mutator);
	                        delete mutator[table.key];
	                        changeRow.change = JSON.stringify(mutator);
	                    }
	                    else {
	                        // mark deleted
	                        changeRow.key = change.delete;
	                        changeRow.change = JSON.stringify(deleteRow_action);
	                    }
	                    var columns = Object.keys(changeRow);
	                    var values = columns.map(function (k) { return changeRow[k]; });
	                    p1 = p1.then(function () { return insert(transaction, changeTable, columns, values); });
	                    toResolve.add(changeRow.key);
	                }
	                else {
	                    throw new Error("no operation specified for change- should be one of save, change, or delete");
	                }
	            });
	            // these could be done in parallel
	            toResolve.forEach(function (keyValue) {
	                var baselineCols = [ROWID, internal_column_time, internal_column_deleted].concat(Object.keys(table.spec.columns));
	                p1 = p1.then(function () { return transaction.executeSql("SELECT " + baselineCols.join(", ")
	                    + " FROM " + table.spec.name
	                    + " WHERE " + table.key + "=?" + " AND " + internal_column_composed + "=0"
	                    + " ORDER BY " + internal_column_time + " DESC"
	                    + " LIMIT 1", [keyValue], function (tx1, baselineResults) {
	                    var baseline = {};
	                    var baseTime = 0;
	                    var baseRowId = -1;
	                    if (baselineResults.length) {
	                        baseline = baselineResults[0];
	                        baseTime = baseline[internal_column_time];
	                        verify_1.verify(ROWID in baseline, "object has no ROWID (%s) - it has [%s]", ROWID, Object.keys(baseline).join(", "));
	                        baseRowId = baseline[ROWID];
	                    }
	                    else {
	                        baseline[table.key] = keyValue;
	                    }
	                    var mutation = baseline;
	                    var mutationTime = baseTime;
	                    return tx1.executeSql("SELECT key, time, change"
	                        + " FROM " + changeTable
	                        + " WHERE key=? AND time>=?"
	                        + " ORDER BY time ASC", [keyValue, baseTime], function (tx2, changeResults) {
	                        var p2 = Promise.resolve();
	                        for (var i = 0; i < changeResults.length; i++) {
	                            var row = changeResults[i];
	                            var mutator = JSON.parse(row.change);
	                            mutation = Mutate_1.mutate(mutation, mutator);
	                            mutationTime = Math.max(mutationTime, row.time);
	                        }
	                        if (baseRowId != -1 && !Mutate_1.isMutated(mutation, baseline)) {
	                            // mark it as latest (and others as not)
	                            p2 = p2.then(function () { return tx2.executeSql("UPDATE " + table.spec.name
	                                + " SET " + internal_column_latest + "=(" + ROWID + "=" + baseRowId + ")"
	                                + " WHERE " + table.key + "=?", [keyValue]); });
	                        }
	                        else {
	                            // invalidate old latest rows
	                            p2 = p2.then(function () { return tx2.executeSql("UPDATE " + table.spec.name
	                                + " SET " + internal_column_latest + "=0"
	                                + " WHERE " + table.key + "=?", [keyValue]); });
	                            // insert new latest row
	                            mutation[internal_column_latest] = true;
	                            mutation[internal_column_time] = mutationTime;
	                            mutation[internal_column_composed] = true;
	                            var columns = Object.keys(mutation).filter(function (key) { return (key in table.spec.columns) || (key in internalColumn); });
	                            var values = columns.map(function (col) { return mutation[col]; });
	                            p2 = p2.then(function () { return insert(tx2, table.spec.name, columns, values); });
	                        }
	                        return p2;
	                    });
	                }); });
	            });
	            return p1;
	        });
	    };
	    Store.prototype.find = function (table, query, opts) {
	        opts = opts || {};
	        var numericConditions = {
	            $gt: ">",
	            $gte: ">=",
	            $lt: "<",
	            $lte: "<="
	        };
	        var inCondition = Mutate_1.keyOf({ $in: false });
	        var conditions = [];
	        var values = [];
	        conditions.push("NOT " + internal_column_deleted);
	        conditions.push(internal_column_latest);
	        for (var col in query) {
	            var spec = query[col];
	            var found = false;
	            for (var condition in numericConditions) {
	                if (Mutate_1.hasOwnProperty.call(spec, condition)) {
	                    conditions.push("(" + col + numericConditions[condition] + "?)");
	                    var value = spec[condition];
	                    verify_1.verify(parseInt(value, 10) == value, "condition %s must have a numeric argument: %s", condition, value);
	                    values.push(value);
	                    found = true;
	                    break;
	                }
	            }
	            if (!found) {
	                if (Mutate_1.hasOwnProperty.call(spec, inCondition)) {
	                    verify_1.verify(spec[inCondition] instanceof Array, "must be an array: %s", spec[inCondition]);
	                    conditions.push(col + " IN (" + spec[inCondition].map(function (x) { return "?"; }).join(", ") + ")");
	                    values.push.apply(values, spec[inCondition]);
	                    found = true;
	                }
	            }
	            if (!found) {
	                if (table.spec.columns[col].type == Column_1.ColumnType.bool) {
	                    conditions.push((spec ? "" : "NOT ") + col);
	                    found = true;
	                }
	                else if (typeof spec === "number" || typeof spec === "string") {
	                    conditions.push("(" + col + "=?)");
	                    values.push(spec);
	                    found = true;
	                }
	                else if (spec instanceof RegExp) {
	                    var rx = spec;
	                    var arg = rx.source.replace(/\.\*/g, "%").replace(/\./g, "_");
	                    if (arg[0] == "^") {
	                        arg = arg.substring(1);
	                    }
	                    else {
	                        arg = "%" + arg;
	                    }
	                    if (arg[arg.length - 1] == "$") {
	                        arg = arg.substring(0, arg.length - 1);
	                    }
	                    else {
	                        arg = arg + "%";
	                    }
	                    verify_1.verify(!arg.match(/(\$|\^|\*|\.|\(|\)|\[|\]|\?)/), "RegExp search only supports simple wildcards (.* and .): %s", arg);
	                    conditions.push("(" + col + " LIKE ?)");
	                    values.push(arg);
	                    found = true;
	                }
	                verify_1.verify(found, "unknown query condition for %s: %s", col, spec);
	            }
	        }
	        var columns = Object.keys(opts.fields || table.spec.columns);
	        var stmt = "SELECT " + (opts.count ? COUNT : columns.join(", "));
	        stmt += " FROM " + table.spec.name;
	        stmt += " WHERE " + conditions.join(" AND ");
	        if (opts.orderBy) {
	            var col = Mutate_1.keyOf(opts.orderBy);
	            var order = opts.orderBy[col];
	            stmt += " ORDER BY " + col + " " + (order == Table_1.OrderBy.ASC ? "ASC" : "DESC");
	        }
	        if (opts.limit) {
	            stmt += " LIMIT " + opts.limit;
	        }
	        if (opts.offset) {
	            stmt += " OFFSET " + opts.offset;
	        }
	        return this.db.readTransaction(function (tx1) {
	            return tx1.executeSql(stmt, values, function (tx2, rows) {
	                if (opts.count) {
	                    var count = parseInt(rows[0][COUNT], 10);
	                    return Promise.resolve(count);
	                }
	                else {
	                    var results = [];
	                    for (var i = 0; i < rows.length; i++) {
	                        var row = rows[i];
	                        for (var col in row) {
	                            if (table.spec.columns[col].type == Column_1.ColumnType.bool) {
	                                row[col] = (row[col] && row[col] != 'false') ? true : false;
	                            }
	                        }
	                        // TODO: add constructable objects
	                        results.push(row);
	                    }
	                    return Promise.resolve(results);
	                }
	            });
	        });
	    };
	    return Store;
	})();
	exports.Store = Store;
	function createStore(params) {
	    return new Store(params);
	}
	exports.createStore = createStore;


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var verify_1 = __webpack_require__(2);
	(function (OrderBy) {
	    OrderBy[OrderBy["ASC"] = 0] = "ASC";
	    OrderBy[OrderBy["DESC"] = 1] = "DESC";
	})(exports.OrderBy || (exports.OrderBy = {}));
	var OrderBy = exports.OrderBy;
	var Table = (function () {
	    function Table(spec) {
	        this.spec = spec;
	        this.key = tableKey(spec);
	    }
	    Table.prototype.keyValue = function (element) {
	        verify_1.verify(this.key in element, "object does not have key field '%s' set: %s", this.key, element);
	        return element[this.key];
	    };
	    return Table;
	})();
	exports.Table = Table;
	function tableKey(spec) {
	    var key = null;
	    for (var name_1 in spec.columns) {
	        var column = spec.columns[name_1];
	        verify_1.verify(column, "column '%s' is not in %s", name_1, spec);
	        if (column.isKey) {
	            verify_1.verify(!key, "Table %s has more than one key- %s and %s", spec.name, key, name_1);
	            key = name_1;
	        }
	    }
	    verify_1.verify(key, "Table %s does not have a key", spec.name);
	    return key;
	}
	exports.tableKey = tableKey;


/***/ },
/* 8 */
/***/ function(module, exports) {

	///<reference path="../typings/tsd.d.ts"/>
	var SQLiteWrapper = (function () {
	    function SQLiteWrapper(db) {
	        this.db = db;
	    }
	    SQLiteWrapper.prototype.run = function (sql) {
	        var _this = this;
	        return new Promise(function (resolve, reject) {
	            _this.db.run(sql, function (err) {
	                if (err) {
	                    console.log("SQLiteWrapper.run(): error executing '" + sql + "': ", err);
	                    reject(err);
	                }
	                else {
	                    resolve();
	                }
	            });
	        });
	    };
	    SQLiteWrapper.prototype.all = function (tx, sql, params, callback) {
	        var _this = this;
	        return new Promise(function (resolve, reject) {
	            _this.db.all(sql, params, function (err, rows) {
	                if (err) {
	                    console.log("SQLiteWrapper.all(): error executing '" + sql + "': ", err);
	                    reject(err);
	                }
	                else {
	                    if (callback) {
	                        resolve(callback(tx, rows));
	                    }
	                    else {
	                        resolve(rows);
	                    }
	                }
	            });
	        });
	    };
	    SQLiteWrapper.prototype.each = function (tx, sql, params, callback) {
	        var _this = this;
	        var p = Promise.resolve();
	        return new Promise(function (resolve, reject) {
	            _this.db.each(sql, params, function (err, row) {
	                if (err) {
	                    console.log("SQLiteWrapper.each(): error executing '" + sql + "': ", err);
	                    reject(err);
	                }
	                else {
	                    if (callback) {
	                        p = p.then(function () { return callback(tx, row); });
	                    }
	                }
	            }, function (err, count) {
	                if (err) {
	                    console.log("SQLiteWrapper.each(): error executing '" + sql + "': ", err);
	                    reject(err);
	                }
	                else {
	                    resolve(p);
	                }
	            });
	        });
	    };
	    SQLiteWrapper.prototype.transaction = function (callback) {
	        var _this = this;
	        var result = undefined;
	        return Promise.resolve()
	            .then(function () { return _this.run("BEGIN TRANSACTION"); })
	            .then(function () {
	            var tx = {
	                executeSql: function (sql, params, resultsCb) {
	                    return _this.all(tx, sql, params, resultsCb);
	                },
	                each: function (sql, params, resultsCb) {
	                    return _this.each(tx, sql, params, resultsCb);
	                }
	            };
	            return callback(tx);
	        })
	            .then(function (ret) { return result = ret; })
	            .then(function () { return _this.run("COMMIT TRANSACTION"); })
	            .then(function () { return result; })
	            .catch(function (err) {
	            console.log("encountered error, rolling back transaction: ", err);
	            _this.run("ROLLBACK TRANSACTION");
	            throw err;
	        });
	    };
	    SQLiteWrapper.prototype.readTransaction = function (callback) {
	        return this.transaction(callback);
	    };
	    return SQLiteWrapper;
	})();
	function wrapSql(db) {
	    return new SQLiteWrapper(db);
	}
	exports.wrapSql = wrapSql;


/***/ },
/* 9 */
/***/ function(module, exports) {

	///<reference path="./websql.d.ts"/>
	"use strict";
	var WebsqlWrapper = (function () {
	    function WebsqlWrapper(name, version, displayName, estimatedSize) {
	        version = version || "1.0";
	        displayName = displayName || name;
	        estimatedSize = estimatedSize || 5 * 1024 * 1024;
	        this.db = window.openDatabase(name, version, displayName, estimatedSize);
	    }
	    WebsqlWrapper.prototype.all = function (tx, sql, params, callback) {
	        var _this = this;
	        return new Promise(function (resolve, reject) {
	            tx.realTransaction.executeSql(sql, params, function (transaction, resultSet) {
	                var results = [];
	                for (var i = 0; i < resultSet.rows.length; i++) {
	                    var row = resultSet.rows.item(i);
	                    results.push(row);
	                }
	                if (callback) {
	                    resolve(callback(_this.wrapTransaction(transaction), results));
	                }
	                else {
	                    resolve(results);
	                }
	            }, function (transaction, error) {
	                console.error("error executing '" + sql + "': ", error);
	                reject(error);
	                return true;
	            });
	        });
	    };
	    WebsqlWrapper.prototype.each = function (tx, sql, params, callback) {
	        return new Promise(function (resolve, reject) {
	            tx.realTransaction.executeSql(sql, params, function (transaction, resultSet) {
	                var p = Promise.resolve();
	                for (var i = 0; i < resultSet.rows.length; i++) {
	                    var row = resultSet.rows.item(i);
	                    if (callback) {
	                        (function (row) {
	                            p = p.then(function () { return callback(tx, row); });
	                        })(row);
	                    }
	                }
	                resolve(p);
	            }, function (transaction, error) {
	                console.error("error executing '" + sql + "': ", error);
	                reject(error);
	                return true;
	            });
	        });
	    };
	    WebsqlWrapper.prototype.wrapTransaction = function (transaction) {
	        var _this = this;
	        var tx = {
	            realTransaction: transaction,
	            executeSql: function (sql, params, callback) {
	                return _this.all(tx, sql, params, callback);
	            },
	            each: function (sql, params, callback) {
	                return _this.each(tx, sql, params, callback);
	            }
	        };
	        return tx;
	    };
	    WebsqlWrapper.prototype.transaction = function (callback) {
	        var _this = this;
	        return new Promise(function (resolve, reject) {
	            _this.db.transaction(function (transaction) {
	                var tx = _this.wrapTransaction(transaction);
	                resolve(callback(tx));
	            });
	        });
	    };
	    WebsqlWrapper.prototype.readTransaction = function (callback) {
	        var _this = this;
	        return new Promise(function (resolve, reject) {
	            _this.db.readTransaction(function (transaction) {
	                var tx = _this.wrapTransaction(transaction);
	                resolve(callback(tx));
	            });
	        });
	    };
	    return WebsqlWrapper;
	})();
	function wrapWebsql(name, version, displayName, estimatedSize) {
	    return new WebsqlWrapper(name, version, displayName, estimatedSize);
	}
	exports.wrapWebsql = wrapWebsql;


/***/ }
/******/ ]);
//# sourceMappingURL=updraft.js.map