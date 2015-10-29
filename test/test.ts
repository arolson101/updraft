///<reference path="../typings/tsd.d.ts"/>
///<reference path="../src/index"/>

import clone = require("clone");
import { expect } from "chai";
import { Updraft } from "../src/index";

import Column = Updraft.Column;
import Q = Updraft.Query;
import M = Updraft.Mutate;


describe('mutate() operations', function() {
	interface _Test<bool, str, num, obj, strArray, numArray, objArray, strSet> {
		myBool?: bool;
		myString?: str;
		myNumber?: num;
		myObject?: obj;
		myStrArray?: strArray;
		myNumArray?: numArray;
		myObjArray?: objArray;
		myStrSet?: strSet;
	}
	
	interface Test extends _Test<boolean, string, number, Object, Array<string>, Array<number>, Array<Object>, Set<string>> {};
	interface TestMutator extends _Test<M.bool, M.str, M.num, M.obj, M.strArray, M.numArray, M.objArray, M.strSet> {};
	function mutate(value: Test, spec: TestMutator): Test { return Updraft.mutate<Test, TestMutator>(value, spec); }

	var base: Test = {
		myBool: true,
		myString: "my string",
		myNumber: 123,
		myObject: { foo: 'bar' },
		myStrArray: ['a', 'b', 'c'],
		myNumArray: [1, 2, 3],
		myObjArray: [{a: 1}, {b: 2}, {c: 3}],
		myStrSet: new Set<string>(['a', 'b', 'c'])
	};

	var backup: Test = clone(base);
	var mutated: Test;

	it('$set', function() {
		mutated = mutate(base, <TestMutator>{
			myBool: {$set: false},
			myString: {$set: "new string"},
			myNumber: {$set: 234},
			myObject: <any>{foo: {$set: 'baz'}}, // TODO: revisit <any> cast
			myStrArray: {$set: ['d']},
			myNumArray: {$set: [0]},
			myStrSet: {$set: new Set<string>(['d'])},
		});

		expect(mutated.myBool).to.equal(false);
		expect(mutated.myString).to.equal("new string");
		expect(mutated.myNumber).to.equal(234);
		expect(mutated.myObject).to.deep.equal({foo: 'baz'});
		expect(mutated.myStrArray).to.deep.equal(['d']);
		expect(mutated.myNumArray).to.deep.equal([0]);
		expect(mutated.myStrSet).to.deep.equal(new Set<string>(['d']));

		expect(base).to.deep.equal(backup);
	});

	it('$inc', function() {
		var mutated = mutate(base, <TestMutator>{ myNumber: {$inc: 101} });
		expect(mutated.myNumber).to.equal(224);

		mutated = mutate(base, <TestMutator>{ myNumber: {$inc: -101} });
		expect(mutated.myNumber).to.equal(22);
		
		mutated = mutate(base, <TestMutator>{ myNumber: {$inc: 1.01} });
		expect(mutated.myNumber).to.equal(124.01);

		expect(base).to.deep.equal(backup);
	});
	
	it('$push', function() {
		mutated = mutate(base, <TestMutator>{
			myStrArray: {$push: ['d']},
			myNumArray: {$push: [4, 5, 6]},
		});

		expect(mutated.myStrArray).to.deep.equal(['a', 'b', 'c', 'd']);
		expect(mutated.myNumArray).to.deep.equal([1, 2, 3, 4, 5, 6]);
		expect(base).to.deep.equal(backup);
	});
	
	it('$unshift', function() {
		mutated = mutate(base, <TestMutator>{
			myStrArray: {$unshift: ['d']},
			myNumArray: {$unshift: [4, 5, 6]},
		});

		expect(mutated.myStrArray).to.deep.equal(['d', 'a', 'b', 'c']);
		expect(mutated.myNumArray).to.deep.equal([4, 5, 6, 1, 2, 3]);
		expect(base).to.deep.equal(backup);
	});
	
	it('$splice', function() {
		mutated = mutate(base, <TestMutator>{
			myStrArray: {$splice: [[1, 1, 'd']]},
			myNumArray: {$splice: [[1, 2, 6], [0, 0, 7]]},
		});

		expect(mutated.myStrArray).to.deep.equal(['a', 'd', 'c']);
		expect(mutated.myNumArray).to.deep.equal([7, 1, 6]);
		expect(base).to.deep.equal(backup);
	});
	
	it('$merge', function() {
		mutated = mutate(base, <TestMutator>{
			myObject: <any>{$merge: {bar: {baz: 'asdf'}}}, // TODO: revisit <any> cast
		});

		expect(mutated.myObject).to.deep.equal({foo: 'bar', bar: {baz: 'asdf'}});
		expect(base).to.deep.equal(backup);
	});
	
	it('$add', function() {
		mutated = mutate(base, <TestMutator>{
			myStrSet: {$add: ['c', 'd', 'e']},
		});

		expect((<any>Array).from(mutated.myStrSet)).to.deep.equal(['a', 'b', 'c', 'd', 'e']);
		expect(base).to.deep.equal(backup);		
	});
	
	it('$delete', function() {
		mutated = mutate(base, <TestMutator>{
			myStrSet: {$delete: ['c', 'd']},
		});

		expect((<any>Array).from(mutated.myStrSet)).to.deep.equal(['a', 'b']);
		expect(base).to.deep.equal(backup);	
	});
});


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

