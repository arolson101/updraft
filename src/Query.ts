"use strict";

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

interface DateConditions {
	$after?: Date;
	$before?: Date;
}

interface InCondition<T> {
	$in: T[];
}


export type bool = boolean;
export type num = number | NumericConditions | InCondition<number>;
export type str = string | RegExp | InCondition<string>;
export type date = Date | DateConditions;
export type set<T> = SetConditions<T>;
export type strSet = set<string>;
