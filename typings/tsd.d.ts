/// <reference path="chai/chai.d.ts" />
/// <reference path="chai-as-promised/chai-as-promised.d.ts" />
/// <reference path="mocha/mocha.d.ts" />
/// <reference path="promises-a-plus/promises-a-plus.d.ts" />
/// <reference path="object-assign/object-assign.d.ts" />
/// <reference path="clone/clone.d.ts" />
/// <reference path="node/node.d.ts" />
/// <reference path="sqlite3/sqlite3.d.ts" />


declare module "invariant" {
	function invariant(condition: any, format: string, a?: any, b?: any, c?: any, d?: any, e?: any, f?: any): void;
	export = invariant;
}
