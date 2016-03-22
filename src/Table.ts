///<reference path="./Column"/>
///<reference path="./verify"/>
"use strict";

namespace Updraft {
	export type KeyType = string | number;
	
	export interface TableChange<Element, Mutator> {
		table?: Table<Element, Mutator, any>;
		time?: number;
		delete?: KeyType;
		change?: Mutator;
		save?: Element;
	}
	
	export interface TableSpec<Element, Mutator, Query> {
		name: string;
		columns: ColumnSet;
		renamedColumns?: RenamedColumnSet;
		indices?: string[][];
		clazz?: new (props: Element) => Element; 
	}
	
	export interface RenamedColumnSet {
			[oldColumnName: string]: string;
	}
	
	export enum OrderBy {
		ASC,
		DESC
	}
	
	export interface OrderBySpec {
		[name: string]: OrderBy;
	}
	
	export interface FieldSpec {
		[fieldName: string]: boolean;
	}
	
	export interface FindOpts {
		fields?: FieldSpec;
		orderBy?: OrderBySpec;
		offset?: number;
		limit?: number;
		count?: boolean;
	}
	
	export class Table<Element, Mutator, Query> {
		spec: TableSpec<Element, Mutator, Query>;
		key: KeyType;
	
		constructor(spec: TableSpec<Element, Mutator, Query>) {
			this.spec = spec;
			this.key = tableKey(spec);
		}
	
		keyValue(element: Element | Mutator): KeyType {
			verify(this.key in element, "object does not have key field '%s' set: %s", this.key, element);
			return element[this.key];
		}
	
		find: (query: Query | Query[], opts?: FindOpts) => Promise<Element[] | number>;
		add: (...changes: TableChange<Element, Mutator>[]) => Promise<any>;
	}
	
	
	export function tableKey(spec: TableSpec<any, any, any>): KeyType {
		let key: KeyType = null;
		for (let name in spec.columns) {
			let column = spec.columns[name];
			verify(column, "column '%s' is not in %s", name, spec);
			if (column.isKey) {
				verify(!key, "Table %s has more than one key- %s and %s", spec.name, key, name);
				key = name;
			}
		}
	
		verify(key, "Table %s does not have a key", spec.name);
		return key;
	}
}
