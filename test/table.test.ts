///<reference path="../typings/tsd.d.ts"/>
///<reference path="../src/index"/>

import chai = require('chai');
import chaAsPromised = require('chai-as-promised');
import { Updraft } from '../src/index';
import sqlite3 = require('sqlite3');

var async = require('asyncawait/async');
var await = require('asyncawait/await');

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
		name: 'todos',
		columns: {
			id: Column.Int().Key(),
			completed: Column.Bool(),
			text: Column.String(),
		}
	};

	it('check schema', async(function() {
		var db = new sqlite3.Database(':memory:');
		//db.on('trace', (sql: string) => console.log(sql));
		var store = Updraft.createStore({ db: Updraft.wrapSql(db) });
		var todoTable: TodoTable = store.addTable(todoTableSpec);

		var expectedSchema = {
			todos: {
				_indices: {},
				_triggers: {},
				id: 'INTEGER PRIMARY KEY',
				completed: 'BOOL',
				text: 'TEXT'
			}
		};

		await (store.open());
		var schema = await (store.readSchema());
		expect(schema).to.deep.equal(expectedSchema);
		await (db.close());
	}));

	it('saving', async(function() {
		var baselines: Updraft.TableChange<Todo, TodoMutator>[] = [];
		var todos: Todo[] = [];

		for (var i = 0; i < 10; i++) {
			var todo = {
				id: i,
				completed: false,
				text: 'todo ' + i
			};
			baselines.push({ save: todo });
			todos.push(todo);
		}

		var db = new sqlite3.Database(':memory:');
		db.on('trace', (sql: string) => console.log(sql));
		var store = Updraft.createStore({ db: Updraft.wrapSql(db) });
		var todoTable: TodoTable = store.addTable(todoTableSpec);

		await (store.open());
		console.log("start timer");
		console.log("end timer");
		todoTable.apply(...baselines);
		await (db.close());
	}));
});
