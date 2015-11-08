///<reference path="../typings/tsd.d.ts"/>
"use strict";

import chai = require("chai");
import clone = require("clone");
import { Updraft } from "../src/index";

let expect = chai.expect;

import Column = Updraft.Column;
import Q = Updraft.Query;
import M = Updraft.Mutate;
import OrderBy = Updraft.OrderBy;
import mutate = Updraft.mutate;

// TODO: object constructors
// TODO: enums
// TODO: refs
// TODO: sets
// TODO: lists
// TODO: test indexes
// TODO: code coverage
// TODO: compile to dist folder
// TODO: compile .d.ts
// TODO: documentation


interface Db {
	db: Updraft.DbWrapper;
	close: () => any;
}


function createDb(inMemory: boolean, trace: boolean): Db {
	if (typeof window != "undefined") {
		let db = Updraft.wrapWebSql("testdb1", "1.0", "updraft test database", 5 * 1024 * 1024);
		return {
			db: db,
			close: () => db.transaction((transaction: Updraft.DbTransaction) => {
				return transaction.executeSql("select name from sqlite_master where type='table'", [], (tx2: Updraft.DbTransaction, rows: any[]) => {
					let p = Promise.resolve();
					rows.forEach((row: any) => {
						var name = row.name;
						if(name[0] != "_") {
							p = p.then(() => tx2.executeSql("drop table " + name));
						}
					});
					return p;
				});
			})
		};
	}
	else {
		let sqlite3 = require("sqlite3");
		let db = new sqlite3.Database(inMemory ? ":memory:" : "test.db");
		if (trace) {
			db.on("trace", (sql: string) => console.log(sql));
		}
		return {
			db: Updraft.wrapSql(db),
			close: () => db.close()
		};
	}
}


interface _Todo<key, bool, str, strset> {
	id?: key;
	completed?: bool;
	text?: str;
}

interface Todo extends _Todo<number, boolean, string, Set<string>> {}
interface TodoMutator extends _Todo<number, M.bool, M.str, M.strSet> {}
interface TodoQuery extends _Todo<Q.num, Q.bool, Q.str, Q.strSet> {}
interface TodoFields extends _Todo<boolean, boolean, boolean, boolean> {}

type TodoTable = Updraft.Table<Todo, TodoMutator, TodoQuery>;
type TodoChange = Updraft.TableChange<Todo, TodoMutator>;
type TodoTableSpec = Updraft.TableSpec<Todo, TodoMutator, TodoQuery>;

const todoTableSpec: TodoTableSpec = {
	name: "todos",
	columns: {
		id: Column.Int().Key(),
		completed: Column.Bool(),
		text: Column.String(),
	}
};

const todoTableExpectedSchema = {
	todos: {
		name: "todos",
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
		name: "updraft_changes_todos",
		indices: <string[]>[],
		triggers: {},
		columns: {
			key: Column.Int().Key(),
			time: Column.DateTime().Key(),
			change: Column.JSON()
		}
	}
};

function sampleTodos(count: number) {
	let todos: Todo[] = [];

	for (let i = 0; i < count; i++) {
		let todo = {
			id: i,
			completed: false,
			text: "todo " + i
		};
		todos.push(todo);
	}

	return todos;
}

function sampleMutators(count: number) {
	let mutators: TodoMutator[] = [];

	for (let i = 0; i < count; i++) {
		let m: TodoMutator = {
			id: i,
		};

		switch (i % 3) {
		case 0:
			m.completed = { $set: true };
			break;

		case 1:
			m.text = { $set: "modified " + i };
			break;

		case 2:
			m.completed = { $set: true };
			m.text = { $set: "modified " + i };
			break;
		}

		mutators.push(m);
	}

	return mutators;
}

function populateData(db: Updraft.DbWrapper, count: number) {
	let store = Updraft.createStore({ db: db });
	let todoTable: TodoTable = store.createTable(todoTableSpec);
	let p = store.open();
	p = p.then(() => todoTable.add(...sampleTodos(count).map(todo => <TodoChange>{ time: 1, save: todo })));
	p = p.then(() => todoTable.add(...sampleMutators(count).map(m => <TodoChange>{ time: 2, change: m })));
	return p;
}


describe("table", function() {
	this.timeout(0);

	describe("schema migrations", function() {
		function runMigration(newFields: {[name: string]: Column}, deletedFields: string[], rename: {[old: string]: string}, debug?: boolean) {
			let newSpec: Updraft.TableSpec<Todo, TodoMutator, TodoQuery> = clone(todoTableSpec);
			let newSchema = clone(todoTableExpectedSchema);
			let dataCount = 10;
			let newData = sampleTodos(dataCount);
			sampleMutators(dataCount).forEach((m) => {
				let id = m.id;
				delete m.id;
				newData[id] = mutate(newData[id], m);
			});

			if (newFields) {
				for (let col in newFields) {
					let colSpec: Column = newFields[col];
					newSpec.columns[col] = colSpec;
					newSchema.todos.columns[col] = colSpec;
					for (let i = 0; i < newData.length; i++) {
						newData[i][col] = colSpec.defaultValue;
					}
				}
			}

			if (deletedFields) {
				for (let i = 0; i < deletedFields.length; i++) {
					let col = deletedFields[i];
					delete newSpec.columns[col];
					delete newSchema.todos.columns[col];
					for (let i = 0; i < newData.length; i++) {
						delete newData[i][col];
					}
				}
			}

			if (rename) {
				newSpec.renamedColumns = <any>rename;

				for (let oldCol in rename) {
					let newCol = rename[oldCol];
					newSpec.columns[newCol] = newSpec.columns[oldCol];
					newSchema.todos.columns[newCol] = newSchema.todos.columns[oldCol];
					delete newSpec.columns[oldCol];
					delete newSchema.todos.columns[oldCol];
					for (let i = 0; i < newData.length; i++) {
						newData[i][newCol] = newData[i][oldCol];
						delete newData[i][oldCol];
					}
				}
			}

			let w = createDb(true, debug);
			let store = Updraft.createStore({ db: w.db });
			let todoTable: TodoTable = store.createTable(newSpec);

			let close = () => w.close();

			return Promise.resolve()
				.then(() => populateData(w.db, dataCount))
				.then(() => store.open())
				.then(() => store.readSchema())
				.then((schema) => expect(schema).to.deep.equal(newSchema))
				.then(() => todoTable.find({}, {orderBy: {id: Updraft.OrderBy.ASC}}))
				.then((data: any[]) => expect(data).to.deep.equal(newData))
				.then(close, close)
				.catch((err: Error) => {
					console.log(err)
				});
		}

		it("no change", function() {
			return runMigration(null, null, null);
		});

		it("add columns (simple migration)", function() {
			let newFields = {
				newIntField: Column.Int().Default(10),
				newTextField: Column.Text().Default("test single (') and double (\") and single double ('') quote marks")
			};
			return runMigration(<any>newFields, null, null);
		});

		it("remove columns", function() {
			let deletedFields = [ "completed" ];
			return runMigration(null, deletedFields, null);
		});

		it("rename columns", function() {
			let rename = {
				text: "description",
				completed: "done"
			};
			return runMigration(null, null, <any>rename);
		});

		it("simultaneously added, renamed, and removed columns", function() {
			let newFields = {
				newIntField: Column.Int().Default(-10),
			};
			let deletedFields = [ "completed" ];
			let rename = {
				text: "description",
			};
			return runMigration(<any>newFields, deletedFields, <any>rename);
		});
	});

	describe("merge changes", function() {
		function runChanges(changes: TodoChange[], expectedResult: Todo, debug?: boolean) {
			let todoTable: TodoTable;

			let w = createDb(true, debug);

			let store = Updraft.createStore({ db: w.db });
			todoTable = store.createTable(todoTableSpec);
			let close = () => w.close();

			return Promise.resolve()
				.then(() => store.open())
				.then(() => {
					let p = Promise.resolve();
					changes.forEach((change: TodoChange) => {
						p = p.then(() => todoTable.add(change));
					});
					return p;
				})
				.then(() => todoTable.find({}))
				.then((results) => expect(results).to.deep.equal([expectedResult]))
				.then(close, close);
		}

		it("simple change progression", function() {
			let changes: TodoChange[] = [
				{ time: 1,
					save: {
						id: 1,
						text: "base text",
						completed: false
					},
				},
				{ time: 2,
					change: {
						id: 1,
						text: { $set: "modified at time 2" }
					}
				},
				{ time: 3,
					change: {
						id: 1,
						text: { $set: "modified at time 3" }
					}
				},
				{ time: 4,
					change: {
						id: 1,
						completed: { $set: true }
					}
				},
			];

			return runChanges(changes, {id: 1, text: "modified at time 3", completed: true});
		});

		it("multiple baselines", function() {
			let changes: TodoChange[] = [
				{ time: 1,
					save: {
						id: 1,
						text: "base text 1",
						completed: false
					},
				},
				{ time: 2,
					change: {
						id: 1,
						text: { $set: "modified at time 2" }
					}
				},
				{ time: 3,
					save: {
						id: 1,
						text: "base text 2",
						completed: false
					},
				},
				{ time: 4,
					change: {
						id: 1,
						completed: { $set: true }
					}
				},
			];

			return runChanges(changes, {id: 1, text: "base text 2", completed: true});
		});

		it("out-of-order changes", function() {
			let changes: TodoChange[] = [
				{ time: 1,
					save: {
						id: 1,
						text: "base text",
						completed: false
					},
				},
				{ time: 4,
					change: {
						id: 1,
						completed: { $set: true }
					}
				},
				{ time: 3,
					change: {
						id: 1,
						text: { $set: "modified at time 3" }
					}
				},
				{ time: 2,
					change: {
						id: 1,
						text: { $set: "modified at time 2" }
					}
				},
			];

			return runChanges(changes, {id: 1, text: "modified at time 3", completed: true});
		});
	});

	describe("find()", function() {
		let w: Db;
		let todoTable: TodoTable;
		let todos: Todo[];

		before(() => {
			todos = sampleTodos(12);

			w = createDb(true, false);
			//db.on("trace", (sql: string) => console.log(sql));

			let store = Updraft.createStore({ db: w.db });
			todoTable = store.createTable(todoTableSpec);

			return Promise.resolve()
				.then(() => store.open())
				.then(() => todoTable.add(...todos.map(todo => <TodoChange>{ time: 1, save: todo })))
				;
		});

		after(() => {
			return w.close();
		});

		describe("search operations", function() {
			it("empty query", function() {
				return todoTable.find({}).then((results) => expect(results).to.deep.equal(todos));
			});

			it("equality", function() {
				return Promise.resolve()
					//.then(() => todoTable.find({text: "todo 1"}).then((results) => expect(results).to.deep.equal([todos[1]])))
					.then(() => todoTable.find({completed: false}).then((results) => expect(results).to.deep.equal(todos)))
					// .then(() => todoTable.find({completed: true}).then((results) => expect(results).to.deep.equal([])))
					// .then(() => todoTable.find({id: 1}).then((results) => expect(results).to.deep.equal([todos[1]])))
					;
			});

			it("numeric comparisons", function() {
				return Promise.resolve()
					.then(() => todoTable.find({id: {$lt: 1}}).then((results) => expect(results).to.deep.equal([todos[0]])))
					.then(() => todoTable.find({id: {$lte: 1}}).then((results) => expect(results).to.deep.equal([todos[0], todos[1]])))
					.then(() => todoTable.find({id: {$gt: 10}}).then((results) => expect(results).to.deep.equal([todos[11]])))
					.then(() => todoTable.find({id: {$gte: 10}}).then((results) => expect(results).to.deep.equal([todos[10], todos[11]])))
					;
			});

			it("regex", function() {
				return Promise.resolve()
					.then(() => todoTable.find({text: /todo 1/}).then((results) => expect(results).to.deep.equal([todos[1], todos[10], todos[11]])))
					.then(() => todoTable.find({text: /todo 1$/}).then((results) => expect(results).to.deep.equal([todos[1]])))
					.then(() => todoTable.find({text: /^todo 1$/}).then((results) => expect(results).to.deep.equal([todos[1]])))
					.then(() => todoTable.find({text: /^odo/}).then((results) => expect(results).to.deep.equal([])))
					.then(() => todoTable.find({text: /11/}).then((results) => expect(results).to.deep.equal([todos[11]])))
					.then(() => todoTable.find({text: /t.*0/}).then((results) => expect(results).to.deep.equal([todos[0], todos[10]])))
					;
			});

			it("$in", function() {
				return Promise.resolve()
					.then(() => todoTable.find({text: {$in: ["todo 3", "todo 4"]}}).then((results) => expect(results).to.deep.equal([todos[3], todos[4]])))
					.then(() => todoTable.find({text: {$in: ["todo 4", "todo 3"]}}).then((results) => expect(results).to.deep.equal([todos[3], todos[4]])))
					.then(() => todoTable.find({id: {$in: [3, 4]}}).then((results) => expect(results).to.deep.equal([todos[3], todos[4]])))
					;
			});
		});

		describe("result operations", function() {
			it("fields", function() {
				return Promise.resolve()
					.then(() => todoTable.find({text: "todo 1"}, {fields: {id: true, completed: true}}).then((results) => expect(results).to.deep.equal([{id: 1, completed: false}])))
					;
			});

			it("orderBy", function() {
				let todosInReverse = todos.slice().reverse();
				return Promise.resolve()
					.then(() => todoTable.find({}, {orderBy: {id: OrderBy.DESC}}).then((results) => expect(results).to.deep.equal(todosInReverse)))
					.then(() => todoTable.find({}, {orderBy: {id: OrderBy.ASC}}).then((results) => expect(results).to.deep.equal(todos)))
					;
			});

			it("limit", function() {
				return Promise.resolve()
					.then(() => todoTable.find({}, {limit: 2}).then((results) => expect(results).to.deep.equal([todos[0], todos[1]])))
					.then(() => todoTable.find({}, {orderBy: {id: OrderBy.DESC}, limit: 1}).then((results) => expect(results).to.deep.equal([todos[11]])))
					;
			});

			it("offset", function() {
				return Promise.resolve()
					.then(() => todoTable.find({}, {offset: 5, limit: 2}).then((results) => expect(results).to.deep.equal([todos[5], todos[6]])))
					.then(() => todoTable.find({}, {orderBy: {id: OrderBy.DESC}, offset: 10, limit: 1}).then((results) => expect(results).to.deep.equal([todos[1]])))
					;
			});

			it("count", function() {
				return Promise.resolve()
					.then(() => todoTable.find({}, {count: true}).then((results) => expect(results).to.equal(12)))
					.then(() => todoTable.find({text: /todo 1/}, {count: true}).then((results) => expect(results).to.equal(3)))
					;
			});
		});
	});
});
