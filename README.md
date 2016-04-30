# Updraft

`Updraft` is an asynchronous Javascript object-relational mapping (ORM)-like library, very similar to
[persistence.js](https://github.com/coresmart/persistencejs).  It can work in the browser, on a server using
node.js, or in a [Cordova](https://cordova.apache.org/) app using the [SQLitePlugin](https://github.com/brodysoft/Cordova-SQLitePlugin)
(basically, anywhere WebSQL or a SQLlite interface is supported).  It does not support MySQL, in-memory,
local storage, or IndexedDB.

## Status
`Updraft` has not yet been used in any project and is still under heavy development.  Expect bugs.
You shouldn't use it if you know nothing about SQL.

Sync is planned but not implemented.

## Motivations
* Automatic schema migration (within reason)
* Syncing with cloud-based databases, like [Dropbox's Sync API](https://www.dropbox.com/developers/sync)
  or [iCloud's CloudKit](https://developer.apple.com/icloud/documentation/cloudkit-storage/)
* Modern best practices- asynchronous programming using [Promises](https://www.promisejs.org/),
  [Test-driven development](http://en.wikipedia.org/wiki/Test-driven_development),
  [Code coverage](http://gotwarlost.github.io/istanbul/)

## Change history
Most databases store only the latest records, which works well when there is only one database.  Once
you start syncing between multiple databases, you start running into problems.  How do you merge records?
What if one user deleted a record that another modified?

Updraft addresses these problems by storing baseline records and changes.  Users can insert a baseline (that
is, whole) record at any time, but this is intended to be done only once, because only the latest record is
considered the baseline.  Subsequent modifications should be made as `deltas`- you tell the database to made
a change, and it applies the delta to the latest record, as well as keeping a record of all deltas and their 
timestamp.  Every time a change comes in, it runs all the deltas in order and updates the latest record.

This system makes conflict resolution trivial- if two users change the same record offline, once they resume 
syncing their changes will automatically merge based on the time they came in.

## Deltas
Deltas are based on [React's immutability helpers](https://facebook.github.io/react/docs/update.html), which
in turn is based on [MongoDB's query language](http://docs.mongodb.org/manual/core/crud-introduction/#query), though
there is no tie to any database.  They are immutable operations, meaning they leave the source object untouched.  
For example:

```js
var record = {
  id: 123,
  text: "original text"
};

var delta = {
  text: { $set: "new text" }
};

var newRecord = Updraft.update(record, delta);
// record -> { id: 123, text: "original text" }
// newRecord -> { id: 123, text: "new text" }
```

## Important differences from other ORM frameworks
You should think of `Updraft` as more of a wrapper over executing SQL statements yourself, rather than a complete ORM
framework.  Objects won't be cached or saved unless you do it yourself.  You will have to define your primary key
(only one is supported) as well as create and assign a unique value for that key.

You also won't find one-to-one or many-to-many or other SQL-centric ideas.  You can define a field of type 'set' 
where you can have a (homogeneous) set of values or object keys.  You will be responsible for tracking object
lifetimes and deleting any orphaned entities.

## Dependencies
You need a JS environment that [supports Promises](http://caniuse.com/#feat=promises) or you can use a library like
[lie](https://github.com/calvinmetcalf/lie).

Though written in TypeScript, it will run in any JS environment (browser, node.js)

## Installation

npm:

    npm install --save updraft

Bower:

    bower install --save updraft

## Usage

Basic usage is as follows:
```js
var taskSpec = {
  name: 'tasks',
  columns: {
    id: Updraft.Column.Text().Key(),
    description: Updraft.Column.Text(),
    done: Updraft.Column.Bool()
  }
};

var sqlite3 = require("sqlite3");
var db = new sqlite3.Database("test.db");

var store = new Updraft.createStore({ db: Updraft.createSQLiteWrapper(db) });
var taskTable = store.createTable(taskSpec);
var time = Date.now();

store.open({name: 'my database'})
  .then(function() {

    var task = {
      id: 123,
      description: "task description",
      done: false
    };

    // save baseline
    return taskTable.add([{ time: time, create: task }]);
  })
  .then(function() {

    var delta = {
      description: { $set: "changed description" },
      done: { $set: true }
    };
    
    // in a real application you would just use Date.now(), since it's probably not the
    // same second you created the record
    time = time + 1;

    // save the change
    return taskTable.add([{ time: time, delta: delta }]);
  })
  .then(function() {
    // find the value with id 123.  See docs for more advanced query options
    return taskTable.find({id: 123});
  })
  .then(function(results) {
    var task = results[0];
    // -> { id: 123, description: "changed description" }
  })
  ;
```

If you use TypeScript, you can use interfaces to make your life easier and let the compiler catch errors:

```typescript
import D = Updraft.Delta;
import Q = Updraft.Query;

// either set up multiple interfaces for declarations and queries:
interface Task {
  id: number;
  description: string;
  done: boolean; 
}

interface TaskDelta {
  id: number; // NOTE: database does not support changing the key value
  description: D.str;
  done: D.bool;
}

interface TaskQuery {
  id: Q.num;
  description: Q.str;
  done: Q.bool;
}

// or use templates to keep things [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)
interface _Task<key, str, bool> {
  id: key;
  description: str;
  done: bool;
}

interface Task extends _Task<number, string, boolean> {}
interface TaskDelta extends _Task<number, D.str, D.bool> {}
interface TaskQuery extends _Task<Q.num, Q.str, Q.bool> {}

// then set up your table
type TaskTable = Updraft.Table<Task, TaskDelta, TaskQuery>;
type TaskTableSpec = Updraft.TableSpec<Task, TaskDelta, TaskQuery>;

const taskSpec: TaskTableSpec = {
  name: 'tasks',
  columns: {
    id: Updraft.Column.Text().Key(),
    description: Updraft.Column.Text(),
    done: Updraft.Column.Bool()
  }
};

// ...

var store = new Updraft.createStore({ db: Updraft.createSQLiteWrapper(db) });
var taskTable: TaskTable = store.createTable(taskSpec);

```
For advanced usage, see the documentation.

## Enums

Updraft supports typescript enums and enum-like objects, such as those created using the [enum](https://github.com/adrai/enum) 
library, with no dependency on any specific library.  They will be saved as the object's 'toString()' value and restored using the
class's 'get(value)' method.  They are stored in the db as strings.

```js

var store = new Updraft.createStore(/* ... */);

var ColorTemperature = new Enum({'Cool', 'Neutral', 'Warm'});

var paintTable = store.createClass({
  tableName: 'paints',
  columns: {
    name: Updraft.Column.Text().Key(),
    colorTemp: Updraft.Column.Enum(ColorTemperature)
  }
});

var paint = {
  name: "cyan",
  colorTemp: ColorTemperature.Cool,
};

// ...

paintTable.find({ colorTemp: ColorTemperature.Cool }).then(/* ... */);
```

## Schemas and Migration
For most simple changes, `Updraft` will have you covered.  You can feel free to add a new field, a new class, remove
fields or classes, add or remove indices, and rename fields without needing to do any extra work.  You can also change
field types, but because the underlying database is SQLite, the 'type' is only a column
[affinity](https://www.sqlite.org/datatype3.html)- no schema change/migration will happen; you can always store any
type (int/string/blob/etc) in any field.

During migrations, removed and renamed columns will be preserved not only in the resulting table but also by walking
every change and updating the delta objects.  Because of this, it might take some time depending on
how many records you have.

Not supported:
* changing the primary key
* changing table names
* multi-column primary keys

## Documentation

There is auto-generated documentation in doc/index.html

For examples see the test folder

## Contributing

We'll check out your contribution if you:

* Provide a comprehensive suite of tests for your fork.
* Have a clear and documented rationale for your changes.
* Package these up in a pull request.

We'll do our best to help you out with any contribution issues you may have.

## License

MIT. See `LICENSE.txt` in this directory.
