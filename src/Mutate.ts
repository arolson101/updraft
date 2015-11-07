// written to React"s immutability helpers spec
// see https://facebook.github.io/react/docs/update.html

///<reference path="../typings/tsd.d.ts"/>
"use strict";

import assign = require("object-assign");
import invariant = require("invariant");
import equal = require("deep-equal");

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


function invariantArrayCase(value: any, spec: any, c: string) {
  invariant(
    Array.isArray(value),
    "mutate(): expected target of %s to be an array; got %s.",
    c,
    value
  );
  let specValue = spec[c];
  invariant(
    Array.isArray(specValue),
    "mutate(): expected spec of %s to be an array; got %s. " +
    "Did you forget to wrap your parameter in an array?",
    c,
    specValue
  );
}

function invariantSetCase(value: any, spec: any, c: string) {
  invariant(
    value instanceof Set,
    "mutate(): expected target of %s to be a set; got %s.",
    c,
    value
  );
  let specValue = spec[c];
  invariant(
    Array.isArray(specValue),
    "mutate(): expected spec of %s to be an array; got %s. " +
    "Did you forget to wrap your parameter in an array?",
    c,
    specValue
  );
}

export function mutate<Element, Mutator>(value: Element, spec: Mutator): Element {
  invariant(
    typeof spec === "object",
    "mutate(): You provided a key path to mutate() that did not contain one " +
    "of %s. Did you forget to include {%s: ...}?",
    Object.keys(command).join(", "),
    command.set
  );

	// invariant(
	// 	Object.keys(spec).reduce( function(previousValue: boolean, currentValue: string): boolean {
	// 		return previousValue && (keyOf(spec[currentValue]) in command);
	// 	}, true),
	// 	"mutate(): argument has an unknown key; supported keys are (%s).  mutator: %s",
	// 	Object.keys(command).join(", "),
	// 	spec
	// );

  if (hasOwnProperty.call(spec, command.set)) {
    invariant(
      Object.keys(spec).length === 1,
      "Cannot have more than one key in an object with %s",
      command.set
    );

    return equal(value, spec[command.set]) ? value : spec[command.set];
  }

	if (hasOwnProperty.call(spec, command.increment)) {
		invariant(
			typeof(value) === "number" && typeof(spec[command.increment]) === "number",
			"Source (%s) and argument (%s) to %s must be numbers",
			value,
			spec[command.increment],
			command.increment
		);

		return value + spec[command.increment];
	}

  let nextValue = <any>shallowCopy(value);
  let changed = false;

  if (hasOwnProperty.call(spec, command.merge)) {
    let mergeObj = spec[command.merge];
    invariant(
      mergeObj && typeof mergeObj === "object",
      "mutate(): %s expects a spec of type 'object'; got %s",
      command.merge,
      mergeObj
    );
    invariant(
      nextValue && typeof nextValue === "object",
      "mutate(): %s expects a target of type 'object'; got %s",
      command.merge,
      nextValue
    );
    assign(nextValue, spec[command.merge]);
    return equal(value, nextValue) ? value : nextValue;
  }

  if (hasOwnProperty.call(spec, command.deleter) && (typeof value === "object") && !(value instanceof Set)) {
		let key = spec[command.merge];
    invariant(
      key && typeof key === "string",
      "mutate(): %s expects a spec of type 'string'; got %s",
      command.deleter,
      key
    );
    if (key in nextValue) {
      delete nextValue[key];
      return nextValue;
    }
    else {
      return value;
    }
	}

  if (hasOwnProperty.call(spec, command.push)) {
    invariantArrayCase(value, spec, command.push);
    spec[command.push].forEach(function(item: any) {
      (<any>nextValue).push(item);
    });
    return equal(value, nextValue) ? value : nextValue;
  }

  if (hasOwnProperty.call(spec, command.unshift)) {
    invariantArrayCase(value, spec, command.unshift);
    if (spec[command.unshift].length) {
      (<any>nextValue).unshift.apply(nextValue, spec[command.unshift]);
      return nextValue;
    }
    else {
      return value;
    }
  }

  if (hasOwnProperty.call(spec, command.splice)) {
    invariant(
      Array.isArray(value),
      "Expected %s target to be an array; got %s",
      command.splice,
      value
    );
    invariant(
      Array.isArray(spec[command.splice]),
      "mutate(): expected spec of %s to be an array of arrays; got %s. " +
      "Did you forget to wrap your parameters in an array?",
      command.splice,
      spec[command.splice]
    );
    spec[command.splice].forEach(function(args: any) {
      invariant(
        Array.isArray(args),
        "mutate(): expected spec of %s to be an array of arrays; got %s. " +
        "Did you forget to wrap your parameters in an array?",
        command.splice,
        spec[command.splice]
      );
      (<any>nextValue).splice.apply(nextValue, args);
    });
    return equal(value, nextValue) ? value : nextValue;
  }

  if (hasOwnProperty.call(spec, command.add)) {
    invariantSetCase(value, spec, command.add);
    spec[command.add].forEach(function(item: any) {
      if (!(<Set<any>>nextValue).has(item)) {
        (<Set<any>>nextValue).add(item);
        changed = true;
      }
    });
    return changed ? nextValue : value;
	}

  if (hasOwnProperty.call(spec, command.deleter) && (value instanceof Set)) {
    invariantSetCase(value, spec, command.deleter);
    spec[command.deleter].forEach(function(item: any) {
      if ((<Set<any>>nextValue).delete(item)) {
        changed = true;
      }
    });
    return changed ? nextValue : value;
	}

	for (let k in spec) {
		if (!(command.hasOwnProperty(k) && command[k])) {
      let oldValue = value[k];
      let newValue = mutate(oldValue, spec[k]);
      if (oldValue !== newValue) {
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
