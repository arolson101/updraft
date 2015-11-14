"use strict";

namespace Updraft {
  function makePrintable(x: any): string {
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
  export function verify(condition: any, format: string, ...args: any[]) {
    if (!condition) {
      let argIndex = 0;
      let error = new Error(
        format.replace(/%s/g, function() { return makePrintable(args[argIndex++]); })
      );
  
      (<any>error).framesToPop = 1; // we don't care about verify's own frame
      throw error;
    }
  }
}
