interface NumericConditions {
	$gt?: number;
	$gte?: number;
	$lt?: number;
	$lte?: number;
}

interface SetConditions<T> {
	$has?: T;
	$doesNotHave?: T;
	$size?: number | NumericConditions;
}

export type bool = boolean;
export type num = number | NumericConditions;
export type str = string | RegExp;
export type set<T> = SetConditions<T>;
export type strSet = set<string>;
