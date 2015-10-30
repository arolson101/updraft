///<reference path="../typings/tsd.d.ts"/>
///<reference path="../src/index"/>

import clone = require("clone");
import chai = require("chai");
import chaAsPromised = require("chai-as-promised");
import { Updraft } from "../src/index";
import sqlite3 = require("sqlite3");

chai.use(chaAsPromised);
var expect = chai.expect;

import Column = Updraft.Column;
import Q = Updraft.Query;
import M = Updraft.Mutate;


describe('tables', function() {
	interface _Todo<key, bool, str, strset> {
		id?: key;
		completed?: bool;
		text?: str;
	}

	interface Todo extends _Todo<number, boolean, string, Set<string>> {}
	interface TodoMutator extends _Todo<number, M.bool, M.str, M.strSet> {}
	interface TodoQuery extends _Todo<number, Q.bool, Q.str, Q.strSet> {}
	interface TodoFields extends _Todo<boolean, boolean, boolean, boolean> {}

	type TodoTable = Updraft.Table<Todo, TodoMutator, TodoQuery>;

	const todoTableSpec: Updraft.TableSpec<Todo, TodoMutator, TodoQuery> = {
		name: "todos",
		columns: {
			id: Column.Int().Key(),
			completed: Column.Bool(),
			text: Column.String(),
		}
	}


	it('store', function() {
		var store = Updraft.createStore({ name: "test.db", create: Updraft.wrapSql(<any>sqlite3.Database) });
		var todoTable: TodoTable = store.addTable(todoTableSpec);
		var o = store.open();
		expect(o).to.eventually.be.fulfilled;

		o.then(() => store.readSchema()).then(schema => console.log(schema)).then(()=> console.log("done"));

		// todoTable.find({}).then(results => console.log(results));

		// var idServer = 0;

		// var todo: Todo = {
		// 	id: ++idServer,
		// 	completed: false,
		// 	text: 'test'
		// }

		// todoTable.apply({when: 100, change: {id: 123, completed: {$set: true}}});
		// todoTable.apply({when: 101, change: {id: 123, text: {$set: 'asdf'}}});
	});
});

