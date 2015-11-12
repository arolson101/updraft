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
	var Query_ = __webpack_require__(6);
	var Store_ = __webpack_require__(7);
	var Table_ = __webpack_require__(8);
	var SQLiteWrapper_ = __webpack_require__(9);
	var WebsqlWrapper_ = __webpack_require__(10);
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
	//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOlsiVXBkcmFmdCJdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsSUFBWSxPQUFPLFdBQU0sVUFBVSxDQUFDLENBQUE7QUFFcEMsSUFBWSxPQUFPLFdBQU0sVUFBVSxDQUFDLENBQUE7QUFDcEMsSUFBWSxNQUFNLFdBQU0sU0FBUyxDQUFDLENBQUE7QUFDbEMsSUFBWSxNQUFNLFdBQU0sU0FBUyxDQUFDLENBQUE7QUFDbEMsSUFBWSxNQUFNLFdBQU0sU0FBUyxDQUFDLENBQUE7QUFDbEMsSUFBWSxjQUFjLFdBQU0saUJBQWlCLENBQUMsQ0FBQTtBQUNsRCxJQUFZLGNBQWMsV0FBTSxpQkFBaUIsQ0FBQyxDQUFBO0FBRWxELElBQWlCLE9BQU8sQ0F5QnZCO0FBekJELFdBQWlCLE9BQU8sRUFBQyxDQUFDO0lBQ1hBLGFBQUtBLEdBQUdBLE1BQU1BLENBQUNBO0lBQ2ZBLGNBQU1BLEdBQUdBLE9BQU9BLENBQUNBO0lBRWpCQSxrQkFBVUEsR0FBR0EsT0FBT0EsQ0FBQ0EsVUFBVUEsQ0FBQ0E7SUFDaENBLGNBQU1BLEdBQUdBLE9BQU9BLENBQUNBLE1BQU1BLENBQUNBO0lBUXhCQSxlQUFPQSxHQUFHQSxNQUFNQSxDQUFDQSxPQUFPQSxDQUFDQTtJQUN6QkEsYUFBS0EsR0FBR0EsTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQ0E7SUFJckJBLGFBQUtBLEdBQUdBLE1BQU1BLENBQUNBLEtBQUtBLENBQUNBO0lBQ3JCQSxtQkFBV0EsR0FBR0EsTUFBTUEsQ0FBQ0EsV0FBV0EsQ0FBQ0E7SUFFakNBLGNBQU1BLEdBQUdBLE9BQU9BLENBQUNBLE1BQU1BLENBQUNBO0lBRXhCQSxlQUFPQSxHQUFHQSxjQUFjQSxDQUFDQSxPQUFPQSxDQUFDQTtJQUNqQ0Esa0JBQVVBLEdBQUdBLGNBQWNBLENBQUNBLFVBQVVBLENBQUNBO0FBQ3REQSxDQUFDQSxFQXpCZ0IsT0FBTyxHQUFQLGVBQU8sS0FBUCxlQUFPLFFBeUJ2QjtBQVFEO2tCQUFlLE9BQU8sQ0FBQyJ9

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Text_1 = __webpack_require__(2);
	var verify_1 = __webpack_require__(3);
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
	    ColumnType[ColumnType["set"] = 9] = "set";
	})(exports.ColumnType || (exports.ColumnType = {}));
	var ColumnType = exports.ColumnType;
	/**
	 * Column in db.  Use static methods to create columns.
	 */
	var Column = (function () {
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
	        this.defaultValue = value;
	        return this;
	    };
	    Column.prototype.deserialize = function (value) {
	        switch (this.type) {
	            case ColumnType.int:
	            case ColumnType.real:
	            case ColumnType.text:
	                return value;
	            case ColumnType.bool:
	                return value ? true : false;
	            case ColumnType.json:
	                return Text_1.fromText(value);
	            case ColumnType.enum:
	                if (typeof this.enum.get === "function") {
	                    return this.enum.get(value);
	                }
	                verify_1.verify(value in this.enum, "enum value %s not in %s", value, this.enum);
	                return this.enum[value];
	            case ColumnType.date:
	            case ColumnType.datetime:
	                verify_1.verify(!value || parseFloat(value) == value, "expected date to be stored as a number: %s", value);
	                return value ? new Date(parseFloat(value) * 1000) : undefined;
	            default:
	                throw new Error("unsupported column type " + ColumnType[this.type]);
	        }
	    };
	    Column.prototype.serialize = function (value) {
	        switch (this.type) {
	            case ColumnType.int:
	            case ColumnType.real:
	            case ColumnType.text:
	                return value;
	            case ColumnType.bool:
	                return value ? 1 : 0;
	            case ColumnType.json:
	                return Text_1.toText(value);
	            case ColumnType.enum:
	                if (typeof value === "string" || typeof value === undefined || value === null) {
	                    return value;
	                }
	                else if (typeof value === "number") {
	                    verify_1.verify(value in this.enum, "enum doesn't contain %s", value);
	                    return this.enum[value];
	                }
	                verify_1.verify(typeof value.toString === "function", "expected an enum value supporting toString(); got %s", value);
	                return value.toString();
	            case ColumnType.date:
	            case ColumnType.datetime:
	                verify_1.verify(value == undefined || value instanceof Date, "expected a date, got %s", value);
	                var date = (value == undefined) ? null : (value.getTime() / 1000);
	                return date;
	            default:
	                throw new Error("unsupported column type " + ColumnType[this.type]);
	        }
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
	    /** a typescript enum or javascript object with instance method "toString" and class method "get" (e.g. {@link https://github.com/adrai/enum}). */
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
	    /** unordered collection */
	    Column.Set = function (type) {
	        var c = new Column(ColumnType.set);
	        c.elementType = type;
	        return c;
	    };
	    Column.sql = function (val) {
	        var stmt = "";
	        switch (val.type) {
	            case ColumnType.int:
	                stmt = "INTEGER";
	                break;
	            case ColumnType.bool:
	                stmt = "BOOLEAN NOT NULL";
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
	            case ColumnType.enum:
	                stmt = "CHARACTER(20)";
	                break;
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
	                throw new Error("unsupported type " + ColumnType[val.type]);
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
	            };
	            stmt += " DEFAULT " + escape(val.serialize(val.defaultValue));
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
	            case "CHARACTER(20)":
	                col = new Column(ColumnType.enum);
	                break;
	            case "DATE":
	                col = Column.Date();
	                break;
	            case "DATETIME":
	                col = Column.DateTime();
	                break;
	            default:
	                throw new Error("unsupported type: " + ColumnType[parts[0]]);
	        }
	        var match = text.match(/DEFAULT\s+'((?:[^']|'')*)'/i);
	        if (match) {
	            var val = match[1].replace(/''/g, "'");
	            col.Default(val);
	        }
	        else {
	            match = text.match(/DEFAULT\s+(\S+)/i);
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
	//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29sdW1uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL0NvbHVtbi50cyJdLCJuYW1lcyI6WyJDb2x1bW5UeXBlIiwiQ29sdW1uIiwiQ29sdW1uLmNvbnN0cnVjdG9yIiwiQ29sdW1uLktleSIsIkNvbHVtbi5JbmRleCIsIkNvbHVtbi5EZWZhdWx0IiwiQ29sdW1uLmRlc2VyaWFsaXplIiwiQ29sdW1uLnNlcmlhbGl6ZSIsIkNvbHVtbi5JbnQiLCJDb2x1bW4uUmVhbCIsIkNvbHVtbi5Cb29sIiwiQ29sdW1uLlRleHQiLCJDb2x1bW4uU3RyaW5nIiwiQ29sdW1uLkJsb2IiLCJDb2x1bW4uRW51bSIsIkNvbHVtbi5EYXRlIiwiQ29sdW1uLkRhdGVUaW1lIiwiQ29sdW1uLkpTT04iLCJDb2x1bW4uU2V0IiwiQ29sdW1uLnNxbCIsIkNvbHVtbi5mcm9tU3FsIiwiQ29sdW1uLmVxdWFsIl0sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixxQkFBaUMsUUFBUSxDQUFDLENBQUE7QUFDMUMsdUJBQXVCLFVBQVUsQ0FBQyxDQUFBO0FBR2xDLFdBQVksVUFBVTtJQUNyQkEseUNBQUdBLENBQUFBO0lBQ0hBLDJDQUFJQSxDQUFBQTtJQUNKQSwyQ0FBSUEsQ0FBQUE7SUFDSkEsMkNBQUlBLENBQUFBO0lBQ0pBLDJDQUFJQSxDQUFBQTtJQUNKQSwyQ0FBSUEsQ0FBQUE7SUFDSkEsMkNBQUlBLENBQUFBO0lBQ0pBLG1EQUFRQSxDQUFBQTtJQUNSQSwyQ0FBSUEsQ0FBQUE7SUFDSkEseUNBQUdBLENBQUFBO0FBQ0pBLENBQUNBLEVBWFcsa0JBQVUsS0FBVixrQkFBVSxRQVdyQjtBQVhELElBQVksVUFBVSxHQUFWLGtCQVdYLENBQUE7QUFrQkQ7O0dBRUc7QUFDSDtJQVNDQyxnQkFBWUEsSUFBZ0JBO1FBQzNCQyxJQUFJQSxDQUFDQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQTtRQUNqQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsSUFBSUEs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QUFNQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNsQkEsS0FBS0EsU0FBU0E7Z0JBQ2JBLEdBQUdBLEdBQUdBLE1BQU1BLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBO2dCQUNuQkEsS0FBS0EsQ0FBQ0E7WUFDUEEsS0FBS0EsU0FBU0E7Z0JBQ2JBLEdBQUdBLEdBQUdBLE1BQU1BLENBQUNBLElBQUlBLEVBQUVBLENBQUNBO2dCQUNwQkEsS0FBS0EsQ0FBQ0E7WUFDUEEsS0FBS0EsTUFBTUE7Z0JBQ1ZBLEdBQUdBLEdBQUdBLE1BQU1BLENBQUNBLElBQUlBLEVBQUVBLENBQUNBO2dCQUNwQkEsS0FBS0EsQ0FBQ0E7WUFDUEEsS0FBS0EsTUFBTUE7Z0JBQ1ZBLEdBQUdBLEdBQUdBLE1BQU1BLENBQUNBLElBQUlBLEVBQUVBLENBQUNBO2dCQUNwQkEsS0FBS0EsQ0FBQ0E7WUFDUEEsS0FBS0EsTUFBTUE7Z0JBQ1ZBLEdBQUdBLEdBQUdBLE1BQU1BLENBQUNBLElBQUlBLEVBQUVBLENBQUNBO2dCQUNwQkEsS0FBS0EsQ0FBQ0E7WUFDUEEsS0FBS0EsZUFBZUE7Z0JBQ25CQSxHQUFHQSxHQUFHQSxJQUFJQSxNQUFNQSxDQUFDQSxVQUFVQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtnQkFDbENBLEtBQUtBLENBQUNBO1lBQ1BBLEtBQUtBLE1BQU1BO2dCQUNWQSxHQUFHQSxHQUFHQSxNQUFNQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQTtnQkFDcEJBLEtBQUtBLENBQUNBO1lBQ1BBLEtBQUtBLFVBQVVBO2dCQUNkQSxHQUFHQSxHQUFHQSxNQUFNQSxDQUFDQSxRQUFRQSxFQUFFQSxDQUFDQTtnQkFDeEJBLEtBQUtBLENBQUNBO1lBQ1BBO2dCQUNDQSxNQUFNQSxJQUFJQSxLQUFLQSxDQUFDQSxvQkFBb0JBLEdBQUdBLFVBQVVBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1FBQy9EQSxDQUFDQTtRQUVEQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSw2QkFBNkJBLENBQUNBLENBQUNBO1FBQ3REQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNYQSxJQUFJQSxHQUFHQSxHQUFRQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxLQUFLQSxFQUFFQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUM1Q0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7UUFDbEJBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLENBQUNBO1lBQ0xBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLGtCQUFrQkEsQ0FBQ0EsQ0FBQ0E7WUFDdkNBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO2dCQUNYQSxJQUFJQSxHQUFHQSxHQUFRQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDeEJBLElBQUlBLE1BQU1BLEdBQUdBLFFBQVFBLENBQUNBLEdBQUdBLEVBQUVBLEVBQUVBLENBQUNBLENBQUNBO2dCQUMvQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ25CQSxHQUFHQSxHQUFHQSxNQUFNQSxDQUFDQTtnQkFDZEEsQ0FBQ0E7Z0JBQ0RBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ2xCQSxDQUFDQTtRQUNGQSxDQUFDQTtRQUVEQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQTtJQUNaQSxDQUFDQTtJQUVNbkIsWUFBS0EsR0FBWkEsVUFBYUEsQ0FBU0EsRUFBRUEsQ0FBU0E7UUFDaENvQixFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN0QkEsTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQ0E7UUFDZEEsQ0FBQ0E7UUFDREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsWUFBWUEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsWUFBWUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsWUFBWUEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsWUFBWUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDOUVBLE1BQU1BLENBQUNBLEtBQUtBLENBQUNBO1FBQ2RBLENBQUNBO1FBQ0RBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLEtBQUtBLElBQUlBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEtBQUtBLElBQUlBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ2xEQSxNQUFNQSxDQUFDQSxLQUFLQSxDQUFDQTtRQUNkQSxDQUFDQTtRQUNEQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNiQSxDQUFDQTtJQUNGcEIsYUFBQ0E7QUFBREEsQ0FBQ0EsQUEzUkQsSUEyUkM7QUEzUlksY0FBTSxTQTJSbEIsQ0FBQSJ9

/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";
	function reviver(key, value) {
	    if (typeof value === "string") {
	        var regexp = /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ$/.exec(value);
	        if (regexp) {
	            return new Date(value);
	        }
	    }
	    return value;
	}
	function toText(o) {
	    return JSON.stringify(o);
	}
	exports.toText = toText;
	function fromText(text) {
	    return JSON.parse(text, reviver);
	}
	exports.fromText = fromText;
	//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGV4dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9UZXh0LnRzIl0sIm5hbWVzIjpbInJldml2ZXIiLCJ0b1RleHQiLCJmcm9tVGV4dCJdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsaUJBQWlCLEdBQVcsRUFBRSxLQUFVO0lBQ3RDQSxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxLQUFLQSxLQUFLQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUM5QkEsSUFBSUEsTUFBTUEsR0FBR0EsNkNBQTZDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtRQUN2RUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDWEEsTUFBTUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7UUFDekJBLENBQUNBO0lBQ0hBLENBQUNBO0lBQ0RBLE1BQU1BLENBQUNBLEtBQUtBLENBQUNBO0FBQ2ZBLENBQUNBO0FBRUQsZ0JBQXVCLENBQU07SUFDNUJDLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO0FBQzFCQSxDQUFDQTtBQUZlLGNBQU0sU0FFckIsQ0FBQTtBQUVELGtCQUF5QixJQUFZO0lBQ3BDQyxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxJQUFJQSxFQUFFQSxPQUFPQSxDQUFDQSxDQUFDQTtBQUNsQ0EsQ0FBQ0E7QUFGZSxnQkFBUSxXQUV2QixDQUFBIn0=

/***/ },
/* 3 */
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
	//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyaWZ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3ZlcmlmeS50cyJdLCJuYW1lcyI6WyJtYWtlUHJpbnRhYmxlIiwidmVyaWZ5Il0sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYjs7Ozs7O0dBTUc7QUFFSCx1QkFBdUIsQ0FBTTtJQUMzQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsT0FBT0EsQ0FBQ0EsS0FBS0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDckRBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO0lBQzNCQSxDQUFDQTtJQUNEQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNKQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQTtJQUNYQSxDQUFDQTtBQUNIQSxDQUFDQTtBQUVELGdCQUF1QixTQUFjLEVBQUUsTUFBYztJQUFFQyxjQUFjQTtTQUFkQSxXQUFjQSxDQUFkQSxzQkFBY0EsQ0FBZEEsSUFBY0E7UUFBZEEsNkJBQWNBOztJQUNuRUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDZkEsSUFBSUEsUUFBUUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7UUFDakJBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQ25CQSxNQUFNQSxDQUFDQSxPQUFPQSxDQUFDQSxLQUFLQSxFQUFFQSxjQUFhLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQ0EsQ0FDOUVBLENBQUNBO1FBRUlBLEtBQU1BLENBQUNBLFdBQVdBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLHlDQUF5Q0E7UUFDdkVBLE1BQU1BLEtBQUtBLENBQUNBO0lBQ2RBLENBQUNBO0FBQ0hBLENBQUNBO0FBVmUsY0FBTSxTQVVyQixDQUFBIn0=

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	// written to React"s immutability helpers spec
	// see https://facebook.github.io/react/docs/update.html
	///<reference path="../typings/tsd.d.ts"/>
	"use strict";
	var assign_1 = __webpack_require__(5);
	var verify_1 = __webpack_require__(3);
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
	    else if (a instanceof Date && b instanceof Date) {
	        return a.getTime() == b.getTime();
	    }
	    else if (typeof a == "object" && typeof b == "object") {
	        var akeys = Object.keys(a);
	        var bkeys = Object.keys(b);
	        if (akeys.length == bkeys.length) {
	            for (var _i = 0, akeys_1 = akeys; _i < akeys_1.length; _i++) {
	                var key = akeys_1[_i];
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
	    return a !== b;
	}
	exports.isMutated = isMutated;
	//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXV0YXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL011dGF0ZS50cyJdLCJuYW1lcyI6WyJzaGFsbG93Q29weSIsInNoYWxsb3dFcXVhbCIsImtleU9mIiwidmVyaWZ5QXJyYXlDYXNlIiwidmVyaWZ5U2V0Q2FzZSIsIm11dGF0ZSIsImlzTXV0YXRlZCJdLCJtYXBwaW5ncyI6IkFBQUEsK0NBQStDO0FBQy9DLHdEQUF3RDtBQUV4RCwwQ0FBMEM7QUFDMUMsWUFBWSxDQUFDO0FBRWIsdUJBQXVCLFVBQVUsQ0FBQyxDQUFBO0FBQ2xDLHVCQUF1QixVQUFVLENBQUMsQ0FBQTtBQStEbEMscUJBQStCLENBQUk7SUFDakNBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFPQSxDQUFFQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQTtJQUMzQkEsQ0FBQ0E7SUFDREEsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsWUFBWUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDMUJBLE1BQU1BLENBQU1BLElBQUlBLEdBQUdBLENBQVNBLENBQUNBLENBQUNBLENBQUNBO0lBQ2pDQSxDQUFDQTtJQUNEQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxPQUFPQSxDQUFDQSxLQUFLQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUNwQ0EsTUFBTUEsQ0FBQ0EsZUFBTUEsQ0FBQ0EsSUFBVUEsQ0FBRUEsQ0FBQ0EsV0FBV0EsRUFBRUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFDL0NBLENBQUNBO0lBQ0RBLElBQUlBLENBQUNBLENBQUNBO1FBQ0pBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBO0lBQ1hBLENBQUNBO0FBQ0hBLENBQUNBO0FBYmUsbUJBQVcsY0FhMUIsQ0FBQTtBQUVELHNCQUF5QixDQUFJLEVBQUUsQ0FBSTtJQUNqQ0MsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDekNBLElBQUlBLEVBQUVBLEdBQWVBLENBQUNBLENBQUNBO1FBQ3ZCQSxJQUFJQSxFQUFFQSxHQUFlQSxDQUFDQSxDQUFDQTtRQUN2QkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsTUFBTUEsSUFBSUEsRUFBRUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDM0JBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUNuQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ25CQSxNQUFNQSxDQUFDQSxLQUFLQSxDQUFDQTtnQkFDZkEsQ0FBQ0E7WUFDSEEsQ0FBQ0E7WUFDREEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7UUFDZEEsQ0FBQ0E7UUFDREEsTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQ0E7SUFDZkEsQ0FBQ0E7SUFDREEsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsWUFBWUEsR0FBR0EsSUFBSUEsQ0FBQ0EsWUFBWUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDOUNBLElBQUlBLEVBQUVBLEdBQWtCQSxDQUFDQSxDQUFDQTtRQUMxQkEsSUFBSUEsRUFBRUEsR0FBa0JBLENBQUNBLENBQUNBO1FBQzFCQSxFQUFFQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxJQUFJQSxJQUFJQSxFQUFFQSxDQUFDQSxJQUFJQSxD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

/***/ },
/* 5 */
/***/ function(module, exports) {

	"use strict";
	/* istanbul ignore next */
	function toObject(val) {
	    if (val === null || val === undefined) {
	        throw new TypeError("Object.assign cannot be called with null or undefined");
	    }
	    return Object(val);
	}
	/* istanbul ignore next */
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
	//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzaWduLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2Fzc2lnbi50cyJdLCJuYW1lcyI6WyJ0b09iamVjdCJdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsMEJBQTBCO0FBQzFCLGtCQUFrQixHQUFRO0lBQ3pCQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxJQUFJQSxJQUFJQSxHQUFHQSxLQUFLQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUN2Q0EsTUFBTUEsSUFBSUEsU0FBU0EsQ0FBQ0EsdURBQXVEQSxDQUFDQSxDQUFDQTtJQUM5RUEsQ0FBQ0E7SUFFREEsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7QUFDcEJBLENBQUNBO0FBRUQsMEJBQTBCO0FBQzFCLElBQUksWUFBWSxHQUFTLE1BQU8sQ0FBQyxNQUFNLElBQUksVUFBVSxNQUFjLEVBQUUsTUFBYztJQUNsRixJQUFNLGNBQWMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQztJQUN2RCxJQUFNLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUM7SUFDL0QsSUFBSSxJQUFZLENBQUM7SUFDakIsSUFBSSxFQUFFLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzFCLElBQUksT0FBYyxDQUFDO0lBRW5CLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDM0MsSUFBSSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUU1QixHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDdEIsRUFBRSxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3JCLENBQUM7UUFDRixDQUFDO1FBRUQsRUFBRSxDQUFDLENBQU8sTUFBTyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztZQUN6QyxPQUFPLEdBQVMsTUFBTyxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BELEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3pDLEVBQUUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM3QyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuQyxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7SUFDRixDQUFDO0lBRUQsTUFBTSxDQUFDLEVBQUUsQ0FBQztBQUNYLENBQUMsQ0FBQztBQUVTLGNBQU0sR0FBRyxZQUFZLENBQUMifQ==

/***/ },
/* 6 */
/***/ function(module, exports) {

	"use strict";
	//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvUXVlcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDIn0=

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Mutate_1 = __webpack_require__(4);
	var Column_1 = __webpack_require__(1);
	var Table_1 = __webpack_require__(8);
	var Text_1 = __webpack_require__(2);
	var assign_1 = __webpack_require__(5);
	var verify_1 = __webpack_require__(3);
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
	internalColumn[internal_column_time] = Column_1.Column.Int().Key();
	internalColumn[internal_column_latest] = Column_1.Column.Bool();
	internalColumn[internal_column_composed] = Column_1.Column.Bool();
	var deleteRow_action = { internal_column_deleted: { $set: true } };
	function getChangeTableName(name) {
	    return internal_prefix + "changes_" + name;
	}
	function getSetTableName(tableName, col) {
	    return internal_prefix + "set_" + tableName + "_" + col;
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
	        function createInternalTableSpecs(table) {
	            var newSpec = Mutate_1.shallowCopy(table.spec);
	            newSpec.columns = Mutate_1.shallowCopy(table.spec.columns);
	            for (var col in internalColumn) {
	                verify_1.verify(!table.spec.columns[col], "table %s cannot have reserved column name %s", table.spec.name, col);
	                newSpec.columns[col] = internalColumn[col];
	            }
	            buildIndices(newSpec);
	            return [newSpec].concat(createSetTableSpecs(newSpec, verifyGetValue(newSpec.columns, table.key)));
	        }
	        function createChangeTableSpec(table) {
	            var newSpec = {
	                name: getChangeTableName(table.spec.name),
	                columns: {
	                    key: Column_1.Column.Int().Key(),
	                    time: Column_1.Column.DateTime().Key(),
	                    change: Column_1.Column.JSON(),
	                }
	            };
	            buildIndices(newSpec);
	            return newSpec;
	        }
	        function createSetTableSpecs(spec, keyColumn) {
	            var newSpecs = [];
	            for (var col in spec.columns) {
	                var column = spec.columns[col];
	                if (column.type == Column_1.ColumnType.set) {
	                    var newSpec = {
	                        name: getSetTableName(spec.name, col),
	                        columns: {
	                            key: keyColumn,
	                            value: new Column_1.Column(column.elementType).Key(),
	                            time: Column_1.Column.Int().Key()
	                        }
	                    };
	                    buildIndices(newSpec);
	                    newSpecs.push(newSpec);
	                }
	            }
	            return newSpecs;
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
	        (_a = this.tables).push.apply(_a, createInternalTableSpecs(table));
	        this.tables.push(createChangeTableSpec(table));
	        return table;
	        var _a;
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
	                    case Column_1.ColumnType.set:
	                        // ignore this column; values go into a separate table
	                        verify_1.verify(!attrs.isKey, "table %s cannot have a key on set column %s", spec.name, col);
	                        break;
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
	            var indicesEqual = function (a, b) {
	                if (a.length != b.length) {
	                    return false;
	                }
	                for (var i = 0; i < a.length; i++) {
	                    if (a[i] != b[i]) {
	                        return false;
	                    }
	                }
	                return true;
	            };
	            var p = Promise.resolve();
	            var oldIndices = (spec.name in schema) ? schema[spec.name].indices : [];
	            var newIndices = spec.indices;
	            var getIndexName = function (indices) {
	                return "index_" + spec.name + "__" + indices.join("_");
	            };
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
	                for (var _i = 0, _a = selectableColumns(spec, newColumns); _i < _a.length; _i++) {
	                    var colName = _a[_i];
	                    if (!(colName in oldColumns)) {
	                        addedColumns[colName] = newColumns[colName];
	                    }
	                }
	            }
	            if (recreateTable) {
	                // recreate and migrate data
	                var copyData = function (oldName, newName) {
	                    var oldTableColumns = Object.keys(oldColumns).filter(function (col) { return (col in spec.columns) || (col in renamedColumns); });
	                    var newTableColumns = oldTableColumns.map(function (col) { return (col in renamedColumns) ? renamedColumns[col] : col; });
	                    var p2 = Promise.resolve();
	                    if (oldTableColumns.length && newTableColumns.length) {
	                        var stmt = "INSERT INTO " + newName + " (" + newTableColumns.join(", ") + ") ";
	                        stmt += "SELECT " + oldTableColumns.join(", ") + " FROM " + oldName + ";";
	                        p2 = transaction.executeSql(stmt);
	                    }
	                    return p2;
	                };
	                var migrateChangeTable = function (changeTableName) {
	                    var deletedColumns = Object.keys(oldColumns).filter(function (col) { return !(col in spec.columns) && !(col in renamedColumns); });
	                    var p2 = Promise.resolve();
	                    if (spec.renamedColumns || deletedColumns) {
	                        p2 = p2.then(function () {
	                            return transaction.each("SELECT " + ROWID + ", change"
	                                + " FROM " + changeTableName, [], function (selectChangeTransaction, row) {
	                                var change = Text_1.fromText(row.change);
	                                var changed = false;
	                                for (var oldCol in spec.renamedColumns) {
	                                    var newCol = spec.renamedColumns[oldCol];
	                                    if (oldCol in change) {
	                                        change[newCol] = change[oldCol];
	                                        delete change[oldCol];
	                                        changed = true;
	                                    }
	                                }
	                                for (var _i = 0, deletedColumns_1 = deletedColumns; _i < deletedColumns_1.length; _i++) {
	                                    var oldCol = deletedColumns_1[_i];
	                                    if (oldCol in change) {
	                                        delete change[oldCol];
	                                        changed = true;
	                                    }
	                                }
	                                if (changed) {
	                                    if (Object.keys(change).length) {
	                                        return selectChangeTransaction.executeSql("UPDATE " + changeTableName
	                                            + " SET change=?"
	                                            + " WHERE " + ROWID + "=?", [Text_1.toText(change), row[ROWID]]);
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
	                };
	                var renameTable = function (oldName, newName) {
	                    return transaction.executeSql("ALTER TABLE " + oldName + " RENAME TO " + newName);
	                };
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
	            else if (Object.keys(addedColumns).length > 0) {
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
	        verify_1.verify(this.db, "apply(): not opened");
	        var changeTable = getChangeTableName(table.spec.name);
	        return this.db.transaction(function (transaction) {
	            var p1 = Promise.resolve();
	            var toResolve = new Set();
	            changes.forEach(function (change) {
	                var time = change.time || Date.now();
	                verify_1.verify((change.save ? 1 : 0) + (change.change ? 1 : 0) + (change.delete ? 1 : 0) === 1, "change (%s) must specify exactly one action at a time", change);
	                if (change.save) {
	                    // append internal column values
	                    var element = assign_1.assign({}, change.save, (_a = {}, _a[internal_column_time] = time, _a));
	                    p1 = p1.then(function () { return insertElement(transaction, table, element); });
	                    toResolve.add(table.keyValue(element));
	                }
	                else if (change.change || change.delete) {
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
	                        changeRow.change = Text_1.toText(mutator);
	                    }
	                    else {
	                        // mark deleted
	                        changeRow.key = change.delete;
	                        changeRow.change = Text_1.toText(deleteRow_action);
	                    }
	                    // insert into change table
	                    var columns = Object.keys(changeRow);
	                    var values = columns.map(function (k) { return changeRow[k]; });
	                    p1 = p1.then(function () { return insert(transaction, changeTable, columns, values); });
	                    toResolve.add(changeRow.key);
	                }
	                else {
	                    throw new Error("no operation specified for change- should be one of save, change, or delete");
	                }
	                var _a;
	            });
	            toResolve.forEach(function (keyValue) {
	                p1 = p1.then(function () { return resolve(transaction, table, keyValue); });
	            });
	            return p1;
	        });
	    };
	    Store.prototype.find = function (table, query, opts) {
	        return this.db.readTransaction(function (transaction) {
	            var q = assign_1.assign({}, query, (_a = {},
	                _a[internal_column_deleted] = false,
	                _a[internal_column_latest] = true,
	                _a
	            ));
	            return runQuery(transaction, table, q, opts, table.spec.clazz);
	            var _a;
	        });
	    };
	    return Store;
	})();
	exports.Store = Store;
	function verifyGetValue(element, field) {
	    verify_1.verify(field in element, "element does not contain field %s: %s", field, element);
	    return element[field];
	}
	function insert(transaction, tableName, columns, values) {
	    var questionMarks = values.map(function (v) { return "?"; });
	    return transaction.executeSql("INSERT OR REPLACE INTO " + tableName + " (" + columns.join(", ") + ") VALUES (" + questionMarks.join(", ") + ")", values);
	}
	function insertElement(transaction, table, element) {
	    var keyValue = table.keyValue(element);
	    var columns = selectableColumns(table.spec, element);
	    var values = columns.map(function (col) { return serializeValue(table.spec, col, element[col]); });
	    var time = verifyGetValue(element, internal_column_time);
	    var promises = [];
	    promises.push(insert(transaction, table.spec.name, columns, values));
	    // insert set values
	    Object.keys(table.spec.columns).forEach(function insertElementEachColumn(col) {
	        var column = table.spec.columns[col];
	        if (column.type == Column_1.ColumnType.set && (col in element)) {
	            var set = element[col];
	            if (set.size) {
	                var serializer = new Column_1.Column(column.elementType);
	                var setValues = [];
	                var placeholders = [];
	                set.forEach(function (value) {
	                    placeholders.push("(?, ?, ?)");
	                    setValues.push(time, table.keyValue(element), serializer.serialize(value));
	                });
	                var p = transaction.executeSql("INSERT INTO " + getSetTableName(table.spec.name, col)
	                    + " (time, key, value)"
	                    + " VALUES " + placeholders.join(", "), setValues);
	                promises.push(p);
	            }
	        }
	    });
	    return Promise.all(promises);
	}
	function resolve(transaction, table, keyValue) {
	    return selectBaseline(transaction, table, keyValue).then(function resolveSelectBaselineCallback(baseline) {
	        return getChanges(transaction, table, baseline).then(function resolveGetChangesCallback(changes) {
	            var mutation = applyChanges(baseline, changes);
	            var promises = [];
	            if (!mutation.isChanged) {
	                // mark it as latest (and others as not)
	                return setLatest(transaction, table, keyValue, baseline.rowid);
	            }
	            else {
	                // invalidate old latest rows
	                // insert new latest row
	                var element = Mutate_1.mutate(mutation.element, (_a = {},
	                    _a[internal_column_latest] = { $set: true },
	                    _a[internal_column_time] = { $set: mutation.time },
	                    _a[internal_column_composed] = { $set: true },
	                    _a
	                ));
	                return Promise.resolve()
	                    .then(function () { return invalidateLatest(transaction, table, keyValue); })
	                    .then(function () { return insertElement(transaction, table, element); });
	            }
	            var _a;
	        });
	    });
	}
	function runQuery(transaction, table, query, opts, clazz) {
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
	    Object.keys(query).forEach(function (col) {
	        verify_1.verify((col in table.spec.columns) || (col in internalColumn), "attempting to query based on column '%s' not in schema (%s)", col, table.spec.columns);
	        var column = (col in internalColumn) ? internalColumn[col] : table.spec.columns[col];
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
	                var inValues = spec[inCondition];
	                inValues = inValues.map(function (val) { return column.serialize(val); });
	                values.push.apply(values, inValues);
	                found = true;
	            }
	        }
	        if (!found) {
	            if (column.type == Column_1.ColumnType.bool) {
	                conditions.push(col + (spec ? "!=0" : "=0"));
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
	    });
	    var columns = selectableColumns(table.spec, opts.fields || table.spec.columns);
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
	    return transaction.executeSql(stmt, values, function (tx2, rows) {
	        if (opts.count) {
	            var count = parseInt(rows[0][COUNT], 10);
	            return count;
	        }
	        else {
	            var results = [];
	            for (var i = 0; i < rows.length; i++) {
	                var row = deserializeRow(table.spec, rows[i]);
	                var obj = clazz ? new clazz(row) : row;
	                results.push(obj);
	            }
	            return results;
	        }
	    });
	}
	function selectBaseline(transaction, table, keyValue) {
	    var fieldSpec = (_a = {},
	        _a[ROWID] = true,
	        _a[internal_column_time] = true,
	        _a[internal_column_deleted] = true,
	        _a
	    );
	    selectableColumns(table.spec, table.spec.columns).forEach(function (col) { return fieldSpec[col] = true; });
	    var query = (_b = {},
	        _b[table.key] = keyValue,
	        _b[internal_column_composed] = false,
	        _b
	    );
	    var opts = {
	        fields: fieldSpec,
	        orderBy: (_c = {}, _c[internal_column_time] = Table_1.OrderBy.DESC, _c),
	        limit: 1
	    };
	    return runQuery(transaction, table, query, opts, null)
	        .then(function (baselineResults) {
	        var baseline = {
	            element: {},
	            time: 0,
	            rowid: -1
	        };
	        var p = Promise.resolve();
	        if (baselineResults.length) {
	            var element = baselineResults[0];
	            baseline.element = element;
	            baseline.time = verifyGetValue(baselineResults[0], internal_column_time);
	            baseline.rowid = verifyGetValue(baselineResults[0], ROWID);
	            p = p.then(function () { return loadExternals(transaction, table, element); });
	        }
	        else {
	            baseline.element[table.key] = keyValue;
	        }
	        return p.then(function () { return baseline; });
	    });
	    var _a, _b, _c;
	}
	function loadExternals(transaction, table, element) {
	    var promises = [];
	    Object.keys(table.spec.columns).forEach(function loadExternalsForEach(col) {
	        var column = table.spec.columns[col];
	        if (column.type == Column_1.ColumnType.set) {
	            var columnDeserializer = new Column_1.Column(column.elementType);
	            var set = element[col] = element[col] || new Set();
	            var keyValue = verifyGetValue(element, table.key);
	            var time = verifyGetValue(element, internal_column_time);
	            var p = transaction.executeSql("SELECT value "
	                + "FROM " + getSetTableName(table.spec.name, col)
	                + " WHERE key=?"
	                + " AND time=?", [keyValue, time], function loadExternalsSqlCallback(tx, results) {
	                for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
	                    var row = results_1[_i];
	                    set.add(columnDeserializer.deserialize(row.value));
	                }
	            });
	            promises.push(p);
	        }
	    });
	    return Promise.all(promises);
	}
	function getChanges(transaction, table, baseline) {
	    var keyValue = verifyGetValue(baseline.element, table.key);
	    return transaction.executeSql("SELECT key, time, change"
	        + " FROM " + getChangeTableName(table.spec.name)
	        + " WHERE key=? AND time>=?"
	        + " ORDER BY time ASC", [keyValue, baseline.time]);
	}
	function applyChanges(baseline, changes) {
	    var element = baseline.element;
	    var time = baseline.time;
	    for (var i = 0; i < changes.length; i++) {
	        var row = changes[i];
	        var mutator = Text_1.fromText(row.change);
	        element = Mutate_1.mutate(element, mutator);
	        time = Math.max(time, row.time);
	    }
	    var isChanged = Mutate_1.isMutated(baseline.element, element) || baseline.rowid == -1;
	    return { element: element, time: time, isChanged: isChanged };
	}
	function setLatest(transaction, table, keyValue, rowid) {
	    return transaction.executeSql("UPDATE " + table.spec.name
	        + " SET " + internal_column_latest + "=(" + ROWID + "=" + rowid + ")"
	        + " WHERE " + table.key + "=?", [keyValue]);
	}
	function invalidateLatest(transaction, table, keyValue) {
	    return transaction.executeSql("UPDATE " + table.spec.name
	        + " SET " + internal_column_latest + "=0"
	        + " WHERE " + table.key + "=?", [keyValue]);
	}
	function selectableColumns(spec, cols) {
	    return Object.keys(cols).filter(function (col) { return (col == ROWID) || (col in internalColumn) || ((col in spec.columns) && (spec.columns[col].type != Column_1.ColumnType.set)); });
	}
	function serializeValue(spec, col, value) {
	    if (col in spec.columns) {
	        return spec.columns[col].serialize(value);
	    }
	    return value;
	}
	function deserializeRow(spec, row) {
	    var ret = {};
	    for (var col in row) {
	        if (row[col] == null) {
	        }
	        else if (col in spec.columns) {
	            ret[col] = spec.columns[col].deserialize(row[col]);
	        }
	        else {
	            ret[col] = row[col];
	        }
	    }
	    return ret;
	}
	function createStore(params) {
	    return new Store(params);
	}
	exports.createStore = createStore;
	//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3RvcmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvU3RvcmUudHMiXSwibmFtZXMiOlsic3RhcnRzV2l0aCIsIlNjaGVtYSIsIlNjaGVtYS5jb25zdHJ1Y3RvciIsImdldENoYW5nZVRhYmxlTmFtZSIsImdldFNldFRhYmxlTmFtZSIsIlN0b3JlIiwiU3RvcmUuY29uc3RydWN0b3IiLCJTdG9yZS5jcmVhdGVUYWJsZSIsIlN0b3JlLmNyZWF0ZVRhYmxlLmJ1aWxkSW5kaWNlcyIsIlN0b3JlLmNyZWF0ZVRhYmxlLmNyZWF0ZUludGVybmFsVGFibGVTcGVjcyIsIlN0b3JlLmNyZWF0ZVRhYmxlLmNyZWF0ZUNoYW5nZVRhYmxlU3BlYyIsIlN0b3JlLmNyZWF0ZVRhYmxlLmNyZWF0ZVNldFRhYmxlU3BlY3MiLCJTdG9yZS5vcGVuIiwiU3RvcmUucmVhZFNjaGVtYSIsIlN0b3JlLnJlYWRTY2hlbWEudGFibGVGcm9tU3FsIiwiU3RvcmUucmVhZFNjaGVtYS5pbmRleEZyb21TcWwiLCJTdG9yZS5zeW5jVGFibGVzIiwiU3RvcmUuc3luY1RhYmxlIiwiU3RvcmUuc3luY1RhYmxlLmNyZWF0ZVRhYmxlIiwiU3RvcmUuc3luY1RhYmxlLmRyb3BUYWJsZSIsIlN0b3JlLnN5bmNUYWJsZS5jcmVhdGVJbmRpY2VzIiwiU3RvcmUuYWRkIiwiU3RvcmUuZmluZCIsInZlcmlmeUdldFZhbHVlIiwiaW5zZXJ0IiwiaW5zZXJ0RWxlbWVudCIsImluc2VydEVsZW1lbnQuaW5zZXJ0RWxlbWVudEVhY2hDb2x1bW4iLCJyZXNvbHZlIiwicmVzb2x2ZS5yZXNvbHZlU2VsZWN0QmFzZWxpbmVDYWxsYmFjayIsInJlc29sdmUucmVzb2x2ZVNlbGVjdEJhc2VsaW5lQ2FsbGJhY2sucmVzb2x2ZUdldENoYW5nZXNDYWxsYmFjayIsInJ1blF1ZXJ5Iiwic2VsZWN0QmFzZWxpbmUiLCJsb2FkRXh0ZXJuYWxzIiwibG9hZEV4dGVybmFscy5sb2FkRXh0ZXJuYWxzRm9yRWFjaCIsImxvYWRFeHRlcm5hbHMubG9hZEV4dGVybmFsc0ZvckVhY2gubG9hZEV4dGVybmFsc1NxbENhbGxiYWNrIiwiZ2V0Q2hhbmdlcyIsImFwcGx5Q2hhbmdlcyIsInNldExhdGVzdCIsImludmFsaWRhdGVMYXRlc3QiLCJzZWxlY3RhYmxlQ29sdW1ucyIsInNlcmlhbGl6ZVZhbHVlIiwiZGVzZXJpYWxpemVSb3ciLCJjcmVhdGVTdG9yZSJdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsdUJBQXNFLFVBQVUsQ0FBQyxDQUFBO0FBQ2pGLHVCQUE0RCxVQUFVLENBQUMsQ0FBQTtBQUV2RSxzQkFBcUYsU0FBUyxDQUFDLENBQUE7QUFDL0YscUJBQWlDLFFBQVEsQ0FBQyxDQUFBO0FBQzFDLHVCQUF1QixVQUFVLENBQUMsQ0FBQTtBQUNsQyx1QkFBdUIsVUFBVSxDQUFDLENBQUE7QUFHbEMsb0JBQW9CLEdBQVcsRUFBRSxHQUFXO0lBQzNDQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSxXQUFXQSxDQUFDQSxHQUFHQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtBQUN0Q0EsQ0FBQ0E7QUFRRDtJQUFBQztJQUVBQyxDQUFDQTtJQUFERCxhQUFDQTtBQUFEQSxDQUFDQSxBQUZELElBRUM7QUFGWSxjQUFNLFNBRWxCLENBQUE7QUFzQkQsSUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDO0FBQ3RCLElBQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQztBQUN6QixJQUFNLGVBQWUsR0FBRyxVQUFVLENBQUM7QUFDbkMsSUFBTSx1QkFBdUIsR0FBRyxlQUFlLEdBQUcsU0FBUyxDQUFDO0FBQzVELElBQU0sb0JBQW9CLEdBQUcsZUFBZSxHQUFHLE1BQU0sQ0FBQztBQUN0RCxJQUFNLHNCQUFzQixHQUFHLGVBQWUsR0FBRyxRQUFRLENBQUM7QUFDMUQsSUFBTSx3QkFBd0IsR0FBRyxlQUFlLEdBQUcsVUFBVSxDQUFDO0FBQzlELElBQU0sY0FBYyxHQUFjLEVBQUUsQ0FBQztBQUNyQyxjQUFj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LElBQUlBLENBQUNBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEtBQUtBLENBQUNBLENBQUNBO2dCQUNuQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ2xCQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQTtZQUNkQSxDQUFDQTtZQUNEQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxZQUFZQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDakNBLElBQUlBLEVBQUVBLEdBQVdBLElBQUlBLENBQUNBO2dCQUN0QkEsSUFBSUEsR0FBR0EsR0FBR0EsRUFBRUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsT0FBT0EsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsS0FBS0EsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7Z0JBQzlEQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDbkJBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUN4QkEsQ0FBQ0E7Z0JBQ0RBLElBQUlBLENBQUNBLENBQUNBO29CQUNMQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQTtnQkFDakJBLENBQUNBO2dCQUNEQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxJQUFJQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDaENBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBLENBQUNBO2dCQUN4Q0EsQ0FBQ0E7Z0JBQ0RBLElBQUlBLENBQUNBLENBQUNBO29CQUNMQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFH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

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var verify_1 = __webpack_require__(3);
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
	//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGFibGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvVGFibGUudHMiXSwibmFtZXMiOlsiT3JkZXJCeSIsIlRhYmxlIiwiVGFibGUuY29uc3RydWN0b3IiLCJUYWJsZS5rZXlWYWx1ZSIsInRhYmxlS2V5Il0sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYix1QkFBdUIsVUFBVSxDQUFDLENBQUE7QUF3QmxDLFdBQVksT0FBTztJQUNsQkEsbUNBQUdBLENBQUFBO0lBQ0hBLHFDQUFJQSxDQUFBQTtBQUNMQSxDQUFDQSxFQUhXLGVBQU8sS0FBUCxlQUFPLFFBR2xCO0FBSEQsSUFBWSxPQUFPLEdBQVAsZUFHWCxDQUFBO0FBa0JEO0lBSUNDLGVBQVlBLElBQXdDQTtRQUNuREMsSUFBSUEsQ0FBQ0EsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0E7UUFDakJBLElBQUlBLENBQUNBLEdBQUdBLEdBQUdBLFFBQVFBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO0lBQzNCQSxDQUFDQTtJQUVERCx3QkFBUUEsR0FBUkEsVUFBU0EsT0FBMEJBO1FBQ2xDRSxlQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxJQUFJQSxPQUFPQSxFQUFFQSw2Q0FBNkNBLEVBQUVBLElBQUlBLENBQUNBLEdBQUdBLEVBQUVBLE9BQU9BLENBQUNBLENBQUNBO1FBQzlGQSxNQUFNQSxDQUFDQSxPQUFPQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtJQUMxQkEsQ0FBQ0E7SUFJRkYsWUFBQ0E7QUFBREEsQ0FBQ0EsQUFoQkQsSUFnQkM7QUFoQlksYUFBSyxRQWdCakIsQ0FBQTtBQUdELGtCQUF5QixJQUE4QjtJQUN0REcsSUFBSUEsR0FBR0EsR0FBWUEsSUFBSUEsQ0FBQ0E7SUFDeEJBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLE1BQUlBLElBQUlBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBO1FBQy9CQSxJQUFJQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxNQUFJQSxDQUFDQSxDQUFDQTtRQUNoQ0EsZUFBTUEsQ0FBQ0EsTUFBTUEsRUFBRUEsMEJBQTBCQSxFQUFFQSxNQUFJQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUN2REEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbEJBLGVBQU1BLENBQUNBLENBQUNBLEdBQUdBLEVBQUVBLDJDQUEyQ0EsRUFBRUEsSUFBSUEsQ0FBQ0EsSUFBSUEsRUFBRUEsR0FBR0EsRUFBRUEsTUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDaEZBLEdBQUdBLEdBQUdBLE1BQUlBLENBQUNBO1FBQ1pBLENBQUNBO0lBQ0ZBLENBQUNBO0lBRURBLGVBQU1BLENBQUNBLEdBQUdBLEVBQUVBLDhCQUE4QkEsRUFBRUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7SUFDdkRBLE1BQU1BLENBQUNBLEdBQUdBLENBQUNBO0FBQ1pBLENBQUNBO0FBYmUsZ0JBQVEsV0FhdkIsQ0FBQSJ9

/***/ },
/* 9 */
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
	        var p = undefined;
	        return new Promise(function (resolve, reject) {
	            _this.db.each(sql, params, function (err, row) {
	                if (err) {
	                    console.log("SQLiteWrapper.each(): error executing '" + sql + "': ", err);
	                    reject(err);
	                }
	                else {
	                    if (callback) {
	                        p = callback(tx, row);
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
	//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU1FMaXRlV3JhcHBlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9TUUxpdGVXcmFwcGVyLnRzIl0sIm5hbWVzIjpbIlNRTGl0ZVdyYXBwZXIiLCJTUUxpdGVXcmFwcGVyLmNvbnN0cnVjdG9yIiwiU1FMaXRlV3JhcHBlci5ydW4iLCJTUUxpdGVXcmFwcGVyLmFsbCIsIlNRTGl0ZVdyYXBwZXIuZWFjaCIsIlNRTGl0ZVdyYXBwZXIudHJhbnNhY3Rpb24iLCJTUUxpdGVXcmFwcGVyLnJlYWRUcmFuc2FjdGlvbiIsIndyYXBTcWwiXSwibWFwcGluZ3MiOiJBQUFBLDBDQUEwQztBQWMxQztJQUdDQSx1QkFBWUEsRUFBYUE7UUFDeEJDLElBQUlBLENBQUNBLEVBQUVBLEdBQUdBLEVBQUVBLENBQUNBO0lBQ2RBLENBQUNBO0lBRURELDJCQUFHQSxHQUFIQSxVQUFJQSxHQUFXQTtRQUFmRSxpQkFZQ0E7UUFYQUEsTUFBTUEsQ0FBQ0EsSUFBSUEsT0FBT0EsQ0FBQ0EsVUFBQ0EsT0FBT0EsRUFBRUEsTUFBTUE7WUFDbENBLEtBQUlBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLEVBQUVBLFVBQUNBLEdBQVVBO2dCQUMzQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ1RBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLHdDQUF3Q0EsR0FBR0EsR0FBR0EsR0FBR0EsS0FBS0EsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7b0JBQ3pFQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtnQkFDYkEsQ0FBQ0E7Z0JBQ0RBLElBQUlBLENBQUNBLENBQUNBO29CQUNMQSxPQUFPQSxFQUFFQSxDQUFDQTtnQkFDWEEsQ0FBQ0E7WUFDRkEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDSkEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFDSkEsQ0FBQ0E7SUFFREYsMkJBQUdBLEdBQUhBLFVBQUlBLEVBQWlCQSxF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

/***/ },
/* 10 */
/***/ function(module, exports) {

	///<reference path="./websql.d.ts"/>
	"use strict";
	var WebsqlWrapper = (function () {
	    function WebsqlWrapper(name, version, displayName, estimatedSize, traceCallback) {
	        version = version || "1.0";
	        displayName = displayName || name;
	        estimatedSize = estimatedSize || 5 * 1024 * 1024;
	        this.db = window.openDatabase(name, version, displayName, estimatedSize);
	        this.traceCallback = traceCallback;
	    }
	    WebsqlWrapper.prototype.trace = function (sql, params) {
	        if (this.traceCallback) {
	            var idx = 0;
	            var escapedString = sql.replace(/\?/g, function () {
	                var x = params[idx++];
	                if (typeof x == "number") {
	                    return x;
	                }
	                else {
	                    return "'" + x + "'";
	                }
	            });
	            this.traceCallback(escapedString);
	        }
	    };
	    WebsqlWrapper.prototype.all = function (tx, sql, params, callback) {
	        var _this = this;
	        return new Promise(function (resolve, reject) {
	            _this.trace(sql, params);
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
	        var _this = this;
	        return new Promise(function (resolve, reject) {
	            _this.trace(sql, params);
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
	function wrapWebsql(name, version, displayName, estimatedSize, traceCallback) {
	    return new WebsqlWrapper(name, version, displayName, estimatedSize, traceCallback);
	}
	exports.wrapWebsql = wrapWebsql;
	//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV2Vic3FsV3JhcHBlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9XZWJzcWxXcmFwcGVyLnRzIl0sIm5hbWVzIjpbIldlYnNxbFdyYXBwZXIiLCJXZWJzcWxXcmFwcGVyLmNvbnN0cnVjdG9yIiwiV2Vic3FsV3JhcHBlci50cmFjZSIsIldlYnNxbFdyYXBwZXIuYWxsIiwiV2Vic3FsV3JhcHBlci5lYWNoIiwiV2Vic3FsV3JhcHBlci53cmFwVHJhbnNhY3Rpb24iLCJXZWJzcWxXcmFwcGVyLnRyYW5zYWN0aW9uIiwiV2Vic3FsV3JhcHBlci5yZWFkVHJhbnNhY3Rpb24iLCJ3cmFwV2Vic3FsIl0sIm1hcHBpbmdzIjoiQUFBQSxvQ0FBb0M7QUFDcEMsWUFBWSxDQUFDO0FBU2I7SUFJQ0EsdUJBQVlBLElBQVlBLEVBQUVBLE9BQWdCQSxFQUFFQSxXQUFvQkEsRUFBRUEsYUFBc0JBLEVBQUVBLGFBQXNDQTtRQUMvSEMsT0FBT0EsR0FBR0EsT0FBT0EsSUFBSUEsS0FBS0EsQ0FBQ0E7UUFDM0JBLFdBQVdBLEdBQUdBLFdBQVdBLElBQUlBLElBQUlBLENBQUNBO1FBQ2xDQSxhQUFhQSxHQUFHQSxhQUFhQSxJQUFJQSxDQUFDQSxHQUFHQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQTtRQUVqREEsSUFBSUEsQ0FBQ0EsRUFBRUEsR0FBR0EsTUFBTUEsQ0FBQ0EsWUFBWUEsQ0FBQ0EsSUFBSUEsRUFBRUEsT0FBT0EsRUFBRUEsV0FBV0EsRUFBRUEsYUFBYUEsQ0FBQ0EsQ0FBQ0E7UUFDekVBLElBQUlBLENBQUNBLGFBQWFBLEdBQUdBLGFBQWFBLENBQUNBO0lBQ3BDQSxDQUFDQTtJQUVERCw2QkFBS0EsR0FBTEEsVUFBTUEsR0FBV0EsRUFBRUEsTUFBNEJBO1FBQzlDRSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxhQUFhQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN4QkEsSUFBSUEsR0FBR0EsR0FBV0EsQ0FBQ0EsQ0FBQ0E7WUFDcEJB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

/***/ }
/******/ ]);
//# sourceMappingURL=updraft.js.map