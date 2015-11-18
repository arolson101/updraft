///<reference path="../typings/tsd.d.ts"/>
///<reference path="../dist/updraft.d.ts"/>
"use strict";

require("./updraft_loader");
import { expect } from "chai";
import clone = require("clone");
import Enum = require("enum");

import Column = Updraft.Column;
import ColumnType = Updraft.ColumnType;
import Q = Updraft.Query;
import M = Updraft.Mutate;
import OrderBy = Updraft.OrderBy;
import mutate = Updraft.mutate;

let saveWebSqlValues = false;
// TODO: lists
// TODO: blobs


interface Db {
	db: Updraft.DbWrapper;
	close: (err?: Error) => any;
}

function clonePreservingEnums(src: Updraft.TableSpecAny): Updraft.TableSpecAny {
	let dst = clone(src);
	for (let col in src.columns) {
		let column = src.columns[col];
		if (column.type == ColumnType.enum) {
			dst.columns[col].enum = column.enum;
		}
	}
	return dst;
}


function createDb(inMemory: boolean, trace: boolean): Db {
	if (typeof window != "undefined") {
		let traceCallback = trace ? (str: string) => console.log(str) : null;
		let db: any = Updraft.createWebsqlWrapper("testdb", "1.0", "updraft test database", 5 * 1024 * 1024, traceCallback);
		return {
			db: db,
			close: (err?: Error) => db.transaction((transaction: Updraft.DbTransaction) => {
				if (saveWebSqlValues) {
					// keep data around for inspection
					return err ? Promise.reject(err) : Promise.resolve();
				}
				return transaction.executeSql("select name from sqlite_master where type='table'", [], (tx2: Updraft.DbTransaction, rows: any[]) => {
					let p = Promise.resolve();
					rows.forEach((row: any) => {
						let name = row.name;
						if (name[0] != "_") {
							p = p.then(() => tx2.executeSql("drop table " + name));
						}
					});
					return p.then(() => err ? Promise.reject(err) : undefined);
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
			db: Updraft.createSQLiteWrapper(db),
			close: (err?: Error) => {
				db.close();
				return err ? Promise.reject(err) : Promise.resolve();
			}
		};
	}
}

enum TodoStatus {
	NotStarted,
	InProgress,
	Paused
}

let AltTodoStatus = new Enum(["NotStarted", "InProgress", "Paused"]);

interface HistoryItem {
	time: Date;
	text: string;
}

interface _Todo<key, date, estatus, ealtstatus, real, bool, str, strset, history> {
	id?: key;
	created?: date;
	status?: estatus;
	altstatus?: ealtstatus;
	progress?: real;
	completed?: bool;
	due?: date;
	text?: str;
	tags?: strset;
	history?: history;
}

interface Todo extends _Todo<number, Date, TodoStatus, EnumValue, number, boolean, string, Set<string>, Array<HistoryItem>> {}
interface TodoMutator extends _Todo<number, M.date, M.primitive<TodoStatus>, M.primitive<EnumValue>, M.num, M.bool, M.str, M.strSet, M.array<HistoryItem>> {}
interface TodoQuery extends _Todo<Q.num, Q.date, Q.primitive<TodoStatus>, Q.primitive<EnumValue>, Q.num, Q.bool, Q.str, Q.strSet, Q.none> {}
interface TodoFields extends _Todo<boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean> {}

type TodoTable = Updraft.Table<Todo, TodoMutator, TodoQuery>;
type TodoChange = Updraft.TableChange<Todo, TodoMutator>;
type TodoTableSpec = Updraft.TableSpec<Todo, TodoMutator, TodoQuery>;

const todoTableSpec: TodoTableSpec = {
	name: "todos",
	columns: {
		id: Column.Int().Key(),
		created: Column.DateTime(),
		status: Column.Enum(TodoStatus),
		altstatus: Column.Enum(AltTodoStatus),
		progress: Column.Real().Default(0.1),
		completed: Column.Bool().Index(),
		due: Column.Date(),
		text: Column.String(),
		history: Column.JSON(),
		tags: Column.Set(ColumnType.text)
	},
	indices: [
		["status", "progress"]
	],
	renamedColumns: {
		"neverExisted": "status"
	}
};

const todoTableExpectedSchema = {
	todos: {
		name: "todos",
		indices: [
			["status", "progress"]
		],
		triggers: {},
		columns: {
			id: Column.Int().Key(),
			created: Column.DateTime(),
			status: new Column(ColumnType.enum),
			altstatus: new Column(ColumnType.enum),
			completed: Column.Bool().Index(),
			due: Column.Date(),
			progress: Column.Real().Default(0.1),
			text: Column.String(),
			history: Column.JSON(),

			updraft_deleted: Column.Bool(),
			updraft_composed: Column.Bool(),
			updraft_time: Column.Int().Key(),
			updraft_latest: Column.Bool()
		}
	},

	updraft_set_todos_tags: {
		name: "updraft_set_todos_tags",
		indices: <string[]>[],
		triggers: {},
		columns: {
			key: Column.Int().Key(),
			time: Column.Int().Key(),
			value: Column.Text().Key(),
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
	},
	
	updraft_keyValues: {
		name: "updraft_keyValues",
		indices: <string[]>[],
		triggers: {},
		columns: {
			key: Column.String().Key(),
			value: Column.JSON(),
			
			updraft_deleted: Column.Bool(),
			updraft_composed: Column.Bool(),
			updraft_time: Column.Int().Key(),
			updraft_latest: Column.Bool()
		}
	},
	
	updraft_changes_updraft_keyValues: {
		name: "updraft_changes_updraft_keyValues",
		indices: <string[]>[],
		triggers: {},
		columns: {
			key: Column.Int().Key(),
			time: Column.DateTime().Key(),
			change: Column.JSON()
		}
	},
};

function sampleTodos(count: number) {
	let todos: Todo[] = [];

	for (let i = 0; i < count; i++) {
		let todo = {
			id: i,
			created: new Date(2001, 2, 14, 12, 30),
			due: new Date(2002, 3, 15, 12, 30),
			status: TodoStatus.NotStarted,
			altstatus: AltTodoStatus.get("NotStarted"),
			progress: 0.2,
			completed: false,
			tags: new Set<string>(["all", (i % 2 ? "odd" : "even"), "tag" + i]),
			text: "todo " + i,
			history: <HistoryItem[]>[]
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

		switch (i % 4) {
		case 0:
			m.completed = { $set: true };
			m.history = { $set: [ {time: new Date(2005, 6, 15), text: "history 1"} ] };
			break;

		case 1:
			m.text = { $set: "modified " + i };
			m.progress = { $set: 0.25 };
			break;

		case 2:
			m.status = { $set: TodoStatus.InProgress };
			m.altstatus = { $set: AltTodoStatus.get("InProgress") };
			m.history = { $push: [ {time: new Date(2005, 7, 17), text: "history 2"} ] };
			break;

		case 3:
			m.tags = { $add: ["foo", "bar"] };
			m.progress = { $inc: 0.10 };
			m.created = { $set: null };
			break;

		case 4:
			m.completed = { $set: true };
			m.status = { $set: TodoStatus.Paused };
			m.altstatus = { $set: AltTodoStatus.get("Paused") };
			m.created = { $set: new Date(2002, 1, 15, 15, 45) };
			m.text = { $set: "modified " + i };
			m.tags = { $delete: ["foo"] };
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
	
	describe("key/value store", function() {
		it("saves and restores values", function() {
			let w = createDb(true, false);
			let store = Updraft.createStore({ db: w.db });
			let complexValue = {
				halloween: new Date(2007, 9, 31),
				nestedValue: {
					foo: "bar",
					bar: 1234
				}
			};

			return Promise.resolve()
				.then(() => store.open())
				.then(() => {
					return Promise.resolve()
						.then(() => store.setValue("simpleString", "abc"))
						.then(() => store.setValue("simpleNumber", 123))
						.then(() => store.setValue("complex", complexValue));
				})
				.then(() => {
					store = Updraft.createStore({ db: w.db });
					return store.open();
				})
				.then(() => {
					let simpleString = store.getValue("simpleString");
					let simpleNumber = store.getValue("simpleNumber");
					let complex = store.getValue("complex");
					expect(simpleString).to.equal("abc");
					expect(simpleNumber).to.be.a("number").and.equal(123);
					expect(complex).to.deep.equal(complexValue);
				})
				.then(() => w.close(), (err) => w.close(err))
				;
		});
	});
	
	describe("schema migrations", function() {
		function runMigration(newFields: Updraft.ColumnSet, deletedFields: string[], rename: {[old: string]: string}, newindices: string[][], debug?: boolean) {
			let newSpec: Updraft.TableSpec<Todo, TodoMutator, TodoQuery> = clonePreservingEnums(todoTableSpec);
			let newSchema = clone(todoTableExpectedSchema);
			let dataCount = 10;
			let newData = sampleTodos(dataCount);
			sampleMutators(dataCount).forEach((m) => {
				let id = m.id;
				delete m.id;
				let d = mutate(newData[id], m);
				// db won't return null keys
				for (let field in d) {
					if (d[field] == null) {
						delete d[field];
					}
				}
				newData[id] = d;
			});

			if (newFields) {
				for (let col in newFields) {
					let colSpec: Column = newFields[col];
					let existed = col in newSpec.columns; 
					newSpec.columns[col] = colSpec;
					newSchema.todos.columns[col] = clone(colSpec);
					// enum info isn't stored in db, so make the comparison equivelant to what can be restored
					if (colSpec.type == ColumnType.enum) {
						delete newSchema.todos.columns[col].enum;
						if (colSpec.defaultValue) {
							newSchema.todos.columns[col].defaultValue = colSpec.enum[<number>colSpec.defaultValue];
						}
					}
					// for teset changing enum to string
					if (col in todoTableSpec.columns) {
						if (todoTableSpec.columns[col].type == ColumnType.enum) {
							let enm = todoTableSpec.columns[col].enum;
							for (let i = 0; i < newData.length; i++) {
								newData[i][col] = enm[newData[i][col]]; 
							}
							continue;
						}
					}
					if (colSpec.type == ColumnType.set) {
						delete newSchema.todos.columns[col].elementType;
					}
					if (!existed) {
						for (let i = 0; i < newData.length; i++) {
							newData[i][col] = colSpec.defaultValue;
						}
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

			if (newFields || deletedFields || rename) {
				// just remove all indices because they might reference removed rows and I'm lazy
				newSpec.indices = [];
				newSchema.todos.indices = [];
			}
			
			if (newindices) {
				newSpec.indices = newindices;
				newSchema.todos.indices = newindices;
			}
			
			let savedNewSchema = clone(newSchema);

			let w = createDb(true, debug);
			let store = Updraft.createStore({ db: w.db });
			let todoTable: TodoTable = store.createTable(newSpec);

			return Promise.resolve()
				.then(() => populateData(w.db, dataCount))
				.then(() => store.open())
				.then(() => store.readSchema())
				.then((schema) => {
					expect(savedNewSchema).to.deep.equal(newSchema);
					expect(schema).to.deep.equal(newSchema);
				})
				.then(() => 
					todoTable.find({}, {orderBy: {id: Updraft.OrderBy.ASC}})
				)
				.then((data: any[]) => {
					expect(data.length).to.equal(dataCount);
					for (let i = 0; i < dataCount; i++) {
						expect(data[i]).to.deep.equal(newData[i]);
					}
					expect(data).to.deep.equal(newData);
				})
				.then(() => w.close(), (err) => w.close(err))
				;
		}

		it("no change", function() {
			return runMigration(null, null, null, null);
		});

		it("add columns (simple migration)", function() {
			enum NewEnum {
				Value1,
				Value2,
				DefaultValue
			}
			let newFields: Updraft.ColumnSet = {
				newIntField: Column.Int().Default(10),
				newTextField: Column.Text().Default("test single (') and double (\") and double single ('') quote marks"),
				newEnumField: Column.Enum(NewEnum).Default(NewEnum.DefaultValue)
			};
			return runMigration(newFields, null, null, null);
		});

		it("change column default", function() {
			let newFields: Updraft.ColumnSet = {
				completed: Column.Bool().Default(true),
			};
			return runMigration(newFields, null, null, null);
		});

		it("change column type", function() {
			let newFields: Updraft.ColumnSet = {
				status: Column.Text(),
			};
			return runMigration(newFields, null, null, null);
		});

		it("change indices", function() {
			let newindices: string[][] = [
				["progress", "status"]
			];
			return runMigration(null, null, null, newindices);
		});
		
		it("remove columns", function() {
			let deletedFields = [ 
				"created",
				"status",
				"altstatus",
				"progress",
				"completed",
				"due",
				"text",
				"tags",
				"history",
			];
			return runMigration(null, deletedFields, null, null);
		});

		it("rename columns", function() {
			let rename = {
				text: "description",
				completed: "done"
			};
			return runMigration(null, null, <any>rename, null);
		});

		it("simultaneously added, renamed, and removed columns", function() {
			let newFields: Updraft.ColumnSet = {
				newIntField: Column.Int().Default(-10),
			};
			let deletedFields = [ "completed" ];
			let rename = {
				text: "description",
			};
			return runMigration(newFields, deletedFields, <any>rename, null);
		});
	});

	describe("merge changes", function() {
		function runChanges(changes: TodoChange[], expectedResults: Todo[], debug?: boolean) {
			let todoTable: TodoTable;

			let w = createDb(true, debug);

			let store = Updraft.createStore({ db: w.db });
			todoTable = store.createTable(todoTableSpec);

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
				.then((results) => expect(results).to.deep.equal(expectedResults))
				.then(() => w.close(), (err) => w.close(err))
				;
		}

		it("simple change progression", function() {
			let changes: TodoChange[] = [
				{ time: 1,
					save: {
						id: 1,
						text: "base text",
						created: undefined,
						completed: false,
						tags: new Set<string>()
					},
				},
				{ time: 2,
					change: {
						id: 1,
						status: { $set: TodoStatus.InProgress },
						text: { $set: "modified at time 2" },
						tags: { $add: ["asdf"] }
					}
				},
				{ time: 3,
					change: {
						id: 1,
						created: { $set: new Date(2005) },
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

			return runChanges(changes, [{
				id: 1,
				text: "modified at time 3",
				created: new Date(2005),
				status: TodoStatus.InProgress,
				completed: true,
				progress: 0.1,
				tags: new Set<string>(["asdf"])
			}]);
		});

		it("multiple baselines", function() {
			let changes: TodoChange[] = [
				{ time: 1,
					save: {
						id: 1,
						text: "base text 1",
						created: undefined,
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
						created: new Date(2005),
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

			return runChanges(changes, [{
				id: 1,
				text: "base text 2",
				created: new Date(2005),
				completed: true,
				progress: 0.1,
				tags: new Set<string>()
			}]);
		});
		
		it("no baseline", function() {
			let changes: TodoChange[] = [
				{ time: 1,
					change: {
						id: 1,
						text: { $set: "modified at time 2" }
					}
				},
				{ time: 2,
					save: {
						id: 1,
						text: "base text 2",
						created: new Date(2005),
						completed: false
					},
				},
				{ time: 3,
					change: {
						id: 1,
						completed: { $set: true }
					}
				},
			];

			return runChanges(changes, [{
				id: 1,
				text: "base text 2",
				created: new Date(2005),
				completed: true,
				progress: 0.1,
				tags: new Set<string>()
			}]);
		});

		it("out-of-order changes", function() {
			let changes: TodoChange[] = [
				{ time: 1,
					save: {
						id: 1,
						text: "base text",
						completed: false,
						created: undefined
					},
				},
				{ time: 4,
					change: {
						id: 1,
						created: { $set: new Date(2005) },
						completed: { $set: true }
					}
				},
				{ time: 3,
					change: {
						id: 1,
						created: { $set: new Date(2003) },
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

			return runChanges(changes, [{
				id: 1,
				text: "modified at time 3",
				created: new Date(2005),
				completed: true,
				progress: 0.1,
				tags: new Set<string>()
			}]);
		});

		it("deletion", function() {
			let changes: TodoChange[] = [
				{ time: 1,
					save: {
						id: 101,
						text: "base text 1",
						created: undefined,
						completed: false
					},
				},
				{ time: 2,
					delete: 101
				},
			];

			return runChanges(changes, []);
		});
				
		it("constructors", function() {
			class TodoClass implements Todo {
				id: number;
				completed: boolean;
				text: string;
				tags: Set<string>;
				constructorCalled: boolean;
				
				constructor(props: Todo) {
					this.id = props.id || 1;
					this.completed = props.completed || false;
					this.text = props.text || "";
					this.tags = props.tags || new Set<string>();
					this.constructorCalled = true;
				}
				
				testFunction(): string {
					return "success";
				}
			}
			
			let toSave = new TodoClass({});
			expect(toSave.constructorCalled).to.be.true;

			let newSpec: Updraft.TableSpec<Todo, TodoMutator, TodoQuery> = clonePreservingEnums(todoTableSpec);
			newSpec.clazz = TodoClass;

			let w = createDb(true, false);
			let store = Updraft.createStore({ db: w.db });
			let todoTable: TodoTable = store.createTable(newSpec);

			return Promise.resolve()
				.then(() => store.open())
				.then(() => todoTable.add({save: toSave}))
				.then(() => todoTable.find({}))
				.then((data: TodoClass[]) => {
					expect(data[0]).to.haveOwnProperty("constructorCalled");
					expect(data[0]).to.deep.equal(toSave);
				})
				.then(() => w.close(), (err) => w.close(err))
				;
		});
		
		it("sets", function() {
			let toSave = <Todo>{
				id: 1,
				text: "todo 1",
				completed: false,
				progress: 0.1,
				tags: new Set<string>(["a", "b", "c"])
			};
			
			let w = createDb(true, false);
			let store = Updraft.createStore({ db: w.db });
			let todoTable: TodoTable = store.createTable(todoTableSpec);

			return Promise.resolve()
				.then(() => store.open())
				.then(() => todoTable.add({time: 1, save: toSave}))
				.then(() => todoTable.find({}))
				.then((data: Todo[]) => {
					expect(data[0]).to.deep.equal(toSave);
				})
				.then(() => w.close());
		});
	});

	describe("find()", function() {
		let w: Db;
		let todoTable: TodoTable;
		let todos: Todo[];

		before(() => {
			todos = sampleTodos(12);

			w = createDb(true, false);

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
					.then(() => todoTable.find({text: "todo 1"}).then((results) => expect(results).to.deep.equal([todos[1]])))
					.then(() => todoTable.find({completed: false}).then((results) => expect(results).to.deep.equal(todos)))
					.then(() => todoTable.find({completed: true}).then((results) => expect(results).to.deep.equal([])))
					.then(() => todoTable.find({id: 1}).then((results) => expect(results).to.deep.equal([todos[1]])))
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
					.then(() => todoTable.find({status: {$in: [TodoStatus.NotStarted, TodoStatus.Paused]}}).then((results) => expect(results).to.deep.equal(todos)))
					.then(() => todoTable.find({altstatus: {$in: [AltTodoStatus.get("NotStarted"), AltTodoStatus.get("Paused")]}}).then((results) => expect(results).to.deep.equal(todos)))
					;
			});
			
			it("$has", function() {
				let evens = [todos[0], todos[2], todos[4], todos[6], todos[8], todos[10]];
				return Promise.resolve()
					.then(() => todoTable.find({tags: {$has: "all"}}).then((results) => expect(results).to.deep.equal(todos)))
					.then(() => todoTable.find({tags: {$has: "even"}}).then((results) => expect(results).to.deep.equal(evens)))
					.then(() => todoTable.find({tags: {$has: "tag1"}}).then((results) => expect(results).to.deep.equal([todos[1]])))
					.then(() => todoTable.find({tags: {$hasAny: ["tag1", "tag2"]}}).then((results) => expect(results).to.deep.equal([todos[1], todos[2]])))
					.then(() => todoTable.find({tags: {$hasAll: ["tag1", "tag2"]}}).then((results) => expect(results).to.deep.equal([])))
					.then(() => todoTable.find({tags: {$hasAll: ["all", "tag2"]}}).then((results) => expect(results).to.deep.equal([todos[2]])))
					.then(() => todoTable.find({tags: {$hasAll: ["all", "even"]}}).then((results) => expect(results).to.deep.equal(evens)))
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
