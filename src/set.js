'use strict';

var Util = require('./util');

/**
 * State that a value can be in
 * @private
 * @enum
 */
var State = {
  saved:    1 << 1,
  added:    1 << 2,
  removed:  1 << 3
};


/**
 * @class
 * @param {function} dirtyFcn - function to call when set's state changes
 */
function Set(dirtyFcn) {
  this.dirtyFcn = dirtyFcn;
  this._values = {};
}


/**
 * load values from a database; initialize values
 * @private
 * @param {SQLResultSet} results - database row
 */
Set.prototype.initFromDb = function(results) {
  for(var i=0; i<results.rows.length; i++) {
    var row = results.rows.item(i);
    console.assert(Object.keys(row).length === 1);
    var item = row[Object.keys(row)[0]];
    this._values[item] = State.saved;
  }
};


/**
 * Set all values from an array.  <tt>Add</tt>s all values, and <tt>remove</tt>s any existing set values that are
 * not in <tt>arr</tt>
 * @param {Array} arr - array of values to assign.  If values are {@link Instance}s, assign their <tt>key()</tt>s instead
 */
Set.prototype.assign = function(arr) {
  this.clear();
  this.add.apply(this, arr);
};


/**
 * Removes all objects from set
 */
Set.prototype.clear = function() {
  for(var val in this._values) {
    this._values[val] = State.removed;
  }
};


/**
 * Adds value(s) to set
 * @param {object[]} arguments - values to add
 */
Set.prototype.add = function() {
  var dirty = false;
  var self = this;
  Array.prototype.slice.call(arguments)
  .map(Util.keyOf)
  .forEach(function(arg) {
    console.assert(typeof(arg) !== 'object');
    if(self._values[arg] !== State.saved) {
      self._values[arg] = State.added;
      dirty = true;
    }
  });
  if(dirty) {
    this.dirtyFcn();
  }
};


/**
 * Alias for {@link Set#add}
 * @param {object[]} arguments - values to add
 */
Set.prototype.push = function() {
  return this.add.apply(this, arguments);
};


/**
 * Removes value(s) from set
 * @param {object[]} arguments - values to remove
 */
Set.prototype.remove = function() {
  var dirty = false;
  var self = this;
  Array.prototype.slice.call(arguments)
  .map(Util.keyOf)
  .forEach(function(arg) {
    self._values[arg] = State.removed;
    dirty = true;
  });
  if(dirty) {
    this.dirtyFcn();
  }
};


/**
 * Gets values from set which match the given <tt>stateMask</tt>
 * @param {int} stateMask - states of objects to return
 * @return {Array} - values that match <tt>stateMask</tt>
 * @private
 */
Set.prototype.which = function(stateMask) {
  var self = this;
  return Object.keys(this._values)
  .filter(function(val) {
    return (self._values[val] & stateMask);
  });
};


/**
 * Gets valid (added or saved) values of the set
 * @return {Array}
 */
Set.prototype.values = function() {
  return this.which(State.saved | State.added);
};


/**
 * Gets the values that have been added to the set since it was last saved
 * @return {Array}
 */
Set.prototype.getAdded = function() {
  return this.which(State.added);
};


/**
 * Gets the values that have been removed from the set since it was last saved
 * @return {Array}
 */
Set.prototype.getRemoved = function() {
  return this.which(State.removed);
};


/**
 * Marks the values in the set as saved.  Any objects marked 'remove' will be
 * expunged from the set.
 */
Set.prototype.clearChanges = function() {
  var newValues = {};
  for(var val in this._values) {
    if(this._values[val] !== State.removed) {
      newValues[val] = State.saved;
    }
  }
  this._values = newValues;
};


module.exports = Set;
