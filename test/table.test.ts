///<reference path="../typings/tsd.d.ts"/>
///<reference path="../src/index"/>

import clone = require("clone");
import { expect } from "chai";
import { Updraft } from "../src/index";

import Column = Updraft.Column;
import Q = Updraft.Query;
import M = Updraft.Mutate;


xdescribe('tables', function() {
	interface _Todo<key, bool, str, strset> {
		id?: key;
		completed?: bool;
		text?: str;
		//tags?: strset;
	}
	
	interface Todo extends _Todo<number, boolean, string, Set<string>> {}
	interface TodoUpdate extends _Todo<number, M.bool, M.str, M.strSet> {}
	interface TodoQuery extends _Todo<number, Q.bool, Q.str, Q.strSet> {}
	interface TodoFields extends _Todo<boolean, boolean, boolean, boolean> {}
	
	type TodoTable = Updraft.Table<Todo, TodoUpdate, TodoQuery>;
	
	const todoTableSpec: Updraft.TableSpec<Todo, TodoUpdate, TodoQuery> = {
		name: "todos",
		columns: {
			id: Column.Int().Key(),
			completed: Column.Bool(),
			text: Column.String(),
			//tags: Column.
		}
	}


	it('should work', function() {
		var store: Updraft.Store;
		var todoTable: TodoTable = store.addTable(todoTableSpec);
		
		todoTable.find({}).then(results => console.log(results));
		
		var idServer = 0;
		
		var todo: Todo = {
			id: ++idServer,
			completed: false,
			text: 'test'
		}
		
		todoTable.apply({when: 100, change: {id: 123, completed: {$set: true}}});
		todoTable.apply({when: 101, change: {id: 123, text: {$set: 'asdf'}}});
	});
});

