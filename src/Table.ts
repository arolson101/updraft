///<reference path="./Store"/>

import { ColumnSet } from "./Column";
import invariant = require("invariant");


export interface TableChange<Element, Mutator> {
	when?: number;
	delete?: string | number /*key*/;
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

export type KeyType = string | number;

export class Table<Element, Mutator, Query> {
	spec: TableSpec<Element, Mutator, Query>;
  key: string;

	constructor(spec: TableSpec<Element, Mutator, Query>) {
		this.spec = spec;
		for(var name in spec.columns) {
			var column = spec.columns[name];
			if(column.isKey) {
				invariant(!this.key, "Table %s has more than one key- %s and %s", spec.name, this.key, name);
				this.key = name;
			}
		}

		invariant(this.key, "Table %s does not have a key", spec.name);
	}

	keyOf(element: Element | Mutator): KeyType {
		invariant(this.key in element, "object does not have key field '%s' set: %s", this.key, element);
		return element[this.key];
	}

	find: (query: Query) => Promise<Element[]>;
	apply: (...changes: TableChange<Element, Mutator>[]) => Promise<any>;
}
