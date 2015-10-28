export enum ColumnType {
  int,
  real,
  bool,
  text,
  blob,
  enum,
  date,
  datetime,
  json,
  ptr,
  set
}

/**
 * Column in db.  Use static methods to create columns.
 */
export class Column {
  public isKey: boolean;
  public isIndex: boolean;
  public type: ColumnType;
  //public ref: ClassTemplate<any> /*| ColumnType*/; // TODO: add set(string|number|etc)
  //public setTable: ClassTemplate<any>;
  public defaultValue: number | boolean | string;
  //public enum: EnumClass | TypeScriptEnum;

  constructor(type: ColumnType) {
    this.type = type;
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
    this.defaultValue = value;
    return this;
  }

  /** create a column with 'INTEGER' affinity */
  static Int(): Column {
    return new Column(ColumnType.int);
  }

  /** create a column with 'REAL' affinity */
  static Real(): Column {
    return new Column(ColumnType.real);
  }

  /** create a column with 'BOOL' affinity */
  static Bool(): Column {
    return new Column(ColumnType.bool);
  }

  /** create a column with 'TEXT' affinity */
  static Text(): Column {
    return new Column(ColumnType.text);
  }

  /** create a column with 'TEXT' affinity */
  static String(): Column {
    return new Column(ColumnType.text);
  }

  /** create a column with 'BLOB' affinity */
  static Blob(): Column {
    var c = new Column(ColumnType.blob);
    return c;
  }

  // /** a javascript object with instance method 'toString' and class method 'get' (e.g. {@link https://github.com/adrai/enum}). */
  // static Enum(enum_: EnumClass | TypeScriptEnum): Column {
  //   var c = new Column(ColumnType.enum);
  //   c.enum = enum_;
  //   return c;
  // }

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

  // /** points to an object in another table.  Its affinity will automatically be that table's key's affinity */
  // static Ptr(ref: ClassTemplate<any>): Column {
  //   var c = new Column(ColumnType.ptr);
  //   c.ref = ref;
  //   return c;
  // }

  // /** unordered collection */
  // static Set(ref: ClassTemplate<any> /*| ColumnType*/): Column {
  //   var c = new Column(ColumnType.set);
  //   c.ref = ref;
  //   return c;
  // }


  static sql(val: Column): string {
    var stmt = "";
    switch (val.type) {
      case ColumnType.int:
        stmt = 'INTEGER';
        break;
      case ColumnType.bool:
        stmt = 'BOOL';
        break;
      case ColumnType.real:
        stmt = 'REAL';
        break;
      case ColumnType.text:
      case ColumnType.json:
      case ColumnType.enum:
        stmt = 'TEXT';
        break;
      case ColumnType.blob:
        stmt = 'BLOB';
        break;
      case ColumnType.date:
        stmt = 'DATE';
        break;
      case ColumnType.datetime:
        stmt = 'DATETIME';
        break;
      default:
        throw new Error("unsupported type");
    }

    if ('defaultValue' in val) {
      stmt += ' DEFAULT ' + val.defaultValue;
    }

    return stmt;
  }
}

export interface ColumnSet {
	[name: string]: Column;
}