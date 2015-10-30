import { ColumnSet } from "./Column";

export interface TableChange<Mutator> {
	when?: number;
	delete?: boolean;
	change: Mutator;
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

export class Table<Element, Mutator, Query> {
	spec: TableSpec<Element, Mutator, Query>;
  key: string;

	constructor(spec: TableSpec<Element, Mutator, Query>) {
		this.spec = spec;
	}

	find(query: Query): Promise<Element[]> {
		return null;
	}

	apply(...changes: TableChange<Mutator>[]): Promise<any> {
		return null;
	}
}

