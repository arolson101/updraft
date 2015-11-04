///<reference path="./Store"/>

import { ColumnSet } from "./Column";
import invariant = require("invariant");

export type KeyType = string | number;

export interface TableChange<Element, Mutator> {
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
  temp?: boolean;
}

export interface RenamedColumnSet {
    [oldColumnName: string]: string;
}


export function tableKey(spec: TableSpec<any, any, any>): KeyType {
	var key: KeyType = null;
	for (var name in spec.columns) {
		var column = spec.columns[name];
		if (column.isKey) {
			invariant(!key, "Table %s has more than one key- %s and %s", spec.name, key, name);
			key = name;
		}
	}

	invariant(key, "Table %s does not have a key", spec.name);
	return key;
}


export class Table<Element, Mutator, Query> {
	spec: TableSpec<Element, Mutator, Query>;
  key: KeyType;

	constructor(spec: TableSpec<Element, Mutator, Query>) {
		this.spec = spec;
		this.key = tableKey(spec);
	}

	keyValue(element: Element | Mutator): KeyType {
		invariant(this.key in element, "object does not have key field '%s' set: %s", this.key, element);
		return element[this.key];
	}

	find: (query: Query) => Promise<Element[]>;
	add: (...changes: TableChange<Element, Mutator>[]) => Promise<any>;
}
