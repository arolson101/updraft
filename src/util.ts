module Updraft {

  /**
   * @private
   */
  export function startsWith(str: string, val: string) {
    return str.lastIndexOf(val, 0) === 0;
  }


  /**
   * @private
   */
  export function clone(obj: any): any {
    var copy: any;

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

  /**
   * @private
   */
  export function keyOf(obj: any): string {
    if(obj instanceof Instance) {
      return (<Instance>obj)._primaryKey();
    }
    if(typeof(obj) === 'object' && typeof(obj.toString) === 'function') {
      return obj.toString();
    }
    return obj;
  }


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
  export function createClass(proto: Function, descriptor: ClassTemplate<Instance>) {
    console.assert(typeof proto === 'function');
    console.assert(typeof descriptor === 'object');

    proto.prototype = Object.create(Instance.prototype);
    proto.prototype.constructor = proto;

    for(var key in descriptor) {
      var value = descriptor[key];
      if(typeof value === 'function') {
        proto.prototype[key] = value;
      } else {
        proto[key] = descriptor[key];
      }
    }

    return proto;
  }

}
