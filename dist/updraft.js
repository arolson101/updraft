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
	var Mutate_ = __webpack_require__(4);
	var Query_ = __webpack_require__(9);
	var Store_ = __webpack_require__(10);
	var Table_ = __webpack_require__(11);
	var SQLiteWrapper_ = __webpack_require__(17);
	var WebsqlWrapper_ = __webpack_require__(18);
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
	var invariant = __webpack_require__(2);
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
	            function escape(x) {
	                if (typeof x === "number") {
	                    return x;
	                }
	                else if (typeof x === "string") {
	                    return "'" + x.replace(/'/g, "''") + "'";
	                }
	                else {
	                    invariant(false, "default value (%s) must be number or string", x);
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
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule invariant
	 */
	
	'use strict';
	
	/**
	 * Use invariant() to assert state which your program assumes to be true.
	 *
	 * Provide sprintf-style format (only %s is supported) and arguments
	 * to provide information about what broke and what you were
	 * expecting.
	 *
	 * The invariant message will be stripped in production, but the invariant
	 * will remain to ensure logic does not differ in production.
	 */
	
	var invariant = function(condition, format, a, b, c, d, e, f) {
	  if (process.env.NODE_ENV !== 'production') {
	    if (format === undefined) {
	      throw new Error('invariant requires an error message argument');
	    }
	  }
	
	  if (!condition) {
	    var error;
	    if (format === undefined) {
	      error = new Error(
	        'Minified exception occurred; use the non-minified dev environment ' +
	        'for the full error message and additional helpful warnings.'
	      );
	    } else {
	      var args = [a, b, c, d, e, f];
	      var argIndex = 0;
	      error = new Error(
	        'Invariant Violation: ' +
	        format.replace(/%s/g, function() { return args[argIndex++]; })
	      );
	    }
	
	    error.framesToPop = 1; // we don't care about invariant's own frame
	    throw error;
	  }
	};
	
	module.exports = invariant;
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3)))

/***/ },
/* 3 */
/***/ function(module, exports) {

	// shim for using process in browser
	
	var process = module.exports = {};
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;
	
	function cleanUpNextTick() {
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}
	
	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = setTimeout(cleanUpNextTick);
	    draining = true;
	
	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    clearTimeout(timeout);
	}
	
	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        setTimeout(drainQueue, 0);
	    }
	};
	
	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};
	
	function noop() {}
	
	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	
	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};
	
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	// written to React"s immutability helpers spec
	// see https://facebook.github.io/react/docs/update.html
	///<reference path="../typings/tsd.d.ts"/>
	"use strict";
	var assign = __webpack_require__(5);
	var invariant = __webpack_require__(2);
	var equal = __webpack_require__(6);
	function shallowCopy(x) {
	    if (Array.isArray(x)) {
	        return x.concat();
	    }
	    else if (x instanceof Set) {
	        return new Set(x);
	    }
	    else if (x && typeof x === "object") {
	        return assign(new x.constructor(), x);
	    }
	    else {
	        return x;
	    }
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
	function invariantArrayCase(value, spec, c) {
	    invariant(Array.isArray(value), "mutate(): expected target of %s to be an array; got %s.", c, value);
	    var specValue = spec[c];
	    invariant(Array.isArray(specValue), "mutate(): expected spec of %s to be an array; got %s. " +
	        "Did you forget to wrap your parameter in an array?", c, specValue);
	}
	function invariantSetCase(value, spec, c) {
	    invariant(value instanceof Set, "mutate(): expected target of %s to be a set; got %s.", c, value);
	    var specValue = spec[c];
	    invariant(Array.isArray(specValue), "mutate(): expected spec of %s to be an array; got %s. " +
	        "Did you forget to wrap your parameter in an array?", c, specValue);
	}
	function mutate(value, spec) {
	    invariant(typeof spec === "object", "mutate(): You provided a key path to mutate() that did not contain one " +
	        "of %s. Did you forget to include {%s: ...}?", Object.keys(command).join(", "), command.set);
	    // invariant(
	    // 	Object.keys(spec).reduce( function(previousValue: boolean, currentValue: string): boolean {
	    // 		return previousValue && (keyOf(spec[currentValue]) in command);
	    // 	}, true),
	    // 	"mutate(): argument has an unknown key; supported keys are (%s).  mutator: %s",
	    // 	Object.keys(command).join(", "),
	    // 	spec
	    // );
	    if (exports.hasOwnProperty.call(spec, command.set)) {
	        invariant(Object.keys(spec).length === 1, "Cannot have more than one key in an object with %s", command.set);
	        return equal(value, spec[command.set]) ? value : spec[command.set];
	    }
	    if (exports.hasOwnProperty.call(spec, command.increment)) {
	        invariant(typeof (value) === "number" && typeof (spec[command.increment]) === "number", "Source (%s) and argument (%s) to %s must be numbers", value, spec[command.increment], command.increment);
	        return value + spec[command.increment];
	    }
	    var nextValue = shallowCopy(value);
	    var changed = false;
	    if (exports.hasOwnProperty.call(spec, command.merge)) {
	        var mergeObj = spec[command.merge];
	        invariant(mergeObj && typeof mergeObj === "object", "mutate(): %s expects a spec of type 'object'; got %s", command.merge, mergeObj);
	        invariant(nextValue && typeof nextValue === "object", "mutate(): %s expects a target of type 'object'; got %s", command.merge, nextValue);
	        assign(nextValue, spec[command.merge]);
	        return equal(value, nextValue) ? value : nextValue;
	    }
	    if (exports.hasOwnProperty.call(spec, command.deleter) && (typeof value === "object") && !(value instanceof Set)) {
	        var key = spec[command.merge];
	        invariant(key && typeof key === "string", "mutate(): %s expects a spec of type 'string'; got %s", command.deleter, key);
	        if (key in nextValue) {
	            delete nextValue[key];
	            return nextValue;
	        }
	        else {
	            return value;
	        }
	    }
	    if (exports.hasOwnProperty.call(spec, command.push)) {
	        invariantArrayCase(value, spec, command.push);
	        spec[command.push].forEach(function (item) {
	            nextValue.push(item);
	        });
	        return equal(value, nextValue) ? value : nextValue;
	    }
	    if (exports.hasOwnProperty.call(spec, command.unshift)) {
	        invariantArrayCase(value, spec, command.unshift);
	        if (spec[command.unshift].length) {
	            nextValue.unshift.apply(nextValue, spec[command.unshift]);
	            return nextValue;
	        }
	        else {
	            return value;
	        }
	    }
	    if (exports.hasOwnProperty.call(spec, command.splice)) {
	        invariant(Array.isArray(value), "Expected %s target to be an array; got %s", command.splice, value);
	        invariant(Array.isArray(spec[command.splice]), "mutate(): expected spec of %s to be an array of arrays; got %s. " +
	            "Did you forget to wrap your parameters in an array?", command.splice, spec[command.splice]);
	        spec[command.splice].forEach(function (args) {
	            invariant(Array.isArray(args), "mutate(): expected spec of %s to be an array of arrays; got %s. " +
	                "Did you forget to wrap your parameters in an array?", command.splice, spec[command.splice]);
	            nextValue.splice.apply(nextValue, args);
	        });
	        return equal(value, nextValue) ? value : nextValue;
	    }
	    if (exports.hasOwnProperty.call(spec, command.add)) {
	        invariantSetCase(value, spec, command.add);
	        spec[command.add].forEach(function (item) {
	            if (!nextValue.has(item)) {
	                nextValue.add(item);
	                changed = true;
	            }
	        });
	        return changed ? nextValue : value;
	    }
	    if (exports.hasOwnProperty.call(spec, command.deleter) && (value instanceof Set)) {
	        invariantSetCase(value, spec, command.deleter);
	        spec[command.deleter].forEach(function (item) {
	            if (nextValue.delete(item)) {
	                changed = true;
	            }
	        });
	        return changed ? nextValue : value;
	    }
	    for (var k in spec) {
	        if (!(command.hasOwnProperty(k) && command[k])) {
	            var oldValue = value[k];
	            var newValue = mutate(oldValue, spec[k]);
	            if (oldValue !== newValue) {
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
/* 5 */
/***/ function(module, exports) {

	/* eslint-disable no-unused-vars */
	'use strict';
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var propIsEnumerable = Object.prototype.propertyIsEnumerable;
	
	function toObject(val) {
		if (val === null || val === undefined) {
			throw new TypeError('Object.assign cannot be called with null or undefined');
		}
	
		return Object(val);
	}
	
	module.exports = Object.assign || function (target, source) {
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


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var pSlice = Array.prototype.slice;
	var objectKeys = __webpack_require__(7);
	var isArguments = __webpack_require__(8);
	
	var deepEqual = module.exports = function (actual, expected, opts) {
	  if (!opts) opts = {};
	  // 7.1. All identical values are equivalent, as determined by ===.
	  if (actual === expected) {
	    return true;
	
	  } else if (actual instanceof Date && expected instanceof Date) {
	    return actual.getTime() === expected.getTime();
	
	  // 7.3. Other pairs that do not both pass typeof value == 'object',
	  // equivalence is determined by ==.
	  } else if (!actual || !expected || typeof actual != 'object' && typeof expected != 'object') {
	    return opts.strict ? actual === expected : actual == expected;
	
	  // 7.4. For all other Object pairs, including Array objects, equivalence is
	  // determined by having the same number of owned properties (as verified
	  // with Object.prototype.hasOwnProperty.call), the same set of keys
	  // (although not necessarily the same order), equivalent values for every
	  // corresponding key, and an identical 'prototype' property. Note: this
	  // accounts for both named and indexed properties on Arrays.
	  } else {
	    return objEquiv(actual, expected, opts);
	  }
	}
	
	function isUndefinedOrNull(value) {
	  return value === null || value === undefined;
	}
	
	function isBuffer (x) {
	  if (!x || typeof x !== 'object' || typeof x.length !== 'number') return false;
	  if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
	    return false;
	  }
	  if (x.length > 0 && typeof x[0] !== 'number') return false;
	  return true;
	}
	
	function objEquiv(a, b, opts) {
	  var i, key;
	  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
	    return false;
	  // an identical 'prototype' property.
	  if (a.prototype !== b.prototype) return false;
	  //~~~I've managed to break Object.keys through screwy arguments passing.
	  //   Converting to array solves the problem.
	  if (isArguments(a)) {
	    if (!isArguments(b)) {
	      return false;
	    }
	    a = pSlice.call(a);
	    b = pSlice.call(b);
	    return deepEqual(a, b, opts);
	  }
	  if (isBuffer(a)) {
	    if (!isBuffer(b)) {
	      return false;
	    }
	    if (a.length !== b.length) return false;
	    for (i = 0; i < a.length; i++) {
	      if (a[i] !== b[i]) return false;
	    }
	    return true;
	  }
	  try {
	    var ka = objectKeys(a),
	        kb = objectKeys(b);
	  } catch (e) {//happens when one is a string literal and the other isn't
	    return false;
	  }
	  // having the same number of owned properties (keys incorporates
	  // hasOwnProperty)
	  if (ka.length != kb.length)
	    return false;
	  //the same set of keys (although not necessarily the same order),
	  ka.sort();
	  kb.sort();
	  //~~~cheap key test
	  for (i = ka.length - 1; i >= 0; i--) {
	    if (ka[i] != kb[i])
	      return false;
	  }
	  //equivalent values for every corresponding key, and
	  //~~~possibly expensive deep test
	  for (i = ka.length - 1; i >= 0; i--) {
	    key = ka[i];
	    if (!deepEqual(a[key], b[key], opts)) return false;
	  }
	  return typeof a === typeof b;
	}


/***/ },
/* 7 */
/***/ function(module, exports) {

	exports = module.exports = typeof Object.keys === 'function'
	  ? Object.keys : shim;
	
	exports.shim = shim;
	function shim (obj) {
	  var keys = [];
	  for (var key in obj) keys.push(key);
	  return keys;
	}


/***/ },
/* 8 */
/***/ function(module, exports) {

	var supportsArgumentsClass = (function(){
	  return Object.prototype.toString.call(arguments)
	})() == '[object Arguments]';
	
	exports = module.exports = supportsArgumentsClass ? supported : unsupported;
	
	exports.supported = supported;
	function supported(object) {
	  return Object.prototype.toString.call(object) == '[object Arguments]';
	};
	
	exports.unsupported = unsupported;
	function unsupported(object){
	  return object &&
	    typeof object == 'object' &&
	    typeof object.length == 'number' &&
	    Object.prototype.hasOwnProperty.call(object, 'callee') &&
	    !Object.prototype.propertyIsEnumerable.call(object, 'callee') ||
	    false;
	};


/***/ },
/* 9 */
/***/ function(module, exports) {

	"use strict";


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Mutate_1 = __webpack_require__(4);
	var Column_1 = __webpack_require__(1);
	var Table_1 = __webpack_require__(11);
	var invariant = __webpack_require__(2);
	var clone = __webpack_require__(12);
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
	        invariant(this.params.db, "must pass a DbWrapper");
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
	            var newSpec = clone(spec);
	            for (var col in internalColumn) {
	                invariant(!spec.columns[col], "table %s cannot have reserved column name %s", spec.name, col);
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
	        invariant(!this.db, "createTable() can only be added before open()");
	        invariant(!startsWith(tableSpec.name, internal_prefix), "table name %s cannot begin with %s", tableSpec.name, internal_prefix);
	        for (var col in tableSpec.columns) {
	            invariant(!startsWith(col, internal_prefix), "table %s column %s cannot begin with %s", tableSpec.name, col, internal_prefix);
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
	        invariant(!this.db, "open() called more than once!");
	        invariant(this.tables.length, "open() called before any tables were added");
	        this.db = this.params.db;
	        return Promise.resolve()
	            .then(function () { return _this.readSchema(); })
	            .then(function (schema) { return _this.syncTables(schema); });
	        //.then(() => this.loadKeyValues());
	    };
	    Store.prototype.readSchema = function () {
	        invariant(this.db, "readSchema(): not opened");
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
	            invariant(matches, "bad format on index- couldn't determine column names from sql: %s", sql);
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
	                                    invariant(row.tbl_name in schema, "table %s used by index %s should have been returned first", row.tbl_name, row.name);
	                                    invariant(col in schema[row.tbl_name].columns, "table %s does not have column %s used by index %s", row.tbl_name, col, row.name);
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
	        invariant(this.db, "syncTables(): not opened");
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
	            invariant(pk.length, "table %s has no keys", name);
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
	        invariant(this.db, "apply(): not opened");
	        var changeTable = getChangeTableName(table.spec.name);
	        return this.db.transaction(function (transaction) {
	            var p1 = Promise.resolve();
	            var toResolve = new Set();
	            changes.forEach(function (change) {
	                var time = change.time || Date.now();
	                invariant((change.save ? 1 : 0) + (change.change ? 1 : 0) + (change.delete ? 1 : 0) === 1, "change (%s) must specify exactly one action at a time", JSON.stringify(change));
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
	                        var mutator = clone(change.change);
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
	                        invariant(ROWID in baseline, "object has no ROWID (%s) - it has [%s]", ROWID, Object.keys(baseline).join(", "));
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
	                    invariant(parseInt(value, 10) == value, "condition %s must have a numeric argument: %s", condition, value);
	                    values.push(value);
	                    found = true;
	                    break;
	                }
	            }
	            if (!found) {
	                if (Mutate_1.hasOwnProperty.call(spec, inCondition)) {
	                    invariant(spec[inCondition] instanceof Array, "must be an array: %s", JSON.stringify(spec[inCondition]));
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
	                    invariant(!arg.match(/(\$|\^|\*|\.|\(|\)|\[|\]|\?)/), "RegExp search only supports simple wildcards (.* and .): %s", arg);
	                    conditions.push("(" + col + " LIKE ?)");
	                    values.push(arg);
	                    found = true;
	                }
	                invariant(found, "unknown query condition for %s: %s", col, JSON.stringify(spec));
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
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	///<reference path="./Store"/>
	var invariant = __webpack_require__(2);
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
	        invariant(this.key in element, "object does not have key field '%s' set: %s", this.key, element);
	        return element[this.key];
	    };
	    return Table;
	})();
	exports.Table = Table;
	function tableKey(spec) {
	    var key = null;
	    for (var name_1 in spec.columns) {
	        var column = spec.columns[name_1];
	        invariant(column, "column '%s' is not in %s", name_1, JSON.stringify(spec));
	        if (column.isKey) {
	            invariant(!key, "Table %s has more than one key- %s and %s", spec.name, key, name_1);
	            key = name_1;
	        }
	    }
	    invariant(key, "Table %s does not have a key", spec.name);
	    return key;
	}
	exports.tableKey = tableKey;


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var clone = (function() {
	'use strict';
	
	/**
	 * Clones (copies) an Object using deep copying.
	 *
	 * This function supports circular references by default, but if you are certain
	 * there are no circular references in your object, you can save some CPU time
	 * by calling clone(obj, false).
	 *
	 * Caution: if `circular` is false and `parent` contains circular references,
	 * your program may enter an infinite loop and crash.
	 *
	 * @param `parent` - the object to be cloned
	 * @param `circular` - set to true if the object to be cloned may contain
	 *    circular references. (optional - true by default)
	 * @param `depth` - set to a number if the object is only to be cloned to
	 *    a particular depth. (optional - defaults to Infinity)
	 * @param `prototype` - sets the prototype to be used when cloning an object.
	 *    (optional - defaults to parent prototype).
	*/
	function clone(parent, circular, depth, prototype) {
	  var filter;
	  if (typeof circular === 'object') {
	    depth = circular.depth;
	    prototype = circular.prototype;
	    filter = circular.filter;
	    circular = circular.circular
	  }
	  // maintain two arrays for circular references, where corresponding parents
	  // and children have the same index
	  var allParents = [];
	  var allChildren = [];
	
	  var useBuffer = typeof Buffer != 'undefined';
	
	  if (typeof circular == 'undefined')
	    circular = true;
	
	  if (typeof depth == 'undefined')
	    depth = Infinity;
	
	  // recurse this function so we don't reset allParents and allChildren
	  function _clone(parent, depth) {
	    // cloning null always returns null
	    if (parent === null)
	      return null;
	
	    if (depth == 0)
	      return parent;
	
	    var child;
	    var proto;
	    if (typeof parent != 'object') {
	      return parent;
	    }
	
	    if (clone.__isArray(parent)) {
	      child = [];
	    } else if (clone.__isRegExp(parent)) {
	      child = new RegExp(parent.source, __getRegExpFlags(parent));
	      if (parent.lastIndex) child.lastIndex = parent.lastIndex;
	    } else if (clone.__isDate(parent)) {
	      child = new Date(parent.getTime());
	    } else if (useBuffer && Buffer.isBuffer(parent)) {
	      child = new Buffer(parent.length);
	      parent.copy(child);
	      return child;
	    } else {
	      if (typeof prototype == 'undefined') {
	        proto = Object.getPrototypeOf(parent);
	        child = Object.create(proto);
	      }
	      else {
	        child = Object.create(prototype);
	        proto = prototype;
	      }
	    }
	
	    if (circular) {
	      var index = allParents.indexOf(parent);
	
	      if (index != -1) {
	        return allChildren[index];
	      }
	      allParents.push(parent);
	      allChildren.push(child);
	    }
	
	    for (var i in parent) {
	      var attrs;
	      if (proto) {
	        attrs = Object.getOwnPropertyDescriptor(proto, i);
	      }
	
	      if (attrs && attrs.set == null) {
	        continue;
	      }
	      child[i] = _clone(parent[i], depth - 1);
	    }
	
	    return child;
	  }
	
	  return _clone(parent, depth);
	}
	
	/**
	 * Simple flat clone using prototype, accepts only objects, usefull for property
	 * override on FLAT configuration object (no nested props).
	 *
	 * USE WITH CAUTION! This may not behave as you wish if you do not know how this
	 * works.
	 */
	clone.clonePrototype = function clonePrototype(parent) {
	  if (parent === null)
	    return null;
	
	  var c = function () {};
	  c.prototype = parent;
	  return new c();
	};
	
	// private utility functions
	
	function __objToStr(o) {
	  return Object.prototype.toString.call(o);
	};
	clone.__objToStr = __objToStr;
	
	function __isDate(o) {
	  return typeof o === 'object' && __objToStr(o) === '[object Date]';
	};
	clone.__isDate = __isDate;
	
	function __isArray(o) {
	  return typeof o === 'object' && __objToStr(o) === '[object Array]';
	};
	clone.__isArray = __isArray;
	
	function __isRegExp(o) {
	  return typeof o === 'object' && __objToStr(o) === '[object RegExp]';
	};
	clone.__isRegExp = __isRegExp;
	
	function __getRegExpFlags(re) {
	  var flags = '';
	  if (re.global) flags += 'g';
	  if (re.ignoreCase) flags += 'i';
	  if (re.multiline) flags += 'm';
	  return flags;
	};
	clone.__getRegExpFlags = __getRegExpFlags;
	
	return clone;
	})();
	
	if (typeof module === 'object' && module.exports) {
	  module.exports = clone;
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(13).Buffer))

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer, global) {/*!
	 * The buffer module from node.js, for the browser.
	 *
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */
	/* eslint-disable no-proto */
	
	var base64 = __webpack_require__(14)
	var ieee754 = __webpack_require__(15)
	var isArray = __webpack_require__(16)
	
	exports.Buffer = Buffer
	exports.SlowBuffer = SlowBuffer
	exports.INSPECT_MAX_BYTES = 50
	Buffer.poolSize = 8192 // not used by this implementation
	
	var rootParent = {}
	
	/**
	 * If `Buffer.TYPED_ARRAY_SUPPORT`:
	 *   === true    Use Uint8Array implementation (fastest)
	 *   === false   Use Object implementation (most compatible, even IE6)
	 *
	 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
	 * Opera 11.6+, iOS 4.2+.
	 *
	 * Due to various browser bugs, sometimes the Object implementation will be used even
	 * when the browser supports typed arrays.
	 *
	 * Note:
	 *
	 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
	 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
	 *
	 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
	 *     on objects.
	 *
	 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
	 *
	 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
	 *     incorrect length in some situations.
	
	 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
	 * get the Object implementation, which is slower but behaves correctly.
	 */
	Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
	  ? global.TYPED_ARRAY_SUPPORT
	  : typedArraySupport()
	
	function typedArraySupport () {
	  function Bar () {}
	  try {
	    var arr = new Uint8Array(1)
	    arr.foo = function () { return 42 }
	    arr.constructor = Bar
	    return arr.foo() === 42 && // typed array instances can be augmented
	        arr.constructor === Bar && // constructor can be set
	        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
	        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
	  } catch (e) {
	    return false
	  }
	}
	
	function kMaxLength () {
	  return Buffer.TYPED_ARRAY_SUPPORT
	    ? 0x7fffffff
	    : 0x3fffffff
	}
	
	/**
	 * Class: Buffer
	 * =============
	 *
	 * The Buffer constructor returns instances of `Uint8Array` that are augmented
	 * with function properties for all the node `Buffer` API functions. We use
	 * `Uint8Array` so that square bracket notation works as expected -- it returns
	 * a single octet.
	 *
	 * By augmenting the instances, we can avoid modifying the `Uint8Array`
	 * prototype.
	 */
	function Buffer (arg) {
	  if (!(this instanceof Buffer)) {
	    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
	    if (arguments.length > 1) return new Buffer(arg, arguments[1])
	    return new Buffer(arg)
	  }
	
	  this.length = 0
	  this.parent = undefined
	
	  // Common case.
	  if (typeof arg === 'number') {
	    return fromNumber(this, arg)
	  }
	
	  // Slightly less common case.
	  if (typeof arg === 'string') {
	    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
	  }
	
	  // Unusual.
	  return fromObject(this, arg)
	}
	
	function fromNumber (that, length) {
	  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) {
	    for (var i = 0; i < length; i++) {
	      that[i] = 0
	    }
	  }
	  return that
	}
	
	function fromString (that, string, encoding) {
	  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'
	
	  // Assumption: byteLength() return value is always < kMaxLength.
	  var length = byteLength(string, encoding) | 0
	  that = allocate(that, length)
	
	  that.write(string, encoding)
	  return that
	}
	
	function fromObject (that, object) {
	  if (Buffer.isBuffer(object)) return fromBuffer(that, object)
	
	  if (isArray(object)) return fromArray(that, object)
	
	  if (object == null) {
	    throw new TypeError('must start with number, buffer, array or string')
	  }
	
	  if (typeof ArrayBuffer !== 'undefined') {
	    if (object.buffer instanceof ArrayBuffer) {
	      return fromTypedArray(that, object)
	    }
	    if (object instanceof ArrayBuffer) {
	      return fromArrayBuffer(that, object)
	    }
	  }
	
	  if (object.length) return fromArrayLike(that, object)
	
	  return fromJsonObject(that, object)
	}
	
	function fromBuffer (that, buffer) {
	  var length = checked(buffer.length) | 0
	  that = allocate(that, length)
	  buffer.copy(that, 0, 0, length)
	  return that
	}
	
	function fromArray (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}
	
	// Duplicate of fromArray() to keep fromArray() monomorphic.
	function fromTypedArray (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  // Truncating the elements is probably not what people expect from typed
	  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
	  // of the old Buffer constructor.
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}
	
	function fromArrayBuffer (that, array) {
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    array.byteLength
	    that = Buffer._augment(new Uint8Array(array))
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that = fromTypedArray(that, new Uint8Array(array))
	  }
	  return that
	}
	
	function fromArrayLike (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}
	
	// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
	// Returns a zero-length buffer for inputs that don't conform to the spec.
	function fromJsonObject (that, object) {
	  var array
	  var length = 0
	
	  if (object.type === 'Buffer' && isArray(object.data)) {
	    array = object.data
	    length = checked(array.length) | 0
	  }
	  that = allocate(that, length)
	
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}
	
	if (Buffer.TYPED_ARRAY_SUPPORT) {
	  Buffer.prototype.__proto__ = Uint8Array.prototype
	  Buffer.__proto__ = Uint8Array
	}
	
	function allocate (that, length) {
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = Buffer._augment(new Uint8Array(length))
	    that.__proto__ = Buffer.prototype
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that.length = length
	    that._isBuffer = true
	  }
	
	  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
	  if (fromPool) that.parent = rootParent
	
	  return that
	}
	
	function checked (length) {
	  // Note: cannot use `length < kMaxLength` here because that fails when
	  // length is NaN (which is otherwise coerced to zero.)
	  if (length >= kMaxLength()) {
	    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
	                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
	  }
	  return length | 0
	}
	
	function SlowBuffer (subject, encoding) {
	  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)
	
	  var buf = new Buffer(subject, encoding)
	  delete buf.parent
	  return buf
	}
	
	Buffer.isBuffer = function isBuffer (b) {
	  return !!(b != null && b._isBuffer)
	}
	
	Buffer.compare = function compare (a, b) {
	  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
	    throw new TypeError('Arguments must be Buffers')
	  }
	
	  if (a === b) return 0
	
	  var x = a.length
	  var y = b.length
	
	  var i = 0
	  var len = Math.min(x, y)
	  while (i < len) {
	    if (a[i] !== b[i]) break
	
	    ++i
	  }
	
	  if (i !== len) {
	    x = a[i]
	    y = b[i]
	  }
	
	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	}
	
	Buffer.isEncoding = function isEncoding (encoding) {
	  switch (String(encoding).toLowerCase()) {
	    case 'hex':
	    case 'utf8':
	    case 'utf-8':
	    case 'ascii':
	    case 'binary':
	    case 'base64':
	    case 'raw':
	    case 'ucs2':
	    case 'ucs-2':
	    case 'utf16le':
	    case 'utf-16le':
	      return true
	    default:
	      return false
	  }
	}
	
	Buffer.concat = function concat (list, length) {
	  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')
	
	  if (list.length === 0) {
	    return new Buffer(0)
	  }
	
	  var i
	  if (length === undefined) {
	    length = 0
	    for (i = 0; i < list.length; i++) {
	      length += list[i].length
	    }
	  }
	
	  var buf = new Buffer(length)
	  var pos = 0
	  for (i = 0; i < list.length; i++) {
	    var item = list[i]
	    item.copy(buf, pos)
	    pos += item.length
	  }
	  return buf
	}
	
	function byteLength (string, encoding) {
	  if (typeof string !== 'string') string = '' + string
	
	  var len = string.length
	  if (len === 0) return 0
	
	  // Use a for loop to avoid recursion
	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'ascii':
	      case 'binary':
	      // Deprecated
	      case 'raw':
	      case 'raws':
	        return len
	      case 'utf8':
	      case 'utf-8':
	        return utf8ToBytes(string).length
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return len * 2
	      case 'hex':
	        return len >>> 1
	      case 'base64':
	        return base64ToBytes(string).length
	      default:
	        if (loweredCase) return utf8ToBytes(string).length // assume utf8
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}
	Buffer.byteLength = byteLength
	
	// pre-set for values that may exist in the future
	Buffer.prototype.length = undefined
	Buffer.prototype.parent = undefined
	
	function slowToString (encoding, start, end) {
	  var loweredCase = false
	
	  start = start | 0
	  end = end === undefined || end === Infinity ? this.length : end | 0
	
	  if (!encoding) encoding = 'utf8'
	  if (start < 0) start = 0
	  if (end > this.length) end = this.length
	  if (end <= start) return ''
	
	  while (true) {
	    switch (encoding) {
	      case 'hex':
	        return hexSlice(this, start, end)
	
	      case 'utf8':
	      case 'utf-8':
	        return utf8Slice(this, start, end)
	
	      case 'ascii':
	        return asciiSlice(this, start, end)
	
	      case 'binary':
	        return binarySlice(this, start, end)
	
	      case 'base64':
	        return base64Slice(this, start, end)
	
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return utf16leSlice(this, start, end)
	
	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = (encoding + '').toLowerCase()
	        loweredCase = true
	    }
	  }
	}
	
	Buffer.prototype.toString = function toString () {
	  var length = this.length | 0
	  if (length === 0) return ''
	  if (arguments.length === 0) return utf8Slice(this, 0, length)
	  return slowToString.apply(this, arguments)
	}
	
	Buffer.prototype.equals = function equals (b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return true
	  return Buffer.compare(this, b) === 0
	}
	
	Buffer.prototype.inspect = function inspect () {
	  var str = ''
	  var max = exports.INSPECT_MAX_BYTES
	  if (this.length > 0) {
	    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
	    if (this.length > max) str += ' ... '
	  }
	  return '<Buffer ' + str + '>'
	}
	
	Buffer.prototype.compare = function compare (b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return 0
	  return Buffer.compare(this, b)
	}
	
	Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
	  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
	  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
	  byteOffset >>= 0
	
	  if (this.length === 0) return -1
	  if (byteOffset >= this.length) return -1
	
	  // Negative offsets start from the end of the buffer
	  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)
	
	  if (typeof val === 'string') {
	    if (val.length === 0) return -1 // special case: looking for empty string always fails
	    return String.prototype.indexOf.call(this, val, byteOffset)
	  }
	  if (Buffer.isBuffer(val)) {
	    return arrayIndexOf(this, val, byteOffset)
	  }
	  if (typeof val === 'number') {
	    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
	      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
	    }
	    return arrayIndexOf(this, [ val ], byteOffset)
	  }
	
	  function arrayIndexOf (arr, val, byteOffset) {
	    var foundIndex = -1
	    for (var i = 0; byteOffset + i < arr.length; i++) {
	      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
	        if (foundIndex === -1) foundIndex = i
	        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
	      } else {
	        foundIndex = -1
	      }
	    }
	    return -1
	  }
	
	  throw new TypeError('val must be string, number or Buffer')
	}
	
	// `get` is deprecated
	Buffer.prototype.get = function get (offset) {
	  console.log('.get() is deprecated. Access using array indexes instead.')
	  return this.readUInt8(offset)
	}
	
	// `set` is deprecated
	Buffer.prototype.set = function set (v, offset) {
	  console.log('.set() is deprecated. Access using array indexes instead.')
	  return this.writeUInt8(v, offset)
	}
	
	function hexWrite (buf, string, offset, length) {
	  offset = Number(offset) || 0
	  var remaining = buf.length - offset
	  if (!length) {
	    length = remaining
	  } else {
	    length = Number(length)
	    if (length > remaining) {
	      length = remaining
	    }
	  }
	
	  // must be an even number of digits
	  var strLen = string.length
	  if (strLen % 2 !== 0) throw new Error('Invalid hex string')
	
	  if (length > strLen / 2) {
	    length = strLen / 2
	  }
	  for (var i = 0; i < length; i++) {
	    var parsed = parseInt(string.substr(i * 2, 2), 16)
	    if (isNaN(parsed)) throw new Error('Invalid hex string')
	    buf[offset + i] = parsed
	  }
	  return i
	}
	
	function utf8Write (buf, string, offset, length) {
	  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
	}
	
	function asciiWrite (buf, string, offset, length) {
	  return blitBuffer(asciiToBytes(string), buf, offset, length)
	}
	
	function binaryWrite (buf, string, offset, length) {
	  return asciiWrite(buf, string, offset, length)
	}
	
	function base64Write (buf, string, offset, length) {
	  return blitBuffer(base64ToBytes(string), buf, offset, length)
	}
	
	function ucs2Write (buf, string, offset, length) {
	  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
	}
	
	Buffer.prototype.write = function write (string, offset, length, encoding) {
	  // Buffer#write(string)
	  if (offset === undefined) {
	    encoding = 'utf8'
	    length = this.length
	    offset = 0
	  // Buffer#write(string, encoding)
	  } else if (length === undefined && typeof offset === 'string') {
	    encoding = offset
	    length = this.length
	    offset = 0
	  // Buffer#write(string, offset[, length][, encoding])
	  } else if (isFinite(offset)) {
	    offset = offset | 0
	    if (isFinite(length)) {
	      length = length | 0
	      if (encoding === undefined) encoding = 'utf8'
	    } else {
	      encoding = length
	      length = undefined
	    }
	  // legacy write(string, encoding, offset, length) - remove in v0.13
	  } else {
	    var swap = encoding
	    encoding = offset
	    offset = length | 0
	    length = swap
	  }
	
	  var remaining = this.length - offset
	  if (length === undefined || length > remaining) length = remaining
	
	  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
	    throw new RangeError('attempt to write outside buffer bounds')
	  }
	
	  if (!encoding) encoding = 'utf8'
	
	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'hex':
	        return hexWrite(this, string, offset, length)
	
	      case 'utf8':
	      case 'utf-8':
	        return utf8Write(this, string, offset, length)
	
	      case 'ascii':
	        return asciiWrite(this, string, offset, length)
	
	      case 'binary':
	        return binaryWrite(this, string, offset, length)
	
	      case 'base64':
	        // Warning: maxLength not taken into account in base64Write
	        return base64Write(this, string, offset, length)
	
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return ucs2Write(this, string, offset, length)
	
	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}
	
	Buffer.prototype.toJSON = function toJSON () {
	  return {
	    type: 'Buffer',
	    data: Array.prototype.slice.call(this._arr || this, 0)
	  }
	}
	
	function base64Slice (buf, start, end) {
	  if (start === 0 && end === buf.length) {
	    return base64.fromByteArray(buf)
	  } else {
	    return base64.fromByteArray(buf.slice(start, end))
	  }
	}
	
	function utf8Slice (buf, start, end) {
	  end = Math.min(buf.length, end)
	  var res = []
	
	  var i = start
	  while (i < end) {
	    var firstByte = buf[i]
	    var codePoint = null
	    var bytesPerSequence = (firstByte > 0xEF) ? 4
	      : (firstByte > 0xDF) ? 3
	      : (firstByte > 0xBF) ? 2
	      : 1
	
	    if (i + bytesPerSequence <= end) {
	      var secondByte, thirdByte, fourthByte, tempCodePoint
	
	      switch (bytesPerSequence) {
	        case 1:
	          if (firstByte < 0x80) {
	            codePoint = firstByte
	          }
	          break
	        case 2:
	          secondByte = buf[i + 1]
	          if ((secondByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
	            if (tempCodePoint > 0x7F) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 3:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
	            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 4:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          fourthByte = buf[i + 3]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
	            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
	              codePoint = tempCodePoint
	            }
	          }
	      }
	    }
	
	    if (codePoint === null) {
	      // we did not generate a valid codePoint so insert a
	      // replacement char (U+FFFD) and advance only 1 byte
	      codePoint = 0xFFFD
	      bytesPerSequence = 1
	    } else if (codePoint > 0xFFFF) {
	      // encode to utf16 (surrogate pair dance)
	      codePoint -= 0x10000
	      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
	      codePoint = 0xDC00 | codePoint & 0x3FF
	    }
	
	    res.push(codePoint)
	    i += bytesPerSequence
	  }
	
	  return decodeCodePointsArray(res)
	}
	
	// Based on http://stackoverflow.com/a/22747272/680742, the browser with
	// the lowest limit is Chrome, with 0x10000 args.
	// We go 1 magnitude less, for safety
	var MAX_ARGUMENTS_LENGTH = 0x1000
	
	function decodeCodePointsArray (codePoints) {
	  var len = codePoints.length
	  if (len <= MAX_ARGUMENTS_LENGTH) {
	    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
	  }
	
	  // Decode in chunks to avoid "call stack size exceeded".
	  var res = ''
	  var i = 0
	  while (i < len) {
	    res += String.fromCharCode.apply(
	      String,
	      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
	    )
	  }
	  return res
	}
	
	function asciiSlice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)
	
	  for (var i = start; i < end; i++) {
	    ret += String.fromCharCode(buf[i] & 0x7F)
	  }
	  return ret
	}
	
	function binarySlice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)
	
	  for (var i = start; i < end; i++) {
	    ret += String.fromCharCode(buf[i])
	  }
	  return ret
	}
	
	function hexSlice (buf, start, end) {
	  var len = buf.length
	
	  if (!start || start < 0) start = 0
	  if (!end || end < 0 || end > len) end = len
	
	  var out = ''
	  for (var i = start; i < end; i++) {
	    out += toHex(buf[i])
	  }
	  return out
	}
	
	function utf16leSlice (buf, start, end) {
	  var bytes = buf.slice(start, end)
	  var res = ''
	  for (var i = 0; i < bytes.length; i += 2) {
	    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
	  }
	  return res
	}
	
	Buffer.prototype.slice = function slice (start, end) {
	  var len = this.length
	  start = ~~start
	  end = end === undefined ? len : ~~end
	
	  if (start < 0) {
	    start += len
	    if (start < 0) start = 0
	  } else if (start > len) {
	    start = len
	  }
	
	  if (end < 0) {
	    end += len
	    if (end < 0) end = 0
	  } else if (end > len) {
	    end = len
	  }
	
	  if (end < start) end = start
	
	  var newBuf
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    newBuf = Buffer._augment(this.subarray(start, end))
	  } else {
	    var sliceLen = end - start
	    newBuf = new Buffer(sliceLen, undefined)
	    for (var i = 0; i < sliceLen; i++) {
	      newBuf[i] = this[i + start]
	    }
	  }
	
	  if (newBuf.length) newBuf.parent = this.parent || this
	
	  return newBuf
	}
	
	/*
	 * Need to make sure that buffer isn't trying to write out of bounds.
	 */
	function checkOffset (offset, ext, length) {
	  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
	  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
	}
	
	Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)
	
	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }
	
	  return val
	}
	
	Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) {
	    checkOffset(offset, byteLength, this.length)
	  }
	
	  var val = this[offset + --byteLength]
	  var mul = 1
	  while (byteLength > 0 && (mul *= 0x100)) {
	    val += this[offset + --byteLength] * mul
	  }
	
	  return val
	}
	
	Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  return this[offset]
	}
	
	Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return this[offset] | (this[offset + 1] << 8)
	}
	
	Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return (this[offset] << 8) | this[offset + 1]
	}
	
	Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	
	  return ((this[offset]) |
	      (this[offset + 1] << 8) |
	      (this[offset + 2] << 16)) +
	      (this[offset + 3] * 0x1000000)
	}
	
	Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	
	  return (this[offset] * 0x1000000) +
	    ((this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    this[offset + 3])
	}
	
	Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)
	
	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }
	  mul *= 0x80
	
	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)
	
	  return val
	}
	
	Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)
	
	  var i = byteLength
	  var mul = 1
	  var val = this[offset + --i]
	  while (i > 0 && (mul *= 0x100)) {
	    val += this[offset + --i] * mul
	  }
	  mul *= 0x80
	
	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)
	
	  return val
	}
	
	Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  if (!(this[offset] & 0x80)) return (this[offset])
	  return ((0xff - this[offset] + 1) * -1)
	}
	
	Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset] | (this[offset + 1] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}
	
	Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset + 1] | (this[offset] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}
	
	Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	
	  return (this[offset]) |
	    (this[offset + 1] << 8) |
	    (this[offset + 2] << 16) |
	    (this[offset + 3] << 24)
	}
	
	Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	
	  return (this[offset] << 24) |
	    (this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    (this[offset + 3])
	}
	
	Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, true, 23, 4)
	}
	
	Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, false, 23, 4)
	}
	
	Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, true, 52, 8)
	}
	
	Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, false, 52, 8)
	}
	
	function checkInt (buf, value, offset, ext, max, min) {
	  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
	  if (value > max || value < min) throw new RangeError('value is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('index out of range')
	}
	
	Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)
	
	  var mul = 1
	  var i = 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }
	
	  return offset + byteLength
	}
	
	Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)
	
	  var i = byteLength - 1
	  var mul = 1
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }
	
	  return offset + byteLength
	}
	
	Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  this[offset] = (value & 0xff)
	  return offset + 1
	}
	
	function objectWriteUInt16 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
	    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
	      (littleEndian ? i : 1 - i) * 8
	  }
	}
	
	Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}
	
	Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = (value & 0xff)
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}
	
	function objectWriteUInt32 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffffffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
	    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
	  }
	}
	
	Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset + 3] = (value >>> 24)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 1] = (value >>> 8)
	    this[offset] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}
	
	Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}
	
	Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1)
	
	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }
	
	  var i = 0
	  var mul = 1
	  var sub = value < 0 ? 1 : 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }
	
	  return offset + byteLength
	}
	
	Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1)
	
	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }
	
	  var i = byteLength - 1
	  var mul = 1
	  var sub = value < 0 ? 1 : 0
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }
	
	  return offset + byteLength
	}
	
	Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  if (value < 0) value = 0xff + value + 1
	  this[offset] = (value & 0xff)
	  return offset + 1
	}
	
	Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}
	
	Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = (value & 0xff)
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}
	
	Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 3] = (value >>> 24)
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}
	
	Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (value < 0) value = 0xffffffff + value + 1
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}
	
	function checkIEEE754 (buf, value, offset, ext, max, min) {
	  if (value > max || value < min) throw new RangeError('value is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('index out of range')
	  if (offset < 0) throw new RangeError('index out of range')
	}
	
	function writeFloat (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 23, 4)
	  return offset + 4
	}
	
	Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, true, noAssert)
	}
	
	Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, false, noAssert)
	}
	
	function writeDouble (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 52, 8)
	  return offset + 8
	}
	
	Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, true, noAssert)
	}
	
	Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, false, noAssert)
	}
	
	// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
	Buffer.prototype.copy = function copy (target, targetStart, start, end) {
	  if (!start) start = 0
	  if (!end && end !== 0) end = this.length
	  if (targetStart >= target.length) targetStart = target.length
	  if (!targetStart) targetStart = 0
	  if (end > 0 && end < start) end = start
	
	  // Copy 0 bytes; we're done
	  if (end === start) return 0
	  if (target.length === 0 || this.length === 0) return 0
	
	  // Fatal error conditions
	  if (targetStart < 0) {
	    throw new RangeError('targetStart out of bounds')
	  }
	  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
	  if (end < 0) throw new RangeError('sourceEnd out of bounds')
	
	  // Are we oob?
	  if (end > this.length) end = this.length
	  if (target.length - targetStart < end - start) {
	    end = target.length - targetStart + start
	  }
	
	  var len = end - start
	  var i
	
	  if (this === target && start < targetStart && targetStart < end) {
	    // descending copy from end
	    for (i = len - 1; i >= 0; i--) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
	    // ascending copy from start
	    for (i = 0; i < len; i++) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else {
	    target._set(this.subarray(start, start + len), targetStart)
	  }
	
	  return len
	}
	
	// fill(value, start=0, end=buffer.length)
	Buffer.prototype.fill = function fill (value, start, end) {
	  if (!value) value = 0
	  if (!start) start = 0
	  if (!end) end = this.length
	
	  if (end < start) throw new RangeError('end < start')
	
	  // Fill 0 bytes; we're done
	  if (end === start) return
	  if (this.length === 0) return
	
	  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
	  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')
	
	  var i
	  if (typeof value === 'number') {
	    for (i = start; i < end; i++) {
	      this[i] = value
	    }
	  } else {
	    var bytes = utf8ToBytes(value.toString())
	    var len = bytes.length
	    for (i = start; i < end; i++) {
	      this[i] = bytes[i % len]
	    }
	  }
	
	  return this
	}
	
	/**
	 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
	 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
	 */
	Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
	  if (typeof Uint8Array !== 'undefined') {
	    if (Buffer.TYPED_ARRAY_SUPPORT) {
	      return (new Buffer(this)).buffer
	    } else {
	      var buf = new Uint8Array(this.length)
	      for (var i = 0, len = buf.length; i < len; i += 1) {
	        buf[i] = this[i]
	      }
	      return buf.buffer
	    }
	  } else {
	    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
	  }
	}
	
	// HELPER FUNCTIONS
	// ================
	
	var BP = Buffer.prototype
	
	/**
	 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
	 */
	Buffer._augment = function _augment (arr) {
	  arr.constructor = Buffer
	  arr._isBuffer = true
	
	  // save reference to original Uint8Array set method before overwriting
	  arr._set = arr.set
	
	  // deprecated
	  arr.get = BP.get
	  arr.set = BP.set
	
	  arr.write = BP.write
	  arr.toString = BP.toString
	  arr.toLocaleString = BP.toString
	  arr.toJSON = BP.toJSON
	  arr.equals = BP.equals
	  arr.compare = BP.compare
	  arr.indexOf = BP.indexOf
	  arr.copy = BP.copy
	  arr.slice = BP.slice
	  arr.readUIntLE = BP.readUIntLE
	  arr.readUIntBE = BP.readUIntBE
	  arr.readUInt8 = BP.readUInt8
	  arr.readUInt16LE = BP.readUInt16LE
	  arr.readUInt16BE = BP.readUInt16BE
	  arr.readUInt32LE = BP.readUInt32LE
	  arr.readUInt32BE = BP.readUInt32BE
	  arr.readIntLE = BP.readIntLE
	  arr.readIntBE = BP.readIntBE
	  arr.readInt8 = BP.readInt8
	  arr.readInt16LE = BP.readInt16LE
	  arr.readInt16BE = BP.readInt16BE
	  arr.readInt32LE = BP.readInt32LE
	  arr.readInt32BE = BP.readInt32BE
	  arr.readFloatLE = BP.readFloatLE
	  arr.readFloatBE = BP.readFloatBE
	  arr.readDoubleLE = BP.readDoubleLE
	  arr.readDoubleBE = BP.readDoubleBE
	  arr.writeUInt8 = BP.writeUInt8
	  arr.writeUIntLE = BP.writeUIntLE
	  arr.writeUIntBE = BP.writeUIntBE
	  arr.writeUInt16LE = BP.writeUInt16LE
	  arr.writeUInt16BE = BP.writeUInt16BE
	  arr.writeUInt32LE = BP.writeUInt32LE
	  arr.writeUInt32BE = BP.writeUInt32BE
	  arr.writeIntLE = BP.writeIntLE
	  arr.writeIntBE = BP.writeIntBE
	  arr.writeInt8 = BP.writeInt8
	  arr.writeInt16LE = BP.writeInt16LE
	  arr.writeInt16BE = BP.writeInt16BE
	  arr.writeInt32LE = BP.writeInt32LE
	  arr.writeInt32BE = BP.writeInt32BE
	  arr.writeFloatLE = BP.writeFloatLE
	  arr.writeFloatBE = BP.writeFloatBE
	  arr.writeDoubleLE = BP.writeDoubleLE
	  arr.writeDoubleBE = BP.writeDoubleBE
	  arr.fill = BP.fill
	  arr.inspect = BP.inspect
	  arr.toArrayBuffer = BP.toArrayBuffer
	
	  return arr
	}
	
	var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g
	
	function base64clean (str) {
	  // Node strips out invalid characters like \n and \t from the string, base64-js does not
	  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
	  // Node converts strings with length < 2 to ''
	  if (str.length < 2) return ''
	  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
	  while (str.length % 4 !== 0) {
	    str = str + '='
	  }
	  return str
	}
	
	function stringtrim (str) {
	  if (str.trim) return str.trim()
	  return str.replace(/^\s+|\s+$/g, '')
	}
	
	function toHex (n) {
	  if (n < 16) return '0' + n.toString(16)
	  return n.toString(16)
	}
	
	function utf8ToBytes (string, units) {
	  units = units || Infinity
	  var codePoint
	  var length = string.length
	  var leadSurrogate = null
	  var bytes = []
	
	  for (var i = 0; i < length; i++) {
	    codePoint = string.charCodeAt(i)
	
	    // is surrogate component
	    if (codePoint > 0xD7FF && codePoint < 0xE000) {
	      // last char was a lead
	      if (!leadSurrogate) {
	        // no lead yet
	        if (codePoint > 0xDBFF) {
	          // unexpected trail
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        } else if (i + 1 === length) {
	          // unpaired lead
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        }
	
	        // valid lead
	        leadSurrogate = codePoint
	
	        continue
	      }
	
	      // 2 leads in a row
	      if (codePoint < 0xDC00) {
	        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	        leadSurrogate = codePoint
	        continue
	      }
	
	      // valid surrogate pair
	      codePoint = leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000
	    } else if (leadSurrogate) {
	      // valid bmp char, but last char was a lead
	      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	    }
	
	    leadSurrogate = null
	
	    // encode utf8
	    if (codePoint < 0x80) {
	      if ((units -= 1) < 0) break
	      bytes.push(codePoint)
	    } else if (codePoint < 0x800) {
	      if ((units -= 2) < 0) break
	      bytes.push(
	        codePoint >> 0x6 | 0xC0,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x10000) {
	      if ((units -= 3) < 0) break
	      bytes.push(
	        codePoint >> 0xC | 0xE0,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x110000) {
	      if ((units -= 4) < 0) break
	      bytes.push(
	        codePoint >> 0x12 | 0xF0,
	        codePoint >> 0xC & 0x3F | 0x80,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else {
	      throw new Error('Invalid code point')
	    }
	  }
	
	  return bytes
	}
	
	function asciiToBytes (str) {
	  var byteArray = []
	  for (var i = 0; i < str.length; i++) {
	    // Node's code seems to be doing this and not & 0x7F..
	    byteArray.push(str.charCodeAt(i) & 0xFF)
	  }
	  return byteArray
	}
	
	function utf16leToBytes (str, units) {
	  var c, hi, lo
	  var byteArray = []
	  for (var i = 0; i < str.length; i++) {
	    if ((units -= 2) < 0) break
	
	    c = str.charCodeAt(i)
	    hi = c >> 8
	    lo = c % 256
	    byteArray.push(lo)
	    byteArray.push(hi)
	  }
	
	  return byteArray
	}
	
	function base64ToBytes (str) {
	  return base64.toByteArray(base64clean(str))
	}
	
	function blitBuffer (src, dst, offset, length) {
	  for (var i = 0; i < length; i++) {
	    if ((i + offset >= dst.length) || (i >= src.length)) break
	    dst[i + offset] = src[i]
	  }
	  return i
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(13).Buffer, (function() { return this; }())))

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	
	;(function (exports) {
		'use strict';
	
	  var Arr = (typeof Uint8Array !== 'undefined')
	    ? Uint8Array
	    : Array
	
		var PLUS   = '+'.charCodeAt(0)
		var SLASH  = '/'.charCodeAt(0)
		var NUMBER = '0'.charCodeAt(0)
		var LOWER  = 'a'.charCodeAt(0)
		var UPPER  = 'A'.charCodeAt(0)
		var PLUS_URL_SAFE = '-'.charCodeAt(0)
		var SLASH_URL_SAFE = '_'.charCodeAt(0)
	
		function decode (elt) {
			var code = elt.charCodeAt(0)
			if (code === PLUS ||
			    code === PLUS_URL_SAFE)
				return 62 // '+'
			if (code === SLASH ||
			    code === SLASH_URL_SAFE)
				return 63 // '/'
			if (code < NUMBER)
				return -1 //no match
			if (code < NUMBER + 10)
				return code - NUMBER + 26 + 26
			if (code < UPPER + 26)
				return code - UPPER
			if (code < LOWER + 26)
				return code - LOWER + 26
		}
	
		function b64ToByteArray (b64) {
			var i, j, l, tmp, placeHolders, arr
	
			if (b64.length % 4 > 0) {
				throw new Error('Invalid string. Length must be a multiple of 4')
			}
	
			// the number of equal signs (place holders)
			// if there are two placeholders, than the two characters before it
			// represent one byte
			// if there is only one, then the three characters before it represent 2 bytes
			// this is just a cheap hack to not do indexOf twice
			var len = b64.length
			placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0
	
			// base64 is 4/3 + up to two characters of the original data
			arr = new Arr(b64.length * 3 / 4 - placeHolders)
	
			// if there are placeholders, only get up to the last complete 4 chars
			l = placeHolders > 0 ? b64.length - 4 : b64.length
	
			var L = 0
	
			function push (v) {
				arr[L++] = v
			}
	
			for (i = 0, j = 0; i < l; i += 4, j += 3) {
				tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
				push((tmp & 0xFF0000) >> 16)
				push((tmp & 0xFF00) >> 8)
				push(tmp & 0xFF)
			}
	
			if (placeHolders === 2) {
				tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
				push(tmp & 0xFF)
			} else if (placeHolders === 1) {
				tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
				push((tmp >> 8) & 0xFF)
				push(tmp & 0xFF)
			}
	
			return arr
		}
	
		function uint8ToBase64 (uint8) {
			var i,
				extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
				output = "",
				temp, length
	
			function encode (num) {
				return lookup.charAt(num)
			}
	
			function tripletToBase64 (num) {
				return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
			}
	
			// go through the array every three bytes, we'll deal with trailing stuff later
			for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
				temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
				output += tripletToBase64(temp)
			}
	
			// pad the end with zeros, but make sure to not forget the extra bytes
			switch (extraBytes) {
				case 1:
					temp = uint8[uint8.length - 1]
					output += encode(temp >> 2)
					output += encode((temp << 4) & 0x3F)
					output += '=='
					break
				case 2:
					temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
					output += encode(temp >> 10)
					output += encode((temp >> 4) & 0x3F)
					output += encode((temp << 2) & 0x3F)
					output += '='
					break
			}
	
			return output
		}
	
		exports.toByteArray = b64ToByteArray
		exports.fromByteArray = uint8ToBase64
	}( false ? (this.base64js = {}) : exports))


/***/ },
/* 15 */
/***/ function(module, exports) {

	exports.read = function (buffer, offset, isLE, mLen, nBytes) {
	  var e, m
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var nBits = -7
	  var i = isLE ? (nBytes - 1) : 0
	  var d = isLE ? -1 : 1
	  var s = buffer[offset + i]
	
	  i += d
	
	  e = s & ((1 << (-nBits)) - 1)
	  s >>= (-nBits)
	  nBits += eLen
	  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}
	
	  m = e & ((1 << (-nBits)) - 1)
	  e >>= (-nBits)
	  nBits += mLen
	  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}
	
	  if (e === 0) {
	    e = 1 - eBias
	  } else if (e === eMax) {
	    return m ? NaN : ((s ? -1 : 1) * Infinity)
	  } else {
	    m = m + Math.pow(2, mLen)
	    e = e - eBias
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
	}
	
	exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
	  var i = isLE ? 0 : (nBytes - 1)
	  var d = isLE ? 1 : -1
	  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0
	
	  value = Math.abs(value)
	
	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0
	    e = eMax
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2)
	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--
	      c *= 2
	    }
	    if (e + eBias >= 1) {
	      value += rt / c
	    } else {
	      value += rt * Math.pow(2, 1 - eBias)
	    }
	    if (value * c >= 2) {
	      e++
	      c /= 2
	    }
	
	    if (e + eBias >= eMax) {
	      m = 0
	      e = eMax
	    } else if (e + eBias >= 1) {
	      m = (value * c - 1) * Math.pow(2, mLen)
	      e = e + eBias
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
	      e = 0
	    }
	  }
	
	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}
	
	  e = (e << mLen) | m
	  eLen += mLen
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}
	
	  buffer[offset + i - d] |= s * 128
	}


/***/ },
/* 16 */
/***/ function(module, exports) {

	
	/**
	 * isArray
	 */
	
	var isArray = Array.isArray;
	
	/**
	 * toString
	 */
	
	var str = Object.prototype.toString;
	
	/**
	 * Whether or not the given `val`
	 * is an array.
	 *
	 * example:
	 *
	 *        isArray([]);
	 *        // > true
	 *        isArray(arguments);
	 *        // > false
	 *        isArray('');
	 *        // > false
	 *
	 * @param {mixed} val
	 * @return {bool}
	 */
	
	module.exports = isArray || function (val) {
	  return !! val && '[object Array]' == str.call(val);
	};


/***/ },
/* 17 */
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
/* 18 */
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