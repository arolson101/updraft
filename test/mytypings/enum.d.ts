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
