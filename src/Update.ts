// written to React's immutability helpers spec
// see https://facebook.github.io/react/docs/update.html
// 

interface setter<T> {
	$set: T;
}

interface increment {
	$inc: number;
}

interface push<T> {
	$push: T | Array<T>;
}

interface unshift<T> {
	$unshift: T | Array<T>;
}

interface splice<T> {
	// array.splice(start, deleteCount[, item1[, item2[, ...]]])
	$splice: (number | T)[];
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
export type obj = primitive<Object> | merge<Object>;

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
