/// <reference path="chai/chai.d.ts" />
/// <reference path="chai-as-promised/chai-as-promised.d.ts" />
/// <reference path="mocha/mocha.d.ts" />
/// <reference path="promises-a-plus/promises-a-plus.d.ts" />
/// <reference path="object-assign/object-assign.d.ts" />
/// <reference path="clone/clone.d.ts" />
/// <reference path="node/node.d.ts" />
/// <reference path="sqlite3/sqlite3.d.ts" />
/// <reference path="gulp-mocha/gulp-mocha.d.ts" />
/// <reference path="es6-collections/es6-collections.d.ts" />
/// <reference path="es6-promise/es6-promise.d.ts" />


declare module "invariant" {
	function invariant(condition: any, format: string, a?: any, b?: any, c?: any, d?: any, e?: any, f?: any): void;
	export = invariant;
}

declare module "deep-equal" {
	function equal(a: any, b: any): boolean;
	export = equal;
}
