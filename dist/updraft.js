"use strict";
var Updraft;
(function (Updraft) {
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
    Updraft.assign = ObjectAssign;
})(Updraft || (Updraft = {}));
"use strict";
var Updraft;
(function (Updraft) {
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
    Updraft.toText = toText;
    function fromText(text) {
        return JSON.parse(text, reviver);
    }
    Updraft.fromText = fromText;
})(Updraft || (Updraft = {}));
"use strict";
var Updraft;
(function (Updraft) {
    function makePrintable(x) {
        if (Array.isArray(x) || (x && typeof x === "object")) {
            return JSON.stringify(x);
        }
        else {
            return x;
        }
    }
    /**
    * Use verify() to assert state which your program assumes to be true.
    *
    * Provide sprintf-style format (only %s is supported) and arguments
    * to provide information about what broke and what you were
    * expecting.
    */
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
    Updraft.verify = verify;
})(Updraft || (Updraft = {}));
///<reference path="./Text"/>
///<reference path="./verify"/>
"use strict";
var Updraft;
(function (Updraft) {
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
    })(Updraft.ColumnType || (Updraft.ColumnType = {}));
    var ColumnType = Updraft.ColumnType;
    /**
    * Column in db.  Use static methods to create columns.
    */
    var Column = (function () {
        function Column(type) {
            this.type = type;
            if (type == ColumnType.bool) {
                this.defaultValue = false;
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
                value = value ? true : false;
            }
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
                    return Updraft.fromText(value);
                case ColumnType.enum:
                    if (typeof this.enum.get === "function") {
                        var enumValue = this.enum.get(value);
                        Updraft.verify(!value || enumValue, "error getting enum value %s", value);
                        return enumValue;
                    }
                    Updraft.verify(value in this.enum, "enum value %s not in %s", value, this.enum);
                    return this.enum[value];
                case ColumnType.date:
                case ColumnType.datetime:
                    Updraft.verify(!value || parseFloat(value) == value, "expected date to be stored as a number: %s", value);
                    return value ? new Date(parseFloat(value) * 1000) : undefined;
                case ColumnType.set:
                    Updraft.verify(value instanceof Set, "value should already be a set");
                    return value;
                /* istanbul ignore next */
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
                    return Updraft.toText(value);
                case ColumnType.enum:
                    if (typeof value === "string" || typeof value === undefined || value === null) {
                        return value;
                    }
                    else if (typeof value === "number") {
                        Updraft.verify(value in this.enum, "enum doesn't contain %s", value);
                        return this.enum[value];
                    }
                    Updraft.verify(typeof value.toString === "function", "expected an enum value supporting toString(); got %s", value);
                    return value.toString();
                case ColumnType.date:
                case ColumnType.datetime:
                    Updraft.verify(value == undefined || value instanceof Date, "expected a date, got %s", value);
                    var date = (value == undefined) ? null : (value.getTime() / 1000);
                    return date;
                /* istanbul ignore next */
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
            c.element = new Column(type);
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
                /* istanbul ignore next */
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
                        Updraft.verify(false, "default value (%s) must be number or string", x);
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
                /* istanbul ignore next */
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
    Updraft.Column = Column;
})(Updraft || (Updraft = {}));
// written to React"s immutability helpers spec
// see https://facebook.github.io/react/docs/update.html
///<reference path="../typings/tsd.d.ts"/>
///<reference path="./assign"/>
///<reference path="./verify"/>
"use strict";
var Updraft;
(function (Updraft) {
    function shallowCopy(x) {
        if (Array.isArray(x)) {
            return x.concat();
        }
        else if (x instanceof Set) {
            return new Set(x);
        }
        else if (x && typeof x === "object") {
            return Updraft.assign(new x.constructor(), x);
        }
        else {
            return x;
        }
    }
    Updraft.shallowCopy = shallowCopy;
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
    Updraft.hasOwnProperty = {}.hasOwnProperty;
    function keyOf(obj) { return Object.keys(obj)[0]; }
    Updraft.keyOf = keyOf;
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
        Updraft.verify(Array.isArray(value), "mutate(): expected target of %s to be an array; got %s.", c, value);
        var specValue = spec[c];
        Updraft.verify(Array.isArray(specValue), "mutate(): expected spec of %s to be an array; got %s. " +
            "Did you forget to wrap your parameter in an array?", c, specValue);
    }
    function verifySetCase(value, spec, c) {
        Updraft.verify(value instanceof Set, "mutate(): expected target of %s to be a set; got %s.", c, value);
        var specValue = spec[c];
        Updraft.verify(Array.isArray(specValue), "mutate(): expected spec of %s to be an array; got %s. " +
            "Did you forget to wrap your parameter in an array?", c, specValue);
    }
    function mutate(value, spec) {
        Updraft.verify(typeof spec === "object", "mutate(): You provided a key path to mutate() that did not contain one " +
            "of %s. Did you forget to include {%s: ...}?", Object.keys(command).join(", "), command.set);
        // verify(
        // 	Object.keys(spec).reduce( function(previousValue: boolean, currentValue: string): boolean {
        // 		return previousValue && (keyOf(spec[currentValue]) in command);
        // 	}, true),
        // 	"mutate(): argument has an unknown key; supported keys are (%s).  mutator: %s",
        // 	Object.keys(command).join(", "),
        // 	spec
        // );
        if (Updraft.hasOwnProperty.call(spec, command.set)) {
            Updraft.verify(Object.keys(spec).length === 1, "Cannot have more than one key in an object with %s", command.set);
            return shallowEqual(value, spec[command.set]) ? value : spec[command.set];
        }
        if (Updraft.hasOwnProperty.call(spec, command.increment)) {
            Updraft.verify(typeof (value) === "number" && typeof (spec[command.increment]) === "number", "Source (%s) and argument (%s) to %s must be numbers", value, spec[command.increment], command.increment);
            return value + spec[command.increment];
        }
        var changed = false;
        if (Updraft.hasOwnProperty.call(spec, command.merge)) {
            var mergeObj = spec[command.merge];
            var nextValue_1 = shallowCopy(value);
            Updraft.verify(mergeObj && typeof mergeObj === "object", "mutate(): %s expects a spec of type 'object'; got %s", command.merge, mergeObj);
            Updraft.verify(nextValue_1 && typeof nextValue_1 === "object", "mutate(): %s expects a target of type 'object'; got %s", command.merge, nextValue_1);
            Updraft.assign(nextValue_1, spec[command.merge]);
            return shallowEqual(value, nextValue_1) ? value : nextValue_1;
        }
        if (Updraft.hasOwnProperty.call(spec, command.deleter) && (typeof value === "object") && !(value instanceof Set)) {
            var key = spec[command.merge];
            Updraft.verify(key && typeof key === "string", "mutate(): %s expects a spec of type 'string'; got %s", command.deleter, key);
            if (key in value) {
                var nextValue_2 = shallowCopy(value);
                delete nextValue_2[key];
                return nextValue_2;
            }
            else {
                return value;
            }
        }
        if (Updraft.hasOwnProperty.call(spec, command.push)) {
            var nextValue_3 = shallowCopy(value) || [];
            verifyArrayCase(nextValue_3, spec, command.push);
            if (spec[command.push].length) {
                nextValue_3.push.apply(nextValue_3, spec[command.push]);
                return nextValue_3;
            }
            else {
                return value;
            }
        }
        if (Updraft.hasOwnProperty.call(spec, command.unshift)) {
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
        if (Updraft.hasOwnProperty.call(spec, command.splice)) {
            var nextValue_5 = shallowCopy(value);
            Updraft.verify(Array.isArray(value), "Expected %s target to be an array; got %s", command.splice, value);
            Updraft.verify(Array.isArray(spec[command.splice]), "mutate(): expected spec of %s to be an array of arrays; got %s. " +
                "Did you forget to wrap your parameters in an array?", command.splice, spec[command.splice]);
            spec[command.splice].forEach(function (args) {
                Updraft.verify(Array.isArray(args), "mutate(): expected spec of %s to be an array of arrays; got %s. " +
                    "Did you forget to wrap your parameters in an array?", command.splice, spec[command.splice]);
                nextValue_5.splice.apply(nextValue_5, args);
            });
            return shallowEqual(nextValue_5, value) ? value : nextValue_5;
        }
        if (Updraft.hasOwnProperty.call(spec, command.add)) {
            var nextValue_6 = shallowCopy(value) || new Set();
            verifySetCase(nextValue_6, spec, command.add);
            spec[command.add].forEach(function (item) {
                if (!nextValue_6.has(item)) {
                    nextValue_6.add(item);
                    changed = true;
                }
            });
            return changed ? nextValue_6 : value;
        }
        if (Updraft.hasOwnProperty.call(spec, command.deleter) && (value instanceof Set)) {
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
    Updraft.mutate = mutate;
    function isMutated(a, b) {
        return a !== b;
    }
    Updraft.isMutated = isMutated;
})(Updraft || (Updraft = {}));
///<reference path="./Column"/>
///<reference path="./verify"/>
"use strict";
var Updraft;
(function (Updraft) {
    (function (OrderBy) {
        OrderBy[OrderBy["ASC"] = 0] = "ASC";
        OrderBy[OrderBy["DESC"] = 1] = "DESC";
    })(Updraft.OrderBy || (Updraft.OrderBy = {}));
    var OrderBy = Updraft.OrderBy;
    var Table = (function () {
        function Table(spec) {
            this.spec = spec;
            this.key = tableKey(spec);
        }
        Table.prototype.keyValue = function (element) {
            Updraft.verify(this.key in element, "object does not have key field '%s' set: %s", this.key, element);
            return element[this.key];
        };
        return Table;
    })();
    Updraft.Table = Table;
    function tableKey(spec) {
        var key = null;
        for (var name_1 in spec.columns) {
            var column = spec.columns[name_1];
            Updraft.verify(column, "column '%s' is not in %s", name_1, spec);
            if (column.isKey) {
                Updraft.verify(!key, "Table %s has more than one key- %s and %s", spec.name, key, name_1);
                key = name_1;
            }
        }
        Updraft.verify(key, "Table %s does not have a key", spec.name);
        return key;
    }
    Updraft.tableKey = tableKey;
})(Updraft || (Updraft = {}));
///<reference path="./Mutate"/>
///<reference path="./Column"/>
///<reference path="./Database"/>
///<reference path="./Table"/>
///<reference path="./Text"/>
///<reference path="./assign"/>
///<reference path="./verify"/>
"use strict";
var Updraft;
(function (Updraft) {
    function startsWith(str, val) {
        return str.lastIndexOf(val, 0) === 0;
    }
    var Schema = (function () {
        function Schema() {
        }
        return Schema;
    })();
    Updraft.Schema = Schema;
    var ROWID = "rowid";
    var COUNT = "COUNT(*)";
    var internal_prefix = "updraft_";
    var internal_column_deleted = internal_prefix + "deleted";
    var internal_column_time = internal_prefix + "time";
    var internal_column_latest = internal_prefix + "latest";
    var internal_column_composed = internal_prefix + "composed";
    var internalColumn = {};
    internalColumn[internal_column_deleted] = Updraft.Column.Bool();
    internalColumn[internal_column_time] = Updraft.Column.Int().Key();
    internalColumn[internal_column_latest] = Updraft.Column.Bool();
    internalColumn[internal_column_composed] = Updraft.Column.Bool();
    var deleteRow_action = (_a = {}, _a[internal_column_deleted] = { $set: true }, _a);
    var keyValueTableSpec = {
        name: internal_prefix + "keyValues",
        columns: {
            key: Updraft.Column.String().Key(),
            value: Updraft.Column.JSON(),
        }
    };
    var Store = (function () {
        function Store(params) {
            this.params = params;
            this.tables = [];
            this.db = null;
            Updraft.verify(this.params.db, "must pass a DbWrapper");
            this.keyValueTable = this.createTable(keyValueTableSpec);
        }
        Store.prototype.createTable = function (tableSpec) {
            var _this = this;
            Updraft.verify(!this.db, "createTable() can only be added before open()");
            if (tableSpec !== keyValueTableSpec) {
                Updraft.verify(!startsWith(tableSpec.name, internal_prefix), "table name %s cannot begin with %s", tableSpec.name, internal_prefix);
            }
            for (var col in tableSpec.columns) {
                Updraft.verify(!startsWith(col, internal_prefix), "table %s column %s cannot begin with %s", tableSpec.name, col, internal_prefix);
            }
            var table = new Updraft.Table(tableSpec);
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
            Updraft.verify(!this.db, "open() called more than once!");
            Updraft.verify(this.tables.length, "open() called before any tables were added");
            this.db = this.params.db;
            return Promise.resolve()
                .then(function () { return _this.readSchema(); })
                .then(function (schema) {
                return _this.db.transaction(function (transaction) {
                    var p = Promise.resolve();
                    _this.tables.forEach(function (table) {
                        p = p.then(function () { return _this.syncTable(transaction, schema, table); });
                    });
                    p = p.then(function () { return _this.loadKeyValues(transaction); });
                    return p;
                });
            });
        };
        Store.prototype.readSchema = function () {
            Updraft.verify(this.db, "readSchema(): not opened");
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
                                        Updraft.verify(row.tbl_name in schema, "table %s used by index %s should have been returned first", row.tbl_name, row.name);
                                        Updraft.verify(col in schema[row.tbl_name].columns, "table %s does not have column %s used by index %s", row.tbl_name, col, row.name);
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
        Store.prototype.syncTable = function (transaction, schema, spec) {
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
                    if (!Updraft.Column.equal(oldCol, newCol)) {
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
                    var renameTable = function (oldName, newName) {
                        return transaction.executeSql("ALTER TABLE " + oldName + " RENAME TO " + newName);
                    };
                    var tempTableName = "temp_" + spec.name;
                    var changeTableName = getChangeTableName(spec.name);
                    if (tempTableName in schema) {
                        // yikes!  migration failed but transaction got committed?
                        p = p.then(function () { return dropTable(transaction, tempTableName); });
                    }
                    p = p.then(function () { return createTable(transaction, tempTableName, spec.columns); });
                    p = p.then(function () { return copyData(transaction, spec.name, tempTableName, oldColumns, newColumns, renamedColumns); });
                    p = p.then(function () { return dropTable(transaction, spec.name); });
                    p = p.then(function () { return renameTable(tempTableName, spec.name); });
                    p = p.then(function () { return migrateChangeTable(transaction, changeTableName, oldColumns, newColumns, renamedColumns); });
                    p = p.then(function () { return createIndices(transaction, schema, spec, true); });
                }
                else if (Object.keys(addedColumns).length > 0) {
                    // alter table, add columns
                    Object.keys(addedColumns).forEach(function (colName) {
                        var col = spec.columns[colName];
                        var columnDecl = colName + " " + Updraft.Column.sql(col);
                        p = p.then(function () { return transaction.executeSql("ALTER TABLE " + spec.name + " ADD COLUMN " + columnDecl); });
                    });
                    p = p.then(function () { return createIndices(transaction, schema, spec); });
                }
                else {
                    // no table modification is required
                    p = p.then(function () { return createIndices(transaction, schema, spec); });
                }
            }
            else {
                // create new table
                p = p.then(function () { return createTable(transaction, spec.name, spec.columns); });
                p = p.then(function () { return createIndices(transaction, schema, spec, true); });
            }
            return p;
        };
        Store.prototype.loadKeyValues = function (transaction) {
            var _this = this;
            return runQuery(transaction, this.keyValueTable, {}, undefined, undefined)
                .then(function (rows) {
                _this.keyValues = {};
                rows.forEach(function (row) {
                    _this.keyValues[row.key] = row.value;
                });
            });
        };
        Store.prototype.getValue = function (key) {
            return this.keyValues[key];
        };
        Store.prototype.setValue = function (key, value) {
            this.keyValues[key] = value;
            return this.keyValueTable.add({ save: { key: key, value: value } });
        };
        Store.prototype.add = function (table) {
            var changes = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                changes[_i - 1] = arguments[_i];
            }
            Updraft.verify(this.db, "apply(): not opened");
            var changeTable = getChangeTableName(table.spec.name);
            return this.db.transaction(function (transaction) {
                var p1 = Promise.resolve();
                var toResolve = new Set();
                changes.forEach(function (change) {
                    var time = change.time || Date.now();
                    Updraft.verify((change.save ? 1 : 0) + (change.change ? 1 : 0) + (change.delete ? 1 : 0) === 1, "change (%s) must specify exactly one action at a time", change);
                    if (change.save) {
                        // append internal column values
                        var element = Updraft.assign({}, change.save, (_a = {}, _a[internal_column_time] = time, _a));
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
                            var mutator = Updraft.shallowCopy(change.change);
                            changeRow.key = table.keyValue(mutator);
                            delete mutator[table.key];
                            changeRow.change = serializeChange(mutator, table.spec);
                        }
                        else {
                            // mark deleted
                            changeRow.key = change.delete;
                            changeRow.change = serializeChange(deleteRow_action, table.spec);
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
                var q = Updraft.assign({}, query, (_a = {},
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
    Updraft.Store = Store;
    function getChangeTableName(name) {
        return internal_prefix + "changes_" + name;
    }
    function getSetTableName(tableName, col) {
        return internal_prefix + "set_" + tableName + "_" + col;
    }
    function buildIndices(spec) {
        spec.indices = spec.indices || [];
        for (var col in spec.columns) {
            if (spec.columns[col].isIndex) {
                spec.indices.push([col]);
            }
        }
    }
    function createInternalTableSpecs(table) {
        var newSpec = Updraft.shallowCopy(table.spec);
        newSpec.columns = Updraft.shallowCopy(table.spec.columns);
        for (var col in internalColumn) {
            Updraft.verify(!table.spec.columns[col], "table %s cannot have reserved column name %s", table.spec.name, col);
            newSpec.columns[col] = internalColumn[col];
        }
        buildIndices(newSpec);
        return [newSpec].concat(createSetTableSpecs(newSpec, verifyGetValue(newSpec.columns, table.key)));
    }
    function createChangeTableSpec(table) {
        var newSpec = {
            name: getChangeTableName(table.spec.name),
            columns: {
                key: Updraft.Column.Int().Key(),
                time: Updraft.Column.DateTime().Key(),
                change: Updraft.Column.JSON(),
            }
        };
        buildIndices(newSpec);
        return newSpec;
    }
    function createSetTableSpecs(spec, keyColumn) {
        var newSpecs = [];
        for (var col in spec.columns) {
            var column = spec.columns[col];
            if (column.type == Updraft.ColumnType.set) {
                var newSpec = {
                    name: getSetTableName(spec.name, col),
                    columns: {
                        key: keyColumn,
                        value: new Updraft.Column(column.element.type).Key(),
                        time: Updraft.Column.Int().Key()
                    }
                };
                buildIndices(newSpec);
                newSpecs.push(newSpec);
            }
        }
        return newSpecs;
    }
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
                    table.columns[parts[1]] = Updraft.Column.fromSql(parts[2]);
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
        Updraft.verify(matches, "bad format on index- couldn't determine column names from sql: %s", sql);
        return matches[1].split(",").map(function (x) { return x.trim(); });
    }
    function createTable(transaction, name, columns) {
        var cols = [];
        var pk = [];
        for (var col in columns) {
            var attrs = columns[col];
            var decl = void 0;
            switch (attrs.type) {
                case Updraft.ColumnType.set:
                    // ignore this column; values go into a separate table
                    Updraft.verify(!attrs.isKey, "table %s cannot have a key on set column %s", name, col);
                    break;
                default:
                    decl = col + " " + Updraft.Column.sql(attrs);
                    cols.push(decl);
                    if (attrs.isKey) {
                        pk.push(col);
                    }
                    break;
            }
        }
        Updraft.verify(pk.length, "table %s has no keys", name);
        cols.push("PRIMARY KEY(" + pk.join(", ") + ")");
        return transaction.executeSql("CREATE TABLE " + name + " (" + cols.join(", ") + ")");
    }
    function dropTable(transaction, name) {
        return transaction.executeSql("DROP TABLE " + name);
    }
    function createIndices(transaction, schema, spec, force) {
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
                var sql = "CREATE INDEX IF NOT EXISTS " + getIndexName(index) + " ON " + spec.name + " (" + index.join(", ") + ")";
                p = p.then(function () { return transaction.executeSql(sql); });
            }
        });
        return p;
    }
    function copyData(transaction, oldName, newName, oldColumns, newColumns, renamedColumns) {
        var oldTableColumns = Object.keys(oldColumns).filter(function (col) { return (col in newColumns) || (col in renamedColumns); });
        var newTableColumns = oldTableColumns.map(function (col) { return (col in renamedColumns) ? renamedColumns[col] : col; });
        var p2 = Promise.resolve();
        if (oldTableColumns.length && newTableColumns.length) {
            var stmt = "INSERT INTO " + newName + " (" + newTableColumns.join(", ") + ") ";
            stmt += "SELECT " + oldTableColumns.join(", ") + " FROM " + oldName + ";";
            p2 = transaction.executeSql(stmt);
        }
        return p2;
    }
    function migrateChangeTable(transaction, changeTableName, oldColumns, newColumns, renamedColumns) {
        var deletedColumns = Object.keys(oldColumns).filter(function (col) { return !(col in newColumns) && !(col in renamedColumns); });
        var p2 = Promise.resolve();
        if (renamedColumns || deletedColumns) {
            p2 = p2.then(function () {
                return transaction.each("SELECT " + ROWID + ", change"
                    + " FROM " + changeTableName, [], function (selectChangeTransaction, row) {
                    var change = Updraft.fromText(row.change);
                    var changed = false;
                    for (var oldCol in renamedColumns) {
                        var newCol = renamedColumns[oldCol];
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
                                + " WHERE " + ROWID + "=?", [Updraft.toText(change), row[ROWID]]);
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
    function verifyGetValue(element, field) {
        Updraft.verify(field in element, "element does not contain field %s: %s", field, element);
        return element[field];
    }
    function insert(transaction, tableName, columns, values) {
        var questionMarks = values.map(function (v) { return "?"; });
        Updraft.verify(columns.indexOf(ROWID) == -1, "should not insert with rowid column");
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
            if (column.type == Updraft.ColumnType.set && (col in element)) {
                var set = element[col];
                if (set.size) {
                    var setValues = [];
                    var placeholders = [];
                    set.forEach(function (value) {
                        placeholders.push("(?, ?, ?)");
                        setValues.push(time, table.keyValue(element), column.element.serialize(value));
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
                var mutation = applyChanges(baseline, changes, table.spec);
                var promises = [];
                if (!mutation.isChanged) {
                    // mark it as latest (and others as not)
                    return setLatest(transaction, table, keyValue, baseline.rowid);
                }
                else {
                    // invalidate old latest rows
                    // insert new latest row
                    var element = Updraft.mutate(mutation.element, (_a = {},
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
        var inCondition = Updraft.keyOf({ $in: false });
        var hasCondition = Updraft.keyOf({ $has: false });
        var hasAnyCondition = Updraft.keyOf({ $hasAny: false });
        var hasAllConditions = Updraft.keyOf({ $hasAll: false });
        var conditions = [];
        var values = [];
        Object.keys(query).forEach(function (col) {
            Updraft.verify((col in table.spec.columns) || (col in internalColumn), "attempting to query based on column '%s' not in schema (%s)", col, table.spec.columns);
            var column = (col in internalColumn) ? internalColumn[col] : table.spec.columns[col];
            var spec = query[col];
            var found = false;
            for (var condition in numericConditions) {
                if (Updraft.hasOwnProperty.call(spec, condition)) {
                    conditions.push("(" + col + numericConditions[condition] + "?)");
                    var value = spec[condition];
                    Updraft.verify(parseInt(value, 10) == value, "condition %s must have a numeric argument: %s", condition, value);
                    values.push(value);
                    found = true;
                    break;
                }
            }
            if (!found) {
                if (Updraft.hasOwnProperty.call(spec, inCondition)) {
                    Updraft.verify(Array.isArray(spec[inCondition]), "must be an array: %s", spec[inCondition]);
                    conditions.push(col + " IN (" + spec[inCondition].map(function (x) { return "?"; }).join(", ") + ")");
                    var inValues = spec[inCondition];
                    inValues = inValues.map(function (val) { return column.serialize(val); });
                    values.push.apply(values, inValues);
                    found = true;
                }
            }
            if (!found) {
                var has = Updraft.hasOwnProperty.call(spec, hasCondition);
                var hasAny = Updraft.hasOwnProperty.call(spec, hasAnyCondition);
                var hasAll = Updraft.hasOwnProperty.call(spec, hasAllConditions);
                if (has || hasAny || hasAll) {
                    var existsSetValues = function (setValues, args) {
                        var escapedValues = setValues.map(function (value) { return column.element.serialize(value); });
                        args.push.apply(args, escapedValues);
                        return "EXISTS ("
                            + "SELECT 1 FROM " + getSetTableName(table.spec.name, col)
                            + " WHERE value IN (" + setValues.map(function (x) { return "?"; }).join(", ") + ")"
                            + " AND key=" + table.spec.name + "." + table.key
                            + " AND time=" + table.spec.name + "." + internal_column_time
                            + ")";
                    };
                    if (has) {
                        var hasValue = spec[hasCondition];
                        Updraft.verify(!Array.isArray(hasValue), "must not be an array: %s", hasValue);
                        var condition = existsSetValues([hasValue], values);
                        conditions.push(condition);
                    }
                    else if (hasAny) {
                        var hasAnyValues = spec[hasAnyCondition];
                        Updraft.verify(Array.isArray(hasAnyValues), "must be an array: %s", hasAnyValues);
                        var condition = existsSetValues(hasAnyValues, values);
                        conditions.push(condition);
                    }
                    else if (hasAll) {
                        var hasAllValues = spec[hasAllConditions];
                        Updraft.verify(Array.isArray(hasAllValues), "must be an array: %s", hasAllValues);
                        for (var _i = 0; _i < hasAllValues.length; _i++) {
                            var hasValue = hasAllValues[_i];
                            var condition = existsSetValues([hasValue], values);
                            conditions.push(condition);
                        }
                    }
                    found = true;
                }
            }
            if (!found) {
                if (column.type == Updraft.ColumnType.bool) {
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
                    Updraft.verify(!arg.match(/(\$|\^|\*|\.|\(|\)|\[|\]|\?)/), "RegExp search only supports simple wildcards (.* and .): %s", arg);
                    conditions.push("(" + col + " LIKE ?)");
                    values.push(arg);
                    found = true;
                }
                Updraft.verify(found, "unknown query condition for %s: %s", col, spec);
            }
        });
        var fields = Updraft.assign({}, opts.fields || table.spec.columns, (_a = {}, _a[internal_column_time] = true, _a));
        var columns = selectableColumns(table.spec, fields);
        var stmt = "SELECT " + (opts.count ? COUNT : columns.join(", "));
        stmt += " FROM " + table.spec.name;
        if (conditions.length) {
            stmt += " WHERE " + conditions.join(" AND ");
        }
        if (opts.orderBy) {
            var col = Updraft.keyOf(opts.orderBy);
            var order = opts.orderBy[col];
            stmt += " ORDER BY " + col + " " + (order == Updraft.OrderBy.ASC ? "ASC" : "DESC");
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
                var promises = rows.map(function (element) { return loadExternals(transaction, table, element, opts.fields); });
                return Promise.all(promises)
                    .then(function () {
                    var results = [];
                    for (var i = 0; i < rows.length; i++) {
                        var row = deserializeRow(table.spec, rows[i]);
                        for (var col in internalColumn) {
                            if (!opts.fields || !(col in opts.fields)) {
                                delete row[col];
                            }
                        }
                        var obj = clazz ? new clazz(row) : row;
                        results.push(obj);
                    }
                    return results;
                });
            }
        });
        var _a;
    }
    function popValue(element, field) {
        var ret = verifyGetValue(element, field);
        delete element[field];
        return ret;
    }
    function selectBaseline(transaction, table, keyValue) {
        var fieldSpec = (_a = {},
            _a[ROWID] = true,
            _a[internal_column_time] = true,
            _a[internal_column_deleted] = true,
            _a
        );
        Object.keys(table.spec.columns).forEach(function (col) { return fieldSpec[col] = true; });
        var query = (_b = {},
            _b[table.key] = keyValue,
            _b[internal_column_composed] = false,
            _b
        );
        var opts = {
            fields: fieldSpec,
            orderBy: (_c = {}, _c[internal_column_time] = Updraft.OrderBy.DESC, _c),
            limit: 1
        };
        return runQuery(transaction, table, query, opts, null)
            .then(function (baselineResults) {
            var baseline = {
                element: {},
                time: 0,
                rowid: -1
            };
            if (baselineResults.length) {
                var element = baselineResults[0];
                baseline.element = element;
                baseline.time = popValue(element, internal_column_time);
                baseline.rowid = popValue(element, ROWID);
            }
            else {
                baseline.element[table.key] = keyValue;
            }
            return baseline;
        });
        var _a, _b, _c;
    }
    function loadExternals(transaction, table, element, fields) {
        var promises = [];
        Object.keys(table.spec.columns).forEach(function loadExternalsForEach(col) {
            if (!fields || (col in fields && fields[col])) {
                var column = table.spec.columns[col];
                if (column.type == Updraft.ColumnType.set) {
                    var set = element[col] = element[col] || new Set();
                    var keyValue = verifyGetValue(element, table.key);
                    var time = verifyGetValue(element, internal_column_time);
                    var p = transaction.executeSql("SELECT value "
                        + "FROM " + getSetTableName(table.spec.name, col)
                        + " WHERE key=?"
                        + " AND time=?", [keyValue, time], function loadExternalsSqlCallback(tx, results) {
                        for (var _i = 0; _i < results.length; _i++) {
                            var row = results[_i];
                            set.add(column.element.deserialize(row.value));
                        }
                    });
                    promises.push(p);
                }
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
    function applyChanges(baseline, changes, spec) {
        var element = baseline.element;
        var time = baseline.time;
        for (var i = 0; i < changes.length; i++) {
            var row = changes[i];
            var mutator = deserializeChange(row.change, spec);
            element = Updraft.mutate(element, mutator);
            time = Math.max(time, row.time);
        }
        var isChanged = Updraft.isMutated(baseline.element, element) || baseline.rowid == -1;
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
        return Object.keys(cols).filter(function (col) { return (col == ROWID) || (col in internalColumn) || ((col in spec.columns) && (spec.columns[col].type != Updraft.ColumnType.set)); });
    }
    function serializeValue(spec, col, value) {
        if (col in spec.columns) {
            var x = spec.columns[col].serialize(value);
            return x;
        }
        Updraft.verify(typeof value == "number" || value, "bad value");
        return value;
    }
    function deserializeValue(spec, col, value) {
        if (col in spec.columns) {
            value = spec.columns[col].deserialize(value);
        }
        return value;
    }
    var setKey = Updraft.keyOf({ $set: false });
    function serializeChange(change, spec) {
        for (var col in change) {
            var val = change[col];
            if (Updraft.hasOwnProperty.call(val, setKey)) {
                change[col] = Updraft.shallowCopy(change[col]);
                change[col][setKey] = serializeValue(spec, col, change[col][setKey]);
            }
        }
        return Updraft.toText(change);
    }
    function deserializeChange(text, spec) {
        var change = Updraft.fromText(text);
        for (var col in change) {
            var val = change[col];
            if (Updraft.hasOwnProperty.call(val, setKey)) {
                change[col][setKey] = deserializeValue(spec, col, change[col][setKey]);
            }
        }
        return change;
    }
    function deserializeRow(spec, row) {
        var ret = {};
        for (var col in row) {
            var src = row[col];
            if (src != null) {
                ret[col] = deserializeValue(spec, col, src);
            }
        }
        return ret;
    }
    function createStore(params) {
        return new Store(params);
    }
    Updraft.createStore = createStore;
    var _a;
})(Updraft || (Updraft = {}));
///<reference path="./Store"/>
"use strict";
if (typeof module !== "undefined") {
    module.exports = Updraft;
}
"use strict";
///<reference path="../typings/tsd.d.ts"/>
///<reference path="./Database"/>
"use strict";
var Updraft;
(function (Updraft) {
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
    function createSQLiteWrapper(db) {
        return new SQLiteWrapper(db);
    }
    Updraft.createSQLiteWrapper = createSQLiteWrapper;
})(Updraft || (Updraft = {}));
///<reference path="./websql.d.ts"/>
///<reference path="./Database"/>
"use strict";
var Updraft;
(function (Updraft) {
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
                var escapedString = this.stringify(sql, params);
                this.traceCallback(escapedString);
            }
        };
        WebsqlWrapper.prototype.stringify = function (sql, params) {
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
            return escapedString;
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
                    console.error("error executing '" + _this.stringify(sql, params) + "': ", error);
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
                    console.error("error executing '" + _this.stringify(sql, params) + "': ", error);
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
    function createWebsqlWrapper(name, version, displayName, estimatedSize, traceCallback) {
        return new WebsqlWrapper(name, version, displayName, estimatedSize, traceCallback);
    }
    Updraft.createWebsqlWrapper = createWebsqlWrapper;
})(Updraft || (Updraft = {}));

//# sourceMappingURL=updraft.js.map
