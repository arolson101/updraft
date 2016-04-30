///<reference path="../typings/tsd.d.ts"/>
///<reference path="../dist/updraft.d.ts"/>

require("./updraft_loader");
import clone = require("clone");
import chai = require("chai");
import chaiDateTime = require("chai-datetime");

let expect = chai.expect;
chai.use(chaiDateTime);

import D = Updraft.Delta;
import update = Updraft.update;

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
interface TestDelta extends _Test<D.bool, D.str, D.num, D.date, D.obj, D.strArray, D.numArray, D.objArray, D.strSet> {};

describe("update()", function() {
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
		let updated: Test;
		
		it("$set", function() {
			updated = update(base, <TestDelta>{
				myBool: {$set: false},
				myString: {$set: "new string"},
				myNumber: {$set: 0},
				myDate: {$set: new Date(2001, 11, 1, 13, 30, 1)},
				myObject: <any>{foo: {$set: "baz"}}, // TODO: revisit <any> cast
				myStrArray: {$set: ["d"]},
				myNumArray: {$set: [0]},
				myStrSet: {$set: new Set<string>(["d"])},
			});

			expect(updated.myBool).to.equal(false);
			expect(updated.myString).to.equal("new string");
			expect(updated.myNumber).to.equal(0);
			expect(updated.myDate).to.equalTime(new Date(2001, 11, 1, 13, 30, 1));
			expect(updated.myDate).to.not.equalTime(new Date(2000, 1, 1));
			expect(updated.myObject).to.deep.equal({foo: "baz"});
			expect(updated.myStrArray).to.deep.equal(["d"]);
			expect(updated.myNumArray).to.deep.equal([0]);
			expect(updated.myStrSet).to.deep.equal(new Set<string>(["d"]));

			expect(base).to.deep.equal(backup);
		});

		it("$inc", function() {
			updated = update(base, <TestDelta>{ myNumber: {$inc: 101} });
			expect(updated.myNumber).to.equal(224);

			updated = update(base, <TestDelta>{ myNumber: {$inc: -101} });
			expect(updated.myNumber).to.equal(22);

			updated = update(base, <TestDelta>{ myNumber: {$inc: 1.01} });
			expect(updated.myNumber).to.equal(124.01);

			expect(base).to.deep.equal(backup);
		});

		it("$push", function() {
			updated = update(base, <TestDelta>{
				myStrArray: {$push: ["d"]},
				myNumArray: {$push: [4, 5, 6]},
			});

			expect(updated.myStrArray).to.deep.equal(["a", "b", "c", "d"]);
			expect(updated.myNumArray).to.deep.equal([1, 2, 3, 4, 5, 6]);
			expect(base).to.deep.equal(backup);
			
			let noArrays = <Test>{};
			let hasArray = update(noArrays, <TestDelta>{
				myStrArray: {$push: ["d"]},
				myNumArray: {$push: [4, 5, 6]},
			});

			expect(hasArray.myStrArray).to.deep.equal(["d"]);
			expect(hasArray.myNumArray).to.deep.equal([4, 5, 6]);
			expect(noArrays).to.not.haveOwnProperty("myStrArray");
			expect(noArrays).to.not.haveOwnProperty("myNumArray");
			
			updated = update(undefined, {
				$push: ["c"]
			});

			expect(updated).to.deep.equal(["c"]);
		});

		it("$unshift", function() {
			updated = update(base, <TestDelta>{
				myStrArray: {$unshift: ["d"]},
				myNumArray: {$unshift: [4, 5, 6]},
			});

			expect(updated.myStrArray).to.deep.equal(["d", "a", "b", "c"]);
			expect(updated.myNumArray).to.deep.equal([4, 5, 6, 1, 2, 3]);
			expect(base).to.deep.equal(backup);
		});

		it("$splice", function() {
			updated = update(base, <TestDelta>{
				myStrArray: {$splice: [[1, 1, "d"]]},
				myNumArray: {$splice: [[1, 2, 6], [0, 0, 7]]},
			});

			expect(updated.myStrArray).to.deep.equal(["a", "d", "c"]);
			expect(updated.myNumArray).to.deep.equal([7, 1, 6]);
			expect(base).to.deep.equal(backup);
		});

		it("$merge", function() {
			updated = update(base, <TestDelta>{
				myObject: <any>{$merge: {bar: {baz: "asdf"}}}, // TODO: revisit <any> cast
			});

			expect(updated.myObject).to.deep.equal({foo: "bar", bar: {baz: "asdf"}});
			expect(base).to.deep.equal(backup);
		});

		it("$add", function() {
			updated = update(base, <TestDelta>{
				myStrSet: {$add: ["c", "d", "e"]},
			});

			expect((<any>Array).from(updated.myStrSet)).to.deep.equal(["a", "b", "c", "d", "e"]);
			expect(base).to.deep.equal(backup);
			
			let noSets = <Test>{};
			let hasSet = update(noSets, <TestDelta>{
				myStrSet: {$add: ["c", "d", "e"]},
			});

			expect((<any>Array).from(hasSet.myStrSet)).to.deep.equal(["c", "d", "e"]);
		});

		it("$delete (object)", function() {
			updated = update(base, <TestDelta>{
				myObject: {$delete: ["foo", "bar"]},
			});

			expect(updated.myObject).to.not.have.key("foo");
			expect(updated.myObject).to.not.have.key("bar");
			expect(base).to.deep.equal(backup);
		});

		it("$delete (set)", function() {
			updated = update(base, <TestDelta>{
				myStrSet: {$delete: ["c", "d"]},
			});

			expect((<any>Array).from(updated.myStrSet)).to.deep.equal(["a", "b"]);
			expect(base).to.deep.equal(backup);
		});
		
		it("bad arguments to update", function() {
			updated = update(base, <TestDelta>{
				a: {"b": "c"}
			});

			expect(base === updated).to.be.true;
			
			updated = update(1, <TestDelta>{
				myString: {$set: "c"}
			});

			expect(1 === updated).to.be.true;
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

		let updated: Test;

		it("$set", function() {
			updated = update(base, <TestDelta>{
				myBool: {$set: true},
				myString: {$set: "my string"},
				myNumber: {$set: 123},
				myObject: <any>{foo: {$set: "bar"}}, // TODO: revisit <any> cast
				myStrArray: {$set: ["a", "b", "c"]},
				myNumArray: {$set: [1, 2, 3]},
				myStrSet: {$set: new Set<string>(["a", "b", "c"])},
			});

			expect(updated).to.equal(base);
		});

		it("$inc", function() {
			updated = update(base, <TestDelta>{ myNumber: {$inc: 0} });
			expect(updated).to.equal(base);
		});

		it("$push", function() {
			updated = update(base, <TestDelta>{
				myStrArray: {$push: []},
			});

			expect(updated).to.equal(base);
		});

		it("$unshift", function() {
			updated = update(base, <TestDelta>{
				myStrArray: {$unshift: []},
			});

			expect(updated).to.equal(base);
		});

		it("$splice", function() {
			updated = update(base, <TestDelta>{
				myStrArray: {$splice: [[0, 0]]},
			});

			expect(updated).to.equal(base);
		});

		it("$merge", function() {
			updated = update(base, <TestDelta>{
				myObject: <any>{$merge: {foo: "bar"}}, // TODO: revisit <any> cast
			});

			expect(updated).to.equal(base);
		});

		it("$add", function() {
			updated = update(base, <TestDelta>{
				myStrSet: {$add: ["a", "b", "c"]},
			});

			expect(updated).to.equal(base);
		});

		it("$delete (object)", function() {
			updated = update(base, <TestDelta>{
				myObject: {$delete: ["bar"]},
			});

			expect(updated).to.equal(base);
		});
		
		it("$delete (set)", function() {
			updated = update(base, <TestDelta>{
				myStrSet: {$delete: ["d"]},
			});

			expect(updated).to.equal(base);
		});

	});
	
	describe("coverage", function() {
		it("shallowEqual - set", function() {
			let set1 = new Set(["a", "b", "c"]);
			let set2 = new Set(["a", "b", "c"]);
			let set3 = new Set(["a", "b", "d"]);
			let set4 = new Set(["a", "b"]);
			let set5 = new Set(["a", "b", "c", "d"]);
			expect(Updraft.shallowEqual(set1, set2)).to.be.true;
			expect(Updraft.shallowEqual(set1, set3)).to.be.false;
			expect(Updraft.shallowEqual(set1, set4)).to.be.false;
			expect(Updraft.shallowEqual(set1, set5)).to.be.false;
		});
	});
});
