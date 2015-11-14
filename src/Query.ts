"use strict";

namespace Updraft.Query {
	export interface NumericConditions {
		$gt?: number;
		$gte?: number;
		$lt?: number;
		$lte?: number;
	}
	
	export interface SetConditions<T> {
		$has?: T;
		$doesNotHave?: T;
		$size?: number | NumericConditions;
	}
	
	export interface DateConditions {
		$after?: Date;
		$before?: Date;
	}
	
	export interface InCondition<T> {
		$in: T[];
	}
	
	export type primitive<T> = T | InCondition<T>;
	export type bool = boolean;
	export type num = primitive<number> | NumericConditions;
	export type str = primitive<string> | RegExp;
	export type date = primitive<Date> | DateConditions;
	export type set<T> = SetConditions<T>;
	export type strSet = set<string>;
	export type none = {};
}
