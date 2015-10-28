import { ColumnSet } from "./Column";

export interface TableChange<Updater> {
	when?: number;
	delete?: boolean;
	change: Updater;
}

export interface Table<Element, Updater, Query> {
	find(query: Query): Promise<Element[]>;
	apply(...changes: TableChange<Updater>[]): Promise<any>;
}

export interface TableSpec<Element, Updater, Query> {
	name: string;
	columns: ColumnSet;
}

export interface Store {
	addTable<Element, Updater, Query>(tableSpec: TableSpec<Element, Updater, Query>): Table<Element, Updater, Query>; 
}

function update<Element, Updater>(e: Element, u: Updater): Element;
function update<Element, Updater>(table: Table<Element, Updater, any>, u: Updater): Promise<any> { return null; }
