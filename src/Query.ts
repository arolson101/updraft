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

export type primitive<T> = T | InCondition<T>;
export type bool = boolean;
export type num = primitive<number> | NumericConditions;
export type str = primitive<string> | RegExp;
export type date = primitive<Date> | DateConditions;
export type set<T> = SetConditions<T>;
export type strSet = set<string>;
