"use strict";

namespace Updraft {
  function reviver(key: string, value: any): any {
    if (typeof value === "string") {
      let regexp = /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ$/.exec(value);
      if (regexp) {
        return new Date(value);
      }
    }
    return value;
  }
  
  export function toText(o: any): string {
    return JSON.stringify(o);
  }
  
  export function fromText(text: string): any {
    return JSON.parse(text, reviver);
  }
}
