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


function keyOf(obj) {
  if(typeof(obj.key) === 'function') {
    return obj.key();
  }
  if(typeof(obj) === 'object' && typeof(obj.toString) === 'function') {
    return obj.toString();
  }
  return obj;
}


module.exports.startsWith = startsWith;
module.exports.clone = clone;
module.exports.keyOf = keyOf;