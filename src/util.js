'use strict';

function startsWith(str, val) {
  return str.lastIndexOf(val, 0) === 0;
}


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

  // Handle Object
  if (obj instanceof Object) {
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


function inherits( child, Parent ) { 
  if (Parent.constructor == Function) {
    //Normal Inheritance 
    child.prototype = Object.create(Parent.prototype);
    child.prototype.constructor = child;
    child.prototype.parent = Parent.prototype;
  } else {
    //Pure Virtual Inheritance 
    child.prototype = Parent;
    child.prototype.constructor = child;
    child.prototype.parent = Parent;
  }

  // inherit class methods
//  for (var prop in Parent) {
//    //if (typeof(Parent[prop]) === 'function' ) {
//      child[prop] = Parent[prop];
//    //}
//  }
  
  return child;
} 

module.exports.startsWith = startsWith;
module.exports.clone = clone;
module.exports.inherits = inherits;
