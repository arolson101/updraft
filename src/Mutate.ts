// written to React"s immutability helpers spec
// see https://facebook.github.io/react/docs/update.html

///<reference path="../typings/tsd.d.ts"/>
"use strict";

import { assign } from "./assign";
import { verify } from "./verify";

interface setter<T> {
	$set: T;
}

interface increment {
	$inc: number;
}

interface push<T> {
	$push: Array<T>;
}

interface unshift<T> {
	$unshift: Array<T>;
}

interface splice<T> {
	// array.splice(start, deleteCount[, item1[, item2[, ...]]])
	$splice: Array<Array<number | T>>;
}

interface merge<T> {
	$merge: T;
}

interface add<T> {
	$add: T | Array<T>;
}

interface deleter<T> {
	$delete: T | Array<T>;
}

type primitive<T> =
	setter<T>;

export type bool = primitive<boolean>;
export type num = primitive<number> | increment;
export type str = primitive<string>;
export type obj = primitive<Object> | merge<Object> | deleter<string>;

type array<T> =
	setter<Array<T>> |
	push<T> |
	unshift<T> |
	splice<T> |
	merge<T>;

export type strArray = array<string>;
export type numArray = array<number>;
export type objArray = array<Object>;

type set<T> =
	setter<Set<T>> |
	add<T> |
	deleter<T>;

export type strSet = set<string>;


function shallowCopy<T>(x: T): T {
  if (Array.isArray(x)) {
    return (<any>x).concat();
  }
  else if (x instanceof Set) {
    return <any>new Set<T>(<any>x);
  }
  else if (x && typeof x === "object") {
    return assign(new (<any>x).constructor(), x);
  }
  else {
    return x;
  }
}

function shallowEqual<T>(a: T, b: T): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    let aa: any[] = <any>a;
    let bb: any[] = <any>b;
    if (aa.length == bb.length) {
      for (let i = 0; i < aa.length; i++) {
        if (aa[i] != bb[i]) {
          return false;
        }
      }
      return true;
    }
    return false;
  }
  else if (a instanceof Set && b instanceof Set) {
    let aa: Set<any> = <any>a;
    let bb: Set<any> = <any>b;
    if (aa.size == bb.size) {
      for (let elt in aa) {
        if (!bb.has(elt)) {
          return false;
        }
      }
      return true;
    }
    return false;
  }
  else if (typeof a == "object" && typeof b == "object") {
    let akeys = Object.keys(a);
    let bkeys = Object.keys(b);
    if (akeys.length == bkeys.length) {
      for (let key of akeys) {
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


export let hasOwnProperty = {}.hasOwnProperty;
export function keyOf(obj: Object) { return Object.keys(obj)[0]; }

let command = {
  set: keyOf({$set: null}),
  increment: keyOf({$inc: null}),
  push: keyOf({$push: null}),
  unshift: keyOf({$unshift: null}),
  splice: keyOf({$splice: null}),
  merge: keyOf({$merge: null}),
  add: keyOf({$add: null}),
  deleter: keyOf({$delete: null}),
};


function verifyArrayCase(value: any, spec: any, c: string) {
  verify(
    Array.isArray(value),
    "mutate(): expected target of %s to be an array; got %s.",
    c,
    value
  );
  let specValue = spec[c];
  verify(
    Array.isArray(specValue),
    "mutate(): expected spec of %s to be an array; got %s. " +
    "Did you forget to wrap your parameter in an array?",
    c,
    specValue
  );
}

function verifySetCase(value: any, spec: any, c: string) {
  verify(
    value instanceof Set,
    "mutate(): expected target of %s to be a set; got %s.",
    c,
    value
  );
  let specValue = spec[c];
  verify(
    Array.isArray(specValue),
    "mutate(): expected spec of %s to be an array; got %s. " +
    "Did you forget to wrap your parameter in an array?",
    c,
    specValue
  );
}

export function mutate<Element, Mutator>(value: Element, spec: Mutator): Element {
  verify(
    typeof spec === "object",
    "mutate(): You provided a key path to mutate() that did not contain one " +
    "of %s. Did you forget to include {%s: ...}?",
    Object.keys(command).join(", "),
    command.set
  );

	// verify(
	// 	Object.keys(spec).reduce( function(previousValue: boolean, currentValue: string): boolean {
	// 		return previousValue && (keyOf(spec[currentValue]) in command);
	// 	}, true),
	// 	"mutate(): argument has an unknown key; supported keys are (%s).  mutator: %s",
	// 	Object.keys(command).join(", "),
	// 	spec
	// );

  if (hasOwnProperty.call(spec, command.set)) {
    verify(
      Object.keys(spec).length === 1,
      "Cannot have more than one key in an object with %s",
      command.set
    );

    return shallowEqual(value, spec[command.set]) ? value : spec[command.set];
  }

	if (hasOwnProperty.call(spec, command.increment)) {
		verify(
			typeof(value) === "number" && typeof(spec[command.increment]) === "number",
			"Source (%s) and argument (%s) to %s must be numbers",
			value,
			spec[command.increment],
			command.increment
		);

		return value + spec[command.increment];
	}

  let changed = false;

  if (hasOwnProperty.call(spec, command.merge)) {
    let mergeObj = spec[command.merge];
    let nextValue = <any>shallowCopy(value);
    verify(
      mergeObj && typeof mergeObj === "object",
      "mutate(): %s expects a spec of type 'object'; got %s",
      command.merge,
      mergeObj
    );
    verify(
      nextValue && typeof nextValue === "object",
      "mutate(): %s expects a target of type 'object'; got %s",
      command.merge,
      nextValue
    );
    assign(nextValue, spec[command.merge]);
    return shallowEqual(value, nextValue) ? value : nextValue;
  }

  if (hasOwnProperty.call(spec, command.deleter) && (typeof value === "object") && !(value instanceof Set)) {
		let key = spec[command.merge];
    verify(
      key && typeof key === "string",
      "mutate(): %s expects a spec of type 'string'; got %s",
      command.deleter,
      key
    );
    if (key in value) {
      let nextValue = <any>shallowCopy(value);
      delete nextValue[key];
      return nextValue;
    }
    else {
      return value;
    }
	}

  if (hasOwnProperty.call(spec, command.push)) {
    verifyArrayCase(value, spec, command.push);
    if (spec[command.push].length) {
      let nextValue: any[] = <any>shallowCopy(value);
      nextValue.push.apply(nextValue, spec[command.push]);
      return <any>nextValue;
    }
    else {
      return value;
    }
  }

  if (hasOwnProperty.call(spec, command.unshift)) {
    verifyArrayCase(value, spec, command.unshift);
    if (spec[command.unshift].length) {
      let nextValue: any[] = <any>shallowCopy(value);
      nextValue.unshift.apply(nextValue, spec[command.unshift]);
      return <any>nextValue;
    }
    else {
      return value;
    }
  }

  if (hasOwnProperty.call(spec, command.splice)) {
    let nextValue: any = <any>shallowCopy(value);
    verify(
      Array.isArray(value),
      "Expected %s target to be an array; got %s",
      command.splice,
      value
    );
    verify(
      Array.isArray(spec[command.splice]),
      "mutate(): expected spec of %s to be an array of arrays; got %s. " +
      "Did you forget to wrap your parameters in an array?",
      command.splice,
      spec[command.splice]
    );
    spec[command.splice].forEach(function(args: any) {
      verify(
        Array.isArray(args),
        "mutate(): expected spec of %s to be an array of arrays; got %s. " +
        "Did you forget to wrap your parameters in an array?",
        command.splice,
        spec[command.splice]
      );
      (<any>nextValue).splice.apply(nextValue, args);
    });
    return shallowEqual(nextValue, value) ? value : nextValue;
  }

  if (hasOwnProperty.call(spec, command.add)) {
    let nextValue: Set<any> = <any>shallowCopy(value);
    verifySetCase(value, spec, command.add);
    spec[command.add].forEach(function(item: any) {
      if (!nextValue.has(item)) {
        nextValue.add(item);
        changed = true;
      }
    });
    return changed ? <any>nextValue : value;
	}

  if (hasOwnProperty.call(spec, command.deleter) && (value instanceof Set)) {
    let nextValue: Set<any> = <any>shallowCopy(value);
    verifySetCase(value, spec, command.deleter);
    spec[command.deleter].forEach(function(item: any) {
      if (nextValue.delete(item)) {
        changed = true;
      }
    });
    return changed ? <any>nextValue : value;
	}

  let nextValue: any;
	for (let k in spec) {
		if (!(command.hasOwnProperty(k) && command[k])) {
      let oldValue = value[k];
      let newValue = mutate(oldValue, spec[k]);
      if (oldValue !== newValue) {
        if (!nextValue) {
          nextValue = <any>shallowCopy(value);
        }
        nextValue[k] = newValue;
        changed = true;
      }
		}
	}

  return changed ? nextValue : value;
}


export function isMutated<Element>(a: Element, b: Element): boolean {
  // TODO: this isn"t right because mutate will always return a new object
  return a !== b;
}
