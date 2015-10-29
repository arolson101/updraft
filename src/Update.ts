// written to React's immutability helpers spec
// see https://facebook.github.io/react/docs/update.html
//

///<reference path="../typings/tsd.d.ts"/> 
import assign = require("object-assign");

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
  } else if (x instanceof Set) {
    return <any>new Set<T>(<any>x);
  } else if (x && typeof x === 'object') {
    return assign(new (<any>x).constructor(), x);
  } else {
    return x;
  }
}

var invariant = console.assert;
var hasOwnProperty = {}.hasOwnProperty;
function keyOf(obj: Object) { return Object.keys(obj)[0]; }

var COMMAND_SET = keyOf({$set: null});
var COMMAND_INCREMENT = keyOf({$inc: null});
var COMMAND_PUSH = keyOf({$push: null});
var COMMAND_UNSHIFT = keyOf({$unshift: null});
var COMMAND_SPLICE = keyOf({$splice: null});
var COMMAND_MERGE = keyOf({$merge: null});
var COMMAND_ADD = keyOf({$add: null});
var COMMAND_DELETE = keyOf({$delete: null});

var ALL_COMMANDS_SET = {
	COMMAND_SET: true,
	COMMAND_INCREMENT: true,
	COMMAND_PUSH: true,
	COMMAND_UNSHIFT: true,
	COMMAND_SPLICE: true,
	COMMAND_MERGE: true,
	COMMAND_ADD: true,
	COMMAND_DELETE: true,
};


function invariantArrayCase(value: any, spec: any, command: string) {
  invariant(
    Array.isArray(value),
    'update(): expected target of %s to be an array; got %s.',
    command,
    value
  );
  var specValue = spec[command];
  invariant(
    Array.isArray(specValue),
    'update(): expected spec of %s to be an array; got %s. ' +
    'Did you forget to wrap your parameter in an array?',
    command,
    specValue
  );
}

function invariantSetCase(value: any, spec: any, command: string) {
  invariant(
    value instanceof Set,
    'update(): expected target of %s to be a set; got %s.',
    command,
    value
  );
  var specValue = spec[command];
  invariant(
    Array.isArray(specValue),
    'update(): expected spec of %s to be an array; got %s. ' +
    'Did you forget to wrap your parameter in an array?',
    command,
    specValue
  );
}

export function update<Element, Updater>(value: Element, spec: Updater): Element {
  invariant(
    typeof spec === 'object',
    'update(): You provided a key path to update() that did not contain one ' +
    'of %s. Did you forget to include {%s: ...}?',
    Object.keys(ALL_COMMANDS_SET).join(', '),
    COMMAND_SET
  );
	
	// invariant(
	// 	Object.keys(spec).reduce( function(previousValue: boolean, currentValue: string): boolean {
	// 		return previousValue && (keyOf(spec[currentValue]) in ALL_COMMANDS_SET);
	// 	}, true),
	// 	'update(): argument has an unknown key; supported keys are (%s).  updater: %s',
	// 	Object.keys(ALL_COMMANDS_SET).join(', '),
	// 	spec
	// );

  if (hasOwnProperty.call(spec, COMMAND_SET)) {
    invariant(
      Object.keys(spec).length === 1,
      'Cannot have more than one key in an object with %s',
      COMMAND_SET
    );

    return spec[COMMAND_SET];
  }
	
	if (hasOwnProperty.call(spec, COMMAND_INCREMENT)) {
		invariant(
			typeof(value) === 'number' && typeof(spec[COMMAND_INCREMENT]) === 'number',
			'Source (%s) and argument (%s) to %s must be numbers',
			value,
			spec[COMMAND_INCREMENT],
			COMMAND_INCREMENT
		);
		
		return value + spec[COMMAND_INCREMENT];
	}

  var nextValue = shallowCopy(value);

  if (hasOwnProperty.call(spec, COMMAND_MERGE)) {
    var mergeObj = spec[COMMAND_MERGE];
    invariant(
      mergeObj && typeof mergeObj === 'object',
      'update(): %s expects a spec of type \'object\'; got %s',
      COMMAND_MERGE,
      mergeObj
    );
    invariant(
      nextValue && typeof nextValue === 'object',
      'update(): %s expects a target of type \'object\'; got %s',
      COMMAND_MERGE,
      nextValue
    );
    assign(nextValue, spec[COMMAND_MERGE]);
    return nextValue;
  }
	
  if (hasOwnProperty.call(spec, COMMAND_DELETE) && (typeof value === 'object') && !(value instanceof Set)) {
		var key = spec[COMMAND_MERGE];
    invariant(
      key && typeof key === 'string',
      'update(): %s expects a spec of type \'string\'; got %s',
      COMMAND_DELETE,
      key
    );
		delete nextValue[key];
    return nextValue;
	}

  if (hasOwnProperty.call(spec, COMMAND_PUSH)) {
    invariantArrayCase(value, spec, COMMAND_PUSH);
    spec[COMMAND_PUSH].forEach(function(item: any) {
      (<any>nextValue).push(item);
    });
    return nextValue;
  }
	
  if (hasOwnProperty.call(spec, COMMAND_UNSHIFT)) {
    invariantArrayCase(value, spec, COMMAND_UNSHIFT);
    (<any>nextValue).unshift.apply(nextValue, spec[COMMAND_UNSHIFT]);
    return nextValue;
  }
	
  if (hasOwnProperty.call(spec, COMMAND_SPLICE)) {
    invariant(
      Array.isArray(value),
      'Expected %s target to be an array; got %s',
      COMMAND_SPLICE,
      value
    );
    invariant(
      Array.isArray(spec[COMMAND_SPLICE]),
      'update(): expected spec of %s to be an array of arrays; got %s. ' +
      'Did you forget to wrap your parameters in an array?',
      COMMAND_SPLICE,
      spec[COMMAND_SPLICE]
    );
    spec[COMMAND_SPLICE].forEach(function(args: any) {
      invariant(
        Array.isArray(args),
        'update(): expected spec of %s to be an array of arrays; got %s. ' +
        'Did you forget to wrap your parameters in an array?',
        COMMAND_SPLICE,
        spec[COMMAND_SPLICE]
      );
      (<any>nextValue).splice.apply(nextValue, args);
    });
    return nextValue;
  }

  if (hasOwnProperty.call(spec, COMMAND_ADD)) {
    invariantSetCase(value, spec, COMMAND_ADD);
    spec[COMMAND_ADD].forEach(function(item: any) {
      (<any>nextValue).add(item);
    });
    return nextValue;
	}

  if (hasOwnProperty.call(spec, COMMAND_DELETE) && (value instanceof Set)) {
    invariantSetCase(value, spec, COMMAND_DELETE);
    spec[COMMAND_DELETE].forEach(function(item: any) {
      (<any>nextValue).delete(item);
    });
    return nextValue;
	}
	
	for(var k in spec) {
		if(!(ALL_COMMANDS_SET.hasOwnProperty(k) && ALL_COMMANDS_SET[k])) {
			nextValue[k] = update(value[k], spec[k]);
		}
	}
	
	return nextValue;
}
