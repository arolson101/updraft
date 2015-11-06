///<reference path="../typings/tsd.d.ts"/>

import chai = require('chai');
import chaAsPromised = require('chai-as-promised');
import { Updraft } from '../src/index';
import sqlite3 = require('sqlite3');
import clone = require('clone');

var async = require('asyncawait/async');
var await = require('asyncawait/await');

chai.use(chaAsPromised);
var expect = chai.expect;

import Column = Updraft.Column;
import Q = Updraft.Query;
import M = Updraft.Mutate;
import OrderBy = Updraft.OrderBy;
import mutate = Updraft.mutate;


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
type TodoChange = Updraft.TableChange<Todo, TodoMutator>;
type TodoTableSpec = Updraft.TableSpec<Todo, TodoMutator, TodoQuery>;

const todoTableSpec: TodoTableSpec = {
	name: 'todos',
	columns: {
		id: Column.Int().Key(),
		completed: Column.Bool(),
		text: Column.String(),
	}
};

const todoTableExpectedSchema = {
	todos: {
		name: 'todos',
		indices: <string[]>[],
		triggers: {},
		columns: {
			id: Column.Int().Key(),
			completed: Column.Bool(),
			text: Column.String(),

			updraft_deleted: Column.Bool(),
			updraft_time: Column.DateTime().Key(),
			updraft_latest: Column.Bool()
		}
	},
	
	updraft_changes_todos: {
		name: 'updraft_changes_todos',
		indices: <string[]>[],
		triggers: {},
		columns: {
			key: Column.Int().Key(),
			time: Column.DateTime().Key(),
			change: Column.JSON()
		}
	}
};

function sampleTodos() {
	var todos: Todo[] = [];

	for (var i = 0; i < 3; i++) {
		var todo = {
			id: i,
			completed: false,
			text: 'todo ' + i
		};
		todos.push(todo);
	}
	
	return todos;
}

function sampleMutators() {
	return <TodoMutator[]>[
		{
			id: 0,
			completed: { $set: true }
		},
		{
			id: 1,
			text: { $set: 'modified 2' },
		},
		{
			id: 2,
			text: { $set: 'modified 3' },
			completed: { $set: true }
		}
	]
}

function populateData(db: sqlite3.Database) {
	var store = Updraft.createStore({ db: Updraft.wrapSql(db) });
	var todoTable: TodoTable = store.createTable(todoTableSpec);
	var p = store.open();
	p = p.then(() => todoTable.add(...sampleTodos().map(todo => <TodoChange>{ time: 1, save: todo })));
	p = p.then(() => todoTable.add(...sampleMutators().map(m => <TodoChange>{ time: 2, change: m })));
	return p;
}


describe('tables', function() {
	//this.timeout(0);
	
	// TODO: when renaming columns, the mutating changes will have to respect the renames 

	describe('schema migrations', function() {
		function runMigration(newFields: {[name: string]: Column}, deletedFields: string[], rename: {[old: string]: string}, debug?: boolean) {
			var newSpec: Updraft.TableSpec<Todo, TodoMutator, TodoQuery> = clone(todoTableSpec);
			var newSchema = clone(todoTableExpectedSchema);
			var mutators = sampleMutators().map((m: any) => {delete m.id; return m;});
			var newData = sampleTodos().map((todo: Todo, i: number) => mutate(todo, mutators[i]));
			
			if(newFields) {
				for(var col in newFields) {
					var colSpec: Column = newFields[col];
					newSpec.columns[col] = colSpec; 
					newSchema.todos.columns[col] = colSpec; 
					for(var i=0; i<newData.length; i++) {
						newData[i][col] = colSpec.defaultValue;
					}
				}
			}

			if(deletedFields) {
				for(var col in deletedFields) {
					delete newSpec.columns[col]; 
					delete newSchema.todos.columns[col]; 
					for(var i=0; i<newData.length; i++) {
						delete newData[i][col];
					}
				}
			}
			
			if(rename) {
				newSpec.renamedColumns = <any>rename;
				
				for(var oldCol in rename) {
					var newCol = rename[oldCol];
					newSpec.columns[newCol] = newSpec.columns[oldCol];
					newSchema.todos.columns[newCol] = newSchema.todos.columns[oldCol];
					delete newSpec.columns[oldCol]; 
					delete newSchema.todos.columns[oldCol];
					for(var i=0; i<newData.length; i++) {
						newData[i][newCol] = newData[i][oldCol];
						delete newData[i][oldCol];
					}
				}
			}

			var db = new sqlite3.Database(':memory:');
			if(debug) {
				db.on('trace', (sql: string) => console.log(sql));
			}

			var store = Updraft.createStore({ db: Updraft.wrapSql(db) });
			var todoTable: TodoTable = store.createTable(newSpec);

			return Promise.resolve()
				.then(() => populateData(db))
				.then(() => store.open())
				.then(() => store.readSchema())
				.then((schema) => expect(schema).to.deep.equal(newSchema))
				.then(() => todoTable.find({}, {orderBy: {id: Updraft.OrderBy.ASC}}))
				.then((data: any[]) => expect(data).to.deep.equal(newData))
				.then(() => db.close());
		}
		
		it('add columns (simple migration)', async(function() {
			var newFields = {
				newIntField: Column.Int().Default(10),
				newTextField: Column.Text().Default('test single (\') and double (") and single double (\'\') quote marks')
			};
			return runMigration(<any>newFields, null, null);
		}));
		
		it('remove columns', async(function() {
			var deletedFields = [ 'completed' ];
			return runMigration(null, deletedFields, null);
		}));

		it('rename columns', async(function() {
			var rename = {
				text: 'description',
				completed: 'done'
			}
			return runMigration(null, null, <any>rename);
		}));

		it('simultaneously added, renamed, and removed columns', async(function() {
			var newFields = {
				newIntField: Column.Int().Default(10),
			};
			var deletedFields = [ 'completed' ];
			var rename = {
				text: 'description',
			}
			return runMigration(<any>newFields, deletedFields, <any>rename);
		}));
	});

	// it('check schema', async(function() {
	// 	var db = new sqlite3.Database(':memory:');
	// 	//db.on('trace', (sql: string) => console.log(sql));
	// 	var store = Updraft.createStore({ db: Updraft.wrapSql(db) });
	// 	var todoTable: TodoTable = store.createTable(todoTableSpec);

	// 	await (store.open());
	// 	var schema = await (store.readSchema());
	// 	expect(schema).to.deep.equal(todoTableExpectedSchema);
	// 	await (db.close());
	// }));

	it('saving', async(function() {
		var baselines: Updraft.TableChange<Todo, TodoMutator>[] = [];
		var todos: Todo[] = [];

		for (var i = 0; i < 10; i++) {
			var todo = {
				id: i,
				completed: false,
				text: 'todo ' + i
			};
			baselines.push({ time: 1, save: todo });
			todos.push(todo);
		}

		var db = new sqlite3.Database(':memory:');
		//db.on('trace', (sql: string) => console.log(sql));
		var store = Updraft.createStore({ db: Updraft.wrapSql(db) });
		var todoTable: TodoTable = store.createTable(todoTableSpec);

		await (store.open());
		await (todoTable.add(...baselines));
		expect(await(todoTable.find({text: /todo 1/}))).to.deep.equal([todos[1]]);
		expect(await(todoTable.find({id: 2}))).to.deep.equal([todos[2]]);
		expect(await(todoTable.find({completed: false}))).to.deep.equal(todos);
		expect(await(todoTable.find({completed: true}))).to.deep.equal([]);
		expect(await(todoTable.find({}))).to.deep.equal(todos);
		expect(await(todoTable.find({text: {$in: ['todo 4', 'todo 3']}}))).to.deep.equal([todos[3], todos[4]]);
		expect(await(todoTable.find({text: {$in: ['todo 4', 'todo 3']}}, {orderBy: {id: OrderBy.DESC}}))).to.deep.equal([todos[4], todos[3]]);
		expect(await(todoTable.find({id: 2}, {fields: {id: true, text: true}}))).to.deep.equal([{id: 2, text: 'todo 2'}]);
		expect(await(todoTable.find({}, {offset: 2, limit: 1}))).to.deep.equal([todos[2]]);
		expect(await(todoTable.find({}, {count: true}))).to.equal(10);
		await (db.close());
	}));
});
