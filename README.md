# Updraft

`Updraft` is an asynchronous Javascript object-relational mapping (ORM)-like library, very similar to 
[persistence.js](https://github.com/coresmart/persistencejs).  It can work in the browser, on a server using
node.js, or in a [Cordova](https://cordova.apache.org/) app using the [SQLitePlugin](https://github.com/brodysoft/Cordova-SQLitePlugin)
(basically, anywhere WebSQL or a WebSQL-like interface is supported).  It does not support MySQL, in-memory, 
local storage, or IndexedDB.

#### TODO
* key/value store
* sync

## Motivations
* Automatic schema migration (within reason)
* Syncing with cloud-based databases, like [Dropbox's Sync API](https://www.dropbox.com/developers/sync) or [iCloud's CloudKit](https://developer.apple.com/icloud/documentation/cloudkit-storage/)
* Modern best practices- asynchronous programming using [Promises](https://www.promisejs.org/) and [Test-driven development](http://en.wikipedia.org/wiki/Test-driven_development)

## Important differences from other ORM frameworks
You should think of `Updraft` as more of a wrapper over executing SQL statements yourself, rather than a complete ORM
framework.  Objects won't be cached or saved unless you do it yourself.  You will have to define your primary key (probably `id`)
as well as create and assign a unique `id` (more on that later).

You also won't find one-to-one or many-to-many or other SQL-centric ideas.  You can define a field of type 'ptr', where its value
will be another object's key, or of type 'list' where you can have a (homogeneous) list of object keys.  You will be responsible for tracking
object lifetimes and deleting any orphaned entities.

## Dependencies
You need a JS environment that [supports Promises](http://caniuse.com/#feat=promises) or you can use a library like [Q](https://github.com/kriskowal/q)
and then make them available with `Promise = Q.Promise`.

You will also need a not-ancient js environment that [supports `Object.defineProperty`](http://kangax.github.io/compat-table/es5/#Object.defineProperty)

## Installation

Using Bower:

    bower install updraft

Or grab the [source](https://github.com/arolson101/updraft/dist/updraft.js) ([minified](https://github.com/arolson101/updraft/dist/updraft.min.js)).

## Usage

Basic usage is as follows:

    var store = new Updraft.Store();
    
    var Task = store.createClass({
      tableName: 'tasks',
      columns: {
        name: { type: 'text', key: true },
        description: { type: 'text' },
        done: { type: 'bool' }
      }
    });
    
    store.open({name: 'my database'})
      .then(function() {
      
        var task = new Task();
        task.name = "create a task";
        task.description = "task description";
        
        store.save([task])
          .then(function() {
          
            // task saved!
            
            Task.get("create a task")
              .then(function(task) {
              
                // task retrieved!
                
              });
          });
      });

For advanced usage, see the documentation.

## Schemas and Migration
For most simple changes, `Updraft` will have you covered.  You can feel free to add a new field, a new class, remove fields or classes,
add or remove indices, and rename fields without needing to do any extra work.  You can also change field types, but because the 
underlying database is SQLite, the 'type' is only a column [affinity](https://www.sqlite.org/datatype3.html)- no schema change/migration
will happen; you can always store any type (int/string/blob/etc) in any field.

Not supported:
* changing the primary key
* multi-column primary keys

## Documentation

Start with `docs/MAIN.md`.

## Contributing

We'll check out your contribution if you:

* Provide a comprehensive suite of tests for your fork.
* Have a clear and documented rationale for your changes.
* Package these up in a pull request.

We'll do our best to help you out with any contribution issues you may have.

## License

MIT. See `LICENSE.txt` in this directory.
