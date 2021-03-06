///<reference path="./Text.ts"/>
///<reference path="./verify.ts"/>

namespace Updraft {

	export enum ColumnType {
		int,
		real,
		bool,
		text,
		enum,
		date,
		datetime,
		json,
		set
	}
	
	/** A typescript enum class will have string keys resolving to the enum values */
	export interface TypeScriptEnum {
		[enumValue: number]: string;
	}
	
	export interface EnumValue {
		toString(): string;
	}
	
	/** An enum class (e.g. (this one)[https://github.com/adrai/enum]) should provide a static method 'get' to resolve strings into enum values */
	export interface EnumClass {
		get(value: string | number): EnumValue;
	}
	
	export type Serializable = string | number;
	
	/**
	* Column in db.  Use static methods to create columns.
	*/
	export class Column {
		public isKey: boolean;
		public isIndex: boolean;
		public type: ColumnType;
		//public setTable: ClassTemplate<any>;
		public defaultValue: number | boolean | string;
		public enum: EnumClass | TypeScriptEnum;
		public element: Column;
	
		constructor(type: ColumnType) {
			this.type = type;
			if (type == ColumnType.bool) {
				this.defaultValue = false;
			}
		}
	
		/**
			* Column is the primary key.  Only one column can have this set.
			*/
		Key(): Column {
			this.isKey = true;
			return this;
		}
	
		/**
			* Create an index for this column for faster queries.
			*/
		Index(): Column {
			this.isIndex = true;
			return this;
		}
	
		/**
			* Set a default value for the column
			*/
		// TODO
		Default(value: number | boolean | string): Column {
			if (this.type == ColumnType.bool) {
				value = value ? true : false;
			}
			this.defaultValue = value;
			return this;
		}
		
		deserialize(value: Serializable): any {
			switch (this.type) {
				case ColumnType.int:
				case ColumnType.real:
				case ColumnType.text:
					return value;
	
				case ColumnType.bool:
					return value ? true : false;
	
				case ColumnType.json:
					return fromText(<string>value);
	
				case ColumnType.enum:
					if (typeof (<EnumClass>this.enum).get === "function") {
						let enumValue = (<EnumClass>this.enum).get(value);
						verify(!value || enumValue, "error getting enum value %s", value);
						return enumValue;
					}
					verify(value in this.enum, "enum value %s not in %s", value, this.enum);
					return this.enum[value];
	
				case ColumnType.date:
				case ColumnType.datetime:
					verify(!value || parseFloat(<string>value) == value, "expected date to be stored as a number: %s", value);
					return value ? new Date(parseFloat(<string>value) * 1000) : undefined;
					
				case ColumnType.set:
					verify(<any>value instanceof Set, "value should already be a set");
					return value;
	
				/* istanbul ignore next */
				default:
					throw new Error("unsupported column type " + ColumnType[this.type]);
			}
		}
		
		serialize(value: any): Serializable {
			switch (this.type) {
				case ColumnType.int:
				case ColumnType.real:
				case ColumnType.text:
					return value;
	
				case ColumnType.bool:
					return value ? 1 : 0;
	
				case ColumnType.json:
					return toText(value);
	
				case ColumnType.enum:
					/* istanbul ignore if: safe to store these in db, though it's probably an error to be anything other than a number/object */
					if (typeof value === "string" || typeof value === undefined || value === null) {
						return value;
					}
					else if (typeof value === "number") {
						verify(value in this.enum, "enum doesn't contain %s", value);
						return (<TypeScriptEnum>this.enum)[value];
					}
					verify(typeof value.toString === "function", "expected an enum value supporting toString(); got %s", value);
					return value.toString();
	
				case ColumnType.date:
				case ColumnType.datetime:
					verify(value == undefined || value instanceof Date, "expected a date, got %s", value);
					let date = (value == undefined) ? null : ((<Date>value).getTime() / 1000);
					return date;
	
				/* istanbul ignore next */
				default:
					throw new Error("unsupported column type " + ColumnType[this.type]);
			}
		}
	
		/** create a column with "INTEGER" affinity */
		static Int(): Column {
			return new Column(ColumnType.int);
		}
	
		/** create a column with "REAL" affinity */
		static Real(): Column {
			return new Column(ColumnType.real);
		}
	
		/** create a column with "BOOL" affinity */
		static Bool(): Column {
			return new Column(ColumnType.bool);
		}
	
		/** create a column with "TEXT" affinity */
		static Text(): Column {
			return new Column(ColumnType.text);
		}
	
		/** create a column with "TEXT" affinity */
		static String(): Column {
			return new Column(ColumnType.text);
		}
	
		/** a typescript enum or javascript object with instance method "toString" and class method "get" (e.g. {@link https://github.com/adrai/enum}). */
		static Enum(enum_: EnumClass | TypeScriptEnum): Column {
			let c = new Column(ColumnType.enum);
			c.enum = enum_;
			return c;
		}
	
		/** a javascript Date objct, stored in db as seconds since Unix epoch (time_t) [note: precision is seconds] */
		static Date(): Column {
			return new Column(ColumnType.date);
		}
	
		/** a javascript Date objct, stored in db as seconds since Unix epoch (time_t) [note: precision is seconds] */
		static DateTime(): Column {
			return new Column(ColumnType.datetime);
		}
	
		/** object will be serialized & restored as JSON text */
		static JSON(): Column {
			return new Column(ColumnType.json);
		}
	
		/** unordered collection */
		static Set(type: ColumnType): Column {
			let c = new Column(ColumnType.set);
			c.element = new Column(type);
			return c;
		}
	
	
		static sql(val: Column): string {
			let stmt = "";
			switch (val.type) {
				case ColumnType.int:
					stmt = "INTEGER";
					break;
				case ColumnType.bool:
					stmt = "BOOLEAN NOT NULL";
					break;
				case ColumnType.real:
					stmt = "REAL";
					break;
				case ColumnType.text:
					stmt = "TEXT";
					break;
				case ColumnType.json:
					stmt = "CLOB";
					break;
				case ColumnType.enum:
					stmt = "CHARACTER(20)";
					break;
				case ColumnType.date:
					stmt = "DATE";
					break;
				case ColumnType.datetime:
					stmt = "DATETIME";
					break;
	
				/* istanbul ignore next */
				default:
					throw new Error("unsupported type " + ColumnType[val.type]);
			}
	
			if ("defaultValue" in val) {
				let escape = function(x: string | number | boolean): string {
					/* istanbul ignore else */
					if (typeof x === "number") {
						return <any>x;
					}
					else if (typeof x === "string") {
						return "'" + (<string>x).replace(/'/g, "''") + "'";
					}
					else {
						verify(false, "default value (%s) must be number or string", x);
					}
				};
				stmt += " DEFAULT " + escape(val.serialize(val.defaultValue));
			}
	
			return stmt;
		}
	
		static fromSql(text: string): Column {
			let parts: string[] = text.split(" ");
			let col: Column = null;
			switch (parts[0]) {
				case "INTEGER":
					col = Column.Int();
					break;
				case "BOOLEAN":
					col = Column.Bool();
					break;
				case "REAL":
					col = Column.Real();
					break;
				case "TEXT":
					col = Column.Text();
					break;
				case "CLOB":
					col = Column.JSON();
					break;
				case "CHARACTER(20)":
					col = new Column(ColumnType.enum);
					break;
				case "DATE":
					col = Column.Date();
					break;
				case "DATETIME":
					col = Column.DateTime();
					break;
	
				/* istanbul ignore next */
				default:
					throw new Error("unsupported type: " + ColumnType[parts[0]]);
			}
	
			let match = text.match(/DEFAULT\s+'((?:[^']|'')*)'/i);
			if (match) {
				let val: any = match[1].replace(/''/g, "'");
				col.Default(val);
			}
			else {
				match = text.match(/DEFAULT\s+(\S+)/i);
				if (match) {
					let val: any = match[1];
					let valnum = parseFloat(val);
					/* istanbul ignore else: unlikely to be anything but a number */
					if (val == valnum) {
						val = valnum;
					}
					col.Default(val);
				}
			}
	
			return col;
		}
	
		static equal(a: Column, b: Column): boolean {
			if (a.type != b.type) {
				return false;
			}
			if ((a.defaultValue || b.defaultValue) && (a.defaultValue != b.defaultValue)) {
				return false;
			}
			/* istanbul ignore next: I don't think this is possible */
			if ((a.isKey || b.isKey) && (a.isKey != b.isKey)) {
				return false;
			}
			return true;
		}
	}
	
	export interface ColumnSet {
		[name: string]: Column;
	}
}
