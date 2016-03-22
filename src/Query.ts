"use strict";

namespace Updraft.Query {
	export interface NumericConditions {
		$gt?: number;
		$gte?: number;
		$lt?: number;
		$lte?: number;
	}
	
	export interface SetHasCondition<T> {
		$has?: T;
	}

	export interface SetHasAnyCondition<T> {
		$hasAny?: T[];
	}

	export interface SetHasAllConditions<T> {
		$hasAll?: T[];
	}
	
	export interface DateConditions {
		$after?: Date;
		$before?: Date;
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
	export type num = primitive<number> | NumericConditions;
	export type str = primitive<string> | LikeCondition | NotLikeCondition;
	export type date = primitive<Date> | DateConditions;
	export type enm<T> = primitive<T>;
	export type set<T> = SetHasCondition<T> | SetHasAnyCondition<T> | SetHasAllConditions<T>;
	export type strSet = set<string>;
  
  /* istanbul ignore next */
  export function escape(str: string): string {
    return str.replace(/%/g, "\\%").replace(/_/g, "\\_");
  }
}
