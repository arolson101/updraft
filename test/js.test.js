"use strict";

require("./updraft_loader");
var expect = require("chai").expect;

var Column = Updraft.Column;
var ColumnType = Updraft.ColumnType;
var Q = Updraft.Query;
var D = Updraft.Delta;
var OrderBy = Updraft.OrderBy;
var update = Updraft.update;


function createDb(inMemory, trace) {
	if (typeof window != "undefined") {
		var traceCallback = trace ? function(str) { console.log(str); } : null;
		var db = Updraft.createWebsqlWrapper("testdb", "1.0", "updraft test database", 5 * 1024 * 1024, traceCallback);
		return {
			db: db,
			close: function() {
				return db.transaction(function (transaction) {
					return transaction.executeSql("select name from sqlite_master where type='table'", [], (tx2, rows) => {
						var p = Promise.resolve();
						rows.forEach(function(row) {
							var name = row.name;
							if (name[0] != "_") {
								p = p.then(function() { return tx2.executeSql("drop table " + name); });
							}
						});
						return p;
					});
				})
			}
		};
	}
	else {
		var sqlite3 = require("sqlite3");
		var db = new sqlite3.Database(inMemory ? ":memory:" : "test.db");
		if (trace) {
			db.on("trace", function(sql) { console.log(sql); });
		}
		return {
			db: Updraft.createSQLiteWrapper(db),
			close: function() { return db.close(); }
		};
	}
}

// Todo item format
var todoTableSpec = {
	name: "jstodos",
	columns: {
		id: Column.Int().Key(),
		created: Column.DateTime(),
		progress: Column.Real(),
		completed: Column.Bool().Index(),
		due: Column.Date(),
		text: Column.String(),
		history: Column.JSON()
	}
};

describe("works in pure javascript", function() {
	function runChanges(changes, expectedResults, debug) {
		var w = createDb(true, debug);

		var store = Updraft.createStore({ db: w.db });
		var todoTable = store.createTable(todoTableSpec);

		return Promise.resolve()
			.then(function() { return store.open(); })
			.then(function() {
				var p = Promise.resolve();
				changes.forEach(function(change) {
					p = p.then(function() { return todoTable.add(change); });
				});
				return p;
			})
			.then(function() { return todoTable.find({}); })
			.then(function(results) { expect(results).to.deep.equal(expectedResults); })
			.then(function() { return w.close(); });
	}

	it("simple change progression", function() {
		var changes = [
			{ time: 1,
				save: {
					id: 1,
					text: "base text",
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
			completed: true
		}]);
	});
});