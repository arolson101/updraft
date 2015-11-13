/// <reference path="chai/chai.d.ts" />
/// <reference path="chai-as-promised/chai-as-promised.d.ts" />
/// <reference path="mocha/mocha.d.ts" />
/// <reference path="promises-a-plus/promises-a-plus.d.ts" />
/// <reference path="clone/clone.d.ts" />
/// <reference path="node/node.d.ts" />
/// <reference path="sqlite3/sqlite3.d.ts" />
/// <reference path="gulp-mocha/gulp-mocha.d.ts" />
/// <reference path="es6-collections/es6-collections.d.ts" />
/// <reference path="es6-promise/es6-promise.d.ts" />
/// <reference path="chai-datetime/chai-datetime.d.ts" />

declare interface EnumValue {
	value: number;
	key: string;
}

declare module "enum" {
	interface Enum {
		enums: EnumValue[];
		get(value: number | string): EnumValue;
	}
	
	let Enum: {
		new(): Enum; 
		new(values?: string[]): Enum;
		new(values?: { [key: string]: number }): Enum;
	}
	
	export = Enum;
}