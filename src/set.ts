/// <reference path="./websql.d.ts" />

module Updraft {

  /**
   * State that a value can be in
   * @private
   * @enum
   */
  enum State {
    saved =   1 << 1,
    added =   1 << 2,
    removed = 1 << 3
  }


  interface StateMap {
    [key: string]: State;
  }


  export interface DirtyFunc {
    (): void;
  }


  export class Set {
    private _dirtyFcn: DirtyFunc;
    private _states: StateMap;

    /**
     * @param dirtyFcn - function to call when set's state changes
     */
    constructor(dirtyFcn: DirtyFunc) {
      this._dirtyFcn = dirtyFcn;
      this._states = {};
    }


    /**
     * load values from a database; initialize values
     * @private
     * @param results - database row
     */
    initFromDb(results: SQLResultSet) {
      for(var i=0; i<results.rows.length; i++) {
        var row = results.rows.item(i);
        console.assert(Object.keys(row).length === 1);
        var item: string = row[Object.keys(row)[0]];
        this._states[item] = State.saved;
      }
    }


    /**
     * Set all values from an array.  <tt>Add</tt>s all values, and <tt>remove</tt>s any existing set values that are
     * not in <tt>arr</tt>
     * @param objects - array of values to assign.  If values are {@link Instance}s, assign their <tt>_primaryKey()</tt>s instead
     */
    assign(objects: string[]): void {
      this.clear();
      this.add.apply(this, objects);
    }


    /**
     * Removes all objects from set
     */
    clear(): void {
      for(var val in this._states) {
        this._states[val] = State.removed;
      }
    }


    /**
     * Adds value(s) to set
     * @param objects - array of values to assign.  If values are {@link Instance}s, assign their <tt>_primaryKey()</tt>s instead
     */
    add(...objects: string[]): void {
      var dirty = false;
      var self = this;
      objects
      .map(keyOf)
      .forEach(function(arg: string) {
        console.assert(typeof(arg) !== 'object');
        if(self._states[arg] !== State.saved) {
          self._states[arg] = State.added;
          dirty = true;
        }
      });
      if(dirty) {
        this._dirtyFcn();
      }
    }


    /**
     * Alias for {@link add}
     * @param objects - values to add
     */
    push(...objects: string[]): void {
      return this.add.apply(this, objects);
    }


    /**
     * Removes value(s) from set
     * @param objects - values to remove
     */
    remove(...objects: string[]): void {
      var dirty = false;
      var self = this;
      objects
      .map(keyOf)
      .forEach(function(arg: string) {
        self._states[arg] = State.removed;
        dirty = true;
      });
      if(dirty) {
        this._dirtyFcn();
      }
    }


    /**
     * Gets values from set which match the given <tt>stateMask</tt>
     * @param stateMask - states of objects to return
     * @return values that match <tt>stateMask</tt>
     * @private
     */
    private which(stateMask: State): string[] {
      var self = this;
      return Object.keys(this._states)
      .filter(function(element, index, array): boolean {
        return (self._states[<any>element] & stateMask) ? true : false;
      });
    }


    /**
     * Gets valid (added or saved) values of the set
     */
    values(): string[] {
      return this.which(State.saved | State.added);
    }


    /**
     * Gets the values that have been added to the set since it was last saved
     */
    getAdded(): string[] {
      return this.which(State.added);
    }


    /**
     * Gets the values that have been removed from the set since it was last saved
     */
    getRemoved(): string[] {
      return this.which(State.removed);
    }


    /**
     * Marks the values in the set as saved.  Any objects marked 'remove' will be
     * expunged from the set.
     */
    clearChanges(): void {
      var newValues: StateMap = {};
      for(var val in this._states) {
        if(this._states[val] !== State.removed) {
          newValues[val] = State.saved;
        }
      }
      this._states = newValues;
    }
  }

}
