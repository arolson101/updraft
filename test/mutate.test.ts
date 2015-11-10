///<reference path="../typings/tsd.d.ts"/>
///<reference path="../src/index"/>

import clone = require("clone");
import chai = require("chai");
import { Updraft } from "../src/index";

let expect = chai.expect;
chai.use(require('chai-datetime'));

import M = Updraft.Mutate;

interface _Test<bool, str, num, date, obj, strArray, numArray, objArray, strSet> {
	myBool?: bool;
	myString?: str;
	myNumber?: num;
	myDate?: date;
	myObject?: obj;
	myStrArray?: strArray;
	myNumArray?: numArray;
	myObjArray?: objArray;
	myStrSet?: strSet;
}

interface Test extends _Test<boolean, string, number, Date, Object, Array<string>, Array<number>, Array<Object>, Set<string>> {};
interface TestMutator extends _Test<M.bool, M.str, M.num, M.date, M.obj, M.strArray, M.numArray, M.objArray, M.strSet> {};
function mutate(value: Test, spec: TestMutator): Test { return Updraft.mutate<Test, TestMutator>(value, spec); }

describe("mutate()", function() {
	describe("operations", function() {
		let base: Test = {
			myBool: true,
			myString: "my string",
			myNumber: 123,
			myDate: new Date(1995, 11, 17, 3, 24, 0),
			myObject: { foo: "bar" },
			myStrArray: ["a", "b", "c"],
			myNumArray: [1, 2, 3],
			myObjArray: [{a: 1}, {b: 2}, {c: 3}],
			myStrSet: new Set<string>(["a", "b", "c"])
		};

		let backup: Test = clone(base);
		let mutated: Test;

		it("$set", function() {
			mutated = mutate(base, <TestMutator>{
				myBool: {$set: false},
				myString: {$set: "new string"},
				myNumber: {$set: 234},
				myDate: {$set: new Date(2001, 11, 1, 13, 30, 1)},
				myObject: <any>{foo: {$set: "baz"}}, // TODO: revisit <any> cast
				myStrArray: {$set: ["d"]},
				myNumArray: {$set: [0]},
				myStrSet: {$set: new Set<string>(["d"])},
			});

			expect(mutated.myBool).to.equal(false);
			expect(mutated.myString).to.equal("new string");
			expect(mutated.myNumber).to.equal(234);
			expect(mutated.myDate).to.equalTime(new Date(2001, 11, 1, 13, 30, 1));
			expect(mutated.myDate).to.not.equalTime(new Date(2000, 1, 1));
			expect(mutated.myObject).to.deep.equal({foo: "baz"});
			expect(mutated.myStrArray).to.deep.equal(["d"]);
			expect(mutated.myNumArray).to.deep.equal([0]);
			expect(mutated.myStrSet).to.deep.equal(new Set<string>(["d"]));

			expect(base).to.deep.equal(backup);
		});

		it("$inc", function() {
			mutated = mutate(base, <TestMutator>{ myNumber: {$inc: 101} });
			expect(mutated.myNumber).to.equal(224);

			mutated = mutate(base, <TestMutator>{ myNumber: {$inc: -101} });
			expect(mutated.myNumber).to.equal(22);

			mutated = mutate(base, <TestMutator>{ myNumber: {$inc: 1.01} });
			expect(mutated.myNumber).to.equal(124.01);

			expect(base).to.deep.equal(backup);
		});

		it("$push", function() {
			mutated = mutate(base, <TestMutator>{
				myStrArray: {$push: ["d"]},
				myNumArray: {$push: [4, 5, 6]},
			});

			expect(mutated.myStrArray).to.deep.equal(["a", "b", "c", "d"]);
			expect(mutated.myNumArray).to.deep.equal([1, 2, 3, 4, 5, 6]);
			expect(base).to.deep.equal(backup);
		});

		it("$unshift", function() {
			mutated = mutate(base, <TestMutator>{
				myStrArray: {$unshift: ["d"]},
				myNumArray: {$unshift: [4, 5, 6]},
			});

			expect(mutated.myStrArray).to.deep.equal(["d", "a", "b", "c"]);
			expect(mutated.myNumArray).to.deep.equal([4, 5, 6, 1, 2, 3]);
			expect(base).to.deep.equal(backup);
		});

		it("$splice", function() {
			mutated = mutate(base, <TestMutator>{
				myStrArray: {$splice: [[1, 1, "d"]]},
				myNumArray: {$splice: [[1, 2, 6], [0, 0, 7]]},
			});

			expect(mutated.myStrArray).to.deep.equal(["a", "d", "c"]);
			expect(mutated.myNumArray).to.deep.equal([7, 1, 6]);
			expect(base).to.deep.equal(backup);
		});

		it("$merge", function() {
			mutated = mutate(base, <TestMutator>{
				myObject: <any>{$merge: {bar: {baz: "asdf"}}}, // TODO: revisit <any> cast
			});

			expect(mutated.myObject).to.deep.equal({foo: "bar", bar: {baz: "asdf"}});
			expect(base).to.deep.equal(backup);
		});

		it("$add", function() {
			mutated = mutate(base, <TestMutator>{
				myStrSet: {$add: ["c", "d", "e"]},
			});

			expect((<any>Array).from(mutated.myStrSet)).to.deep.equal(["a", "b", "c", "d", "e"]);
			expect(base).to.deep.equal(backup);
		});

		it("$delete", function() {
			mutated = mutate(base, <TestMutator>{
				myStrSet: {$delete: ["c", "d"]},
			});

			expect((<any>Array).from(mutated.myStrSet)).to.deep.equal(["a", "b"]);
			expect(base).to.deep.equal(backup);
		});
	});


	describe("no-ops", function() {
		let base: Test = {
			myBool: true,
			myString: "my string",
			myNumber: 123,
			myObject: { foo: "bar" },
			myStrArray: ["a", "b", "c"],
			myNumArray: [1, 2, 3],
			myObjArray: [{a: 1}, {b: 2}, {c: 3}],
			myStrSet: new Set<string>(["a", "b", "c"])
		};

		let mutated: Test;

		it("$set", function() {
			mutated = mutate(base, <TestMutator>{
				myBool: {$set: true},
				myString: {$set: "my string"},
				myNumber: {$set: 123},
				myObject: <any>{foo: {$set: "bar"}}, // TODO: revisit <any> cast
				myStrArray: {$set: ["a", "b", "c"]},
				myNumArray: {$set: [1, 2, 3]},
				myStrSet: {$set: new Set<string>(["a", "b", "c"])},
			});

			expect(mutated).to.equal(base);
		});

		it("$inc", function() {
			mutated = mutate(base, <TestMutator>{ myNumber: {$inc: 0} });
			expect(mutated).to.equal(base);
		});

		it("$push", function() {
			mutated = mutate(base, <TestMutator>{
				myStrArray: {$push: []},
			});

			expect(mutated).to.equal(base);
		});

		it("$unshift", function() {
			mutated = mutate(base, <TestMutator>{
				myStrArray: {$unshift: []},
			});

			expect(mutated).to.equal(base);
		});

		it("$splice", function() {
			mutated = mutate(base, <TestMutator>{
				myStrArray: {$splice: [[0, 0]]},
			});

			expect(mutated).to.equal(base);
		});

		it("$merge", function() {
			mutated = mutate(base, <TestMutator>{
				myObject: <any>{$merge: {foo: "bar"}}, // TODO: revisit <any> cast
			});

			expect(mutated).to.equal(base);
		});

		it("$add", function() {
			mutated = mutate(base, <TestMutator>{
				myStrSet: {$add: ["a", "b", "c"]},
			});

			expect(mutated).to.equal(base);
		});

		it("$delete", function() {
			mutated = mutate(base, <TestMutator>{
				myStrSet: {$delete: ["d"]},
			});

			expect(mutated).to.equal(base);
		});
	});
});
