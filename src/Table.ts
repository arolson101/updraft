///<reference path="./Column.ts"/>
///<reference path="./verify.ts"/>

namespace Updraft {
	export type KeyType = string | number;
	
	export interface TableChange<Element, Delta> {
		table?: Table<Element, Delta, any>;
		time?: number;
		delete?: KeyType;
		update?: Delta;
		create?: Element;
	}
	
	export interface TableSpec<Element, Delta, Query> {
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
	
	export class Table<Element, Delta, Query> {
		spec: TableSpec<Element, Delta, Query>;
		key: KeyType;
	
		constructor(spec: TableSpec<Element, Delta, Query>) {
			this.spec = spec;
			this.key = tableKey(spec);
		}
	
		keyValue(element: Element | Delta): KeyType {
			verify(this.key in element, "object does not have key field '%s' set: %s", this.key, element);
			return element[this.key];
		}
	
		find: (query: Query | Query[], opts?: FindOpts) => Promise<Element[] | number>;
		add: (...changes: TableChange<Element, Delta>[]) => Promise<any>;
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
