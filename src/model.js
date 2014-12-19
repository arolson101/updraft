'use strict';

var Util = require('./util');
var Query = require('./query');
/*jshint -W079 */
var Set = require('./set');


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


/**
 * Set state to be have no changes
 *
 * @private
 */
Instance.prototype.clearChanges = function() {
  this._changes = 0;
  for (var col in this.model.columns) {
    if(this.model.columns[col].type === 'set' && this['_' + col]) {
      this[col].clearChanges();
    }
  }
};


/**
 * Add a get/set property to the class
 *
 * @param {Model} model
 * @param proto - function prototype
 * @param {string} col - the column/field to set the property on
 * @param {int} propMask - the bits to set on <tt>_changes</tt>
 * @private
 */
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
          val = Util.keyOf(val);
          if (this[prop] !== val) {
            this[prop] = val;
            this._changes |= propMask;
          }
        }
      });
      break;

    case 'set':
      Object.defineProperty(proto, col, {
        get: function() {
          if(!(prop in this)) {
            var o = this;
            this[prop] = new Set(function() { o._changes |= propMask; });
          }
          return this[prop];
        },
        set: function(val) {
          if(!(prop in this)) {
            var o = this;
            this[prop] = new Set(function() { o._changes |= propMask; });
          }
          this[prop].assign(val);
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
 * @property {columnType} keyType - the type of the primary key for this table
 * @property {Object} columns - an object describing the fields of objects of this type
 * @property {string} columns.key - name of the field
 * @property {object} columns.value
 * @property {columnType} columns.value.type - 'int', 'bool', etc.
 * @property {bool} [columns.value.key=false] - set to true on the field that should be the primary key.  Only set one.
 * @property {bool} [columns.value.index=false] - create an index on this field
 * @property {Query} all - use to construct a query
 * @see ExampleModel
 * @class
 * @param {Store} store
 * @param {ClassTemplate} templ
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
    m[key] = Util.clone(templ[key]);
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
      case 'set':
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
 * @property {Set} setField - a searchable collection of objects
 * @see ClassTemplate, Model
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
