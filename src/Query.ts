'use strict';

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

interface InCondition<T> {
	$in: T[];
}

export interface FieldSpec {
	[fieldName: string]: boolean;
}

export type bool = boolean;
export type num = number | NumericConditions | InCondition<number>;
export type str = string | RegExp | InCondition<string>;
export type set<T> = SetConditions<T>;
export type strSet = set<string>;
