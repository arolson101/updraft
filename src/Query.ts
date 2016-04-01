"use strict";

namespace Updraft.Query {
	export interface Comparisons<T> {
		$gt?: T;
		$gte?: T;
		$lt?: T;
		$lte?: T;
		$ne?: T;
	}
	
	export interface SetHasCondition<T> {
		$has: T;
	}

	export interface SetHasAnyCondition<T> {
		$hasAny: T[];
	}

	export interface SetHasAllConditions<T> {
		$hasAll: T[];
	}
	
	export interface InCondition<T> {
		$in: T[];
	}
	
	export interface LikeCondition {
		$like: string;
	}

	export interface NotLikeCondition {
		$notLike: string;
	}
	
	export type primitive<T> = T | InCondition<T>;

	export type none = void;
	export type bool = boolean;
	export type num = primitive<number> | Comparisons<number>;
	export type str = primitive<string> | LikeCondition | NotLikeCondition;
	export type date = primitive<Date> | Comparisons<Date>;
	export type enm<T> = primitive<T>;
	export type set<T> = SetHasCondition<T> | SetHasAnyCondition<T> | SetHasAllConditions<T>;
	export type strSet = set<string>;
	
	/* istanbul ignore next */
	export function escape(str: string): string {
		return str.replace(/%/g, "\\%").replace(/_/g, "\\_");
	}
}
