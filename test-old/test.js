/*global Updraft, Enum, chai, sinon, describe, before, beforeEach, after, afterEach, it */
/*jshint -W106*/

'use strict';

var assert = chai.assert;
var expect = chai.expect;
chai.should();

// phantomjs doesn't like opening databases with different names than the last time
// to clear the cache, go to %APPDATA%\..\Local\Ofi Labs\PhantomJS
var storeProps = {name: 'test db 1'};

var Column = Updraft.Column;

var updraft_kv = {
  _indices: {},
  _triggers: {},
  key: 'TEXT PRIMARY KEY',
  value: 'TEXT'
};

describe("key/value storage", function() {
  it("should save and restore keys", function() {
    var store = new Updraft.Store();
    return store.open(storeProps).then(function() {
      return Promise.all([
        store.set('foo', 'foo 1'),
        store.set('bar', 123),
        store.set('baz', {test1: true, test2: 'string', test3: [1, 2, 3]})
      ])
      .then(function() {
        store.close();
      });
    })
    .then(function() {
      return store.open(storeProps);
    })
    .then(function() {
      var foo = store.get('foo');
      expect(foo).to.equal('foo 1');

      var bar = store.get('bar');
      expect(bar).to.equal(123);

      var baz = store.get('baz');
      expect(baz).to.deep.equal({test1: true, test2: 'string', test3: [1, 2, 3]});
    });
  });
});

describe("simple models", function () {
  var store;

  function Class() { Updraft.Instance.apply(this, arguments); }
  Updraft.createClass(Class, {
    tableName: 'template',
    columns: {
        col1: Column.Int().Key(),
        col2: Column.Int(),
        col3: Column.Date(),
        col4: Column.DateTime()
    },
    foo: function() {
      this.col4 = 'foo';
    }
  });

  function ClassCtor() { Updraft.Instance.apply(this, arguments); }
  Updraft.createClass(ClassCtor, {
    tableName: 'templateCtor',
    columns: {
      col1: Column.Int().Key(),
      col2: Column.Int().Default(-1),
    }
  });

  before(function () {
    store = new Updraft.Store();
  });

  beforeEach(function () {
    store.addClass(Class);
    store.addClass(ClassCtor);
  });

  afterEach(function () {
    store.close();
  });

  it("constructor should initialize values", function() {
    var x = new ClassCtor();
    assert.equal(x.col2, -1, "constructor should initialize this value");
    assert.deepEqual(x._changes(), [], "values set in the constructor should not be marked as changed");
  });

  it("#purge should delete all tables", function () {
    store.close();
    return store.purge(storeProps)
      .then(function () { return store.open(storeProps); })
      .then(store.readSchema.bind(store))
      .should.eventually.deep.equal({updraft_kv: updraft_kv});
  });

  it("should be able to create instances", function () {
    var x1 = new Class();
    assert(x1, "empty object");
    assert.deepEqual(x1._changes(), [], "empty object should not have any changes");

    x1.col1 = 1;
    x1.col2 = 2;
    assert.deepEqual(x1._changes(), ['col1', 'col2'], "object should track changed fields");

    var x2 = new Class({col1: 123});
    assert.equal(x2.col1, 123, "constructer properties should be stored on the new object");
    assert.deepEqual(x2._changes(), ['col1'], "object should be flagged with changed fields");

    x1.foo();
    assert.equal(x1.col4, 'foo', "functions should be installed as methods");
  });

  it("should be able to store & retrieve instances", function () {
    var x1 = new Class({col1: 1, col2: 10});
    var x2 = new Class({col1: 2, col2: 20});
    var x3 = new Class({col1: 3, col2: 30, col3: new Date(2001, 12, 25, 12, 30)});

    return store.open(storeProps)
      .then(function () {
        return store.save(x1, x2, x3);
      })
      .then(function () {
        assert.deepEqual(x1._changes(), [], "changes should be reset");
        assert.deepEqual(x2._changes(), [], "changes should be reset");
        assert.deepEqual(x3._changes(), [], "changes should be reset");

        return Promise.all([
          Class.get(1).should.eventually.have.property('col2', 10),
          Class.get(2).should.eventually.have.property('col2', 20),
          Class.get(3).then(function(r3) {
            var d3 = new Date(2001, 12, 25, 12, 30);
            expect(r3.col3.getFullYear()).to.equal(d3.getFullYear());
            expect(r3.col3.getMonth()).to.equal(d3.getMonth());
            expect(r3.col3).to.deep.equal(d3);
          }),
          Class.get(4).should.eventually.be.null
        ]);
      });
  });


  it("should be able to delete instances", function () {
    var x1 = new Class({col1: 1, col2: 10});
    var x2 = new Class({col1: 2, col2: 20});
    var x3 = new Class({col1: 3, col2: 30});

    return store.open(storeProps)
      .then(function () {
        return store.save(x1, x2, x3);
      })
      .then(function () {
        return store.delete([x1, x3]);
      })
      .then(function () {
        return Promise.all([
          Class.all.get().should.eventually.have.length(1),
          Class.get(1).should.eventually.be.null,
          Class.get(2).should.eventually.have.property('col2', 20),
          Class.get(3).should.eventually.be.null,
        ]);
      });
  });
});

describe('enum support', function() {
  var store;
  var x1, x2, x3, x4;

  var Colors = new Enum(['Red', 'Green', 'Blue']);

  function Class() { Updraft.Instance.apply(this, arguments); }
  Updraft.createClass(Class, {
    tableName: 'template',
    columns: {
      id: Column.Int().Key(),
      color: Column.Enum(Colors),
    }
  });

  before(function () {
    store = new Updraft.Store();
    store.addClass(Class);
    return store.open(storeProps)
      .then(function () {
        x1 = new Class({id: 1, color: Colors.Red});
        x2 = new Class({id: 2, color: Colors.Blue});
        x3 = new Class({id: 3, color: Colors.Green});
        x4 = new Class({id: 4, color: Colors.Blue});
        return store.save(x1, x2, x3, x4);
      });
  });

  after(function () {
    store.close();
  });

  var checkQuery = function (expected) {
    return function (results) {
      expect(results).to.have.length(expected.length);
      expected.forEach(function(e, i) {
        var r = results[i];
        expect(r.Color).to.equal(e.Color);
      });
    };
  };

  it("save/load", function() {
    return Class.all.get().then(checkQuery([x1, x2, x3, x4]));
  });

  it("query", function() {
    return Class.all.where('color', '=', Colors.Blue).get().then(checkQuery([x2, x4]));
  });
});

describe('query interface', function () {
  var store;
  var x1, x2, x3;

  function Class() { Updraft.Instance.apply(this, arguments); }
  Updraft.createClass(Class, {
    tableName: 'template',
    columns: {
      col1: Column.Int().Key(),
      col2: Column.Int(),
      col3: Column.Text()
    }
  });

  before(function () {
    store = new Updraft.Store();
    store.addClass(Class);
    return store.open(storeProps)
      .then(function () {
        x1 = new Class({col1: 1, col2: 10, col3: 'foo'});
        x2 = new Class({col1: 2, col2: 20, col3: 'bar'});
        x3 = new Class({col1: 3, col2: 30, col3: 'baz'});
        return store.save(x1, x2, x3);
      });
  });

  after(function () {
    store.close();
  });

  var checkQuery = function (expected) {
    return function (results) {
      expect(results).to.have.length(expected.length);
      expected.forEach(function(e, i) {
        var r = results[i];
        Object.keys(e._model.columns).forEach(function (prop) {
          expect(r).to.have.property(prop, e[prop], 'object index '+i);
        });
      });
    };
  };

  it("#all", function() {
    return Class.all.get().then(checkQuery([x1, x2, x3])); // it's probably the insertion order, but not guaranteed!
  });

  it("#count", function() {
    return Class.all.count().should.eventually.equal(3);
  });

  it("#where", function() {
    return Class.all.where('col2', '=', 20).get().then(checkQuery([x2]));
  });

  it("#or", function() {
    return Class.all.where('col2', '=', 20).or('col2', '=', 30).get().then(checkQuery([x2, x3]));
  });

  it("#and", function() {
    return Class.all.where('col2', '>', 10).and('col2', '<', 30).get().then(checkQuery([x2]));
  });

  it("#order (ascending)", function() {
    return Class.all.order('col2').get().then(checkQuery([x1, x2, x3]));
  });

  it("#order (descending)", function() {
    return Class.all.order('col2', false).get().then(checkQuery([x3, x2, x1]));
  });

  it("#limit/#offset", function() {
    return Class.all.order('col2').limit(2).offset(2).get().then(checkQuery([x3]));
  });

  it("#count (filtered)", function() {
    return Class.all.where('col2', '>', 10).count().should.eventually.equal(2);
  });

  it("multiple", function() {
    return Class.all.where('col2', '>', 10).and('col2', '<', 30).or('col2', '=', 10).count().should.eventually.equal(2);
  });

  it("like", function() {
    return Class.all.where('col3', 'LIKE', '%a%').count().should.eventually.equal(2);
  });
});


describe('migrations', function() {
  var store;
  var sqlSpy;

  function ClassV1() { Updraft.Instance.apply(this, arguments); }
  Updraft.createClass(ClassV1, {
    tableName: 'template',
    columns: {
      col1: Column.Int().Key(),
      col2: Column.Int(),
      col3: Column.Int(),
      col4: Column.Int(),
    }
  });

  var checkSql = function(message, regexs) {
    assert.equal(sqlSpy.callCount, regexs.length, message + " call count");
    for(var i=0; i<regexs.length; i++) {
      var spyCall = sqlSpy.getCall(i);
      var sql = spyCall.args[1];
      var args = spyCall.args[2];
      for(var j=0; args && j<args.length; j++) {
        sql = sql.replace('?', args[j]);
      }
      var regex = regexs[i];
      assert.match(sql, regex, message + " sql call " + i);
    }
  };
  var readSchema = /SELECT .* FROM sqlite_master/i;
  var loadKeyValues = /SELECT .* FROM updraft_kv/i;

  before(function() {
    store = new Updraft.Store();
    sqlSpy = sinon.spy(store, 'exec');
  });

  beforeEach(function() {
    // init a v1 table
    return store.purge(storeProps)
      .then(function() {
        store.addClass(ClassV1);
        return store.open(storeProps)
          .then(function() {
            store.close();
            sqlSpy.reset();
        });
      });
  });

  afterEach(function() {
    store.logSql = false;
    store.close();
  });

  var expectedSchemaV1 = {
    updraft_kv: updraft_kv,
    template: {
      _indices: {},
      _triggers: {},
      col1: 'INTEGER PRIMARY KEY',
      col2: 'INTEGER',
      col3: 'INTEGER',
      col4: 'INTEGER',
    }
  };

  it("should start with a known schema state", function() {

    return store.open(storeProps)
      .then(store.readSchema.bind(store))
      .should.eventually.deep.equal(expectedSchemaV1);
  });


  var runMigration = function(message, newTemplate, expectedSchema, sqls, debug) {
    if(debug) {
      store.logSql = true;
      console.log("*** " + message + " begin");
    }
    store.addClass(newTemplate);
    return store.open(storeProps)
    .then(store.readSchema.bind(store))
    .then(function(schema) {
      if(debug) {
        console.log("*** new schema: ", schema);
      }
      return schema;
    })
    .should.eventually.deep.equal(expectedSchema, "schema for '" + message + "'")
    .then(function() {
      checkSql(message, sqls);
      if(debug) {
        console.log("*** " + message + " end");
      }
    });
  };

  describe("simple migrations", function() {
    it("add a column", function() {
      function NewClass() { Updraft.Instance.apply(this, arguments); }
      Updraft.createClass(NewClass, {
        tableName: 'template',
        columns: {
          col1: Column.Int().Key(),
          col2: Column.Int(),
          col3: Column.Int(),
          col4: Column.Int(),
          new5: Column.Int(),
        }
      });
      var expectedSchema = {
        updraft_kv: updraft_kv,
        template: {
          _indices: {},
          _triggers: {},
          col1: 'INTEGER PRIMARY KEY',
          col2: 'INTEGER',
          col3: 'INTEGER',
          col4: 'INTEGER',
          new5: 'INTEGER',
        }
      };

      return runMigration("add a column", NewClass, expectedSchema, [
        readSchema,
        /ALTER TABLE template ADD COLUMN new5/i,
        loadKeyValues,
        readSchema
      ], false);
    });

    it("add 3 columns", function() {
      function NewClass() { Updraft.Instance.apply(this, arguments); }
      Updraft.createClass(NewClass, {
        tableName: 'template',
        columns: {
          col1: Column.Int().Key(),
          col2: Column.Int(),
          col3: Column.Int(),
          col4: Column.Int(),
          new5: Column.Int(),
          new6: Column.Int(),
          new7: Column.Int(),
        }
      });
      var expectedSchema = {
        updraft_kv: updraft_kv,
        template: {
          _indices: {},
          _triggers: {},
          col1: 'INTEGER PRIMARY KEY',
          col2: 'INTEGER',
          col3: 'INTEGER',
          col4: 'INTEGER',
          new5: 'INTEGER',
          new6: 'INTEGER',
          new7: 'INTEGER',
        }
      };

      return runMigration("add 3 columns", NewClass, expectedSchema, [
        readSchema,
        /ALTER TABLE template ADD COLUMN new5/i,
        /ALTER TABLE template ADD COLUMN new6/i,
        /ALTER TABLE template ADD COLUMN new7/i,
        loadKeyValues,
        readSchema
      ], false);
    });

    it("add an index", function() {
      function NewClass() { Updraft.Instance.apply(this, arguments); }
      Updraft.createClass(NewClass, {
        tableName: 'template',
        columns: {
          col1: Column.Int().Key(),
          col2: Column.Int().Index(),
          col3: Column.Int(),
          col4: Column.Int(),
        }
      });
      var expectedSchema = {
        updraft_kv: updraft_kv,
        template: {
          _indices: {
            'index_template__col2': "CREATE INDEX index_template__col2 ON template (col2)"
          },
          _triggers: {},
          col1: 'INTEGER PRIMARY KEY',
          col2: 'INTEGER',
          col3: 'INTEGER',
          col4: 'INTEGER',
        }
      };

      return runMigration("add and remove an index", NewClass, expectedSchema, [
        readSchema,
        /CREATE INDEX index_template__col2 ON template/i,
        loadKeyValues,
        readSchema
      ], false)
      .then(function() {
        store.close();
        sqlSpy.reset();
        return runMigration("remove an index", ClassV1, expectedSchemaV1, [
          readSchema,
          /DROP INDEX .*/i,
          loadKeyValues,
          readSchema
        ], false);
      });
    });
  });


  describe("complex migrations", function() {
    it("rename column", function() {
      function NewClass() { Updraft.Instance.apply(this, arguments); }
      Updraft.createClass(NewClass, {
        tableName: 'template',
        columns: {
          col1: Column.Int().Key(),
          col2: Column.Int(),
          new3: Column.Int(),
          col4: Column.Int(),
        },
        renamedColumns: {
          'col3': 'new3'
        }
      });
      var expectedSchema = {
        updraft_kv: updraft_kv,
        template: {
          _indices: {},
          _triggers: {},
          col1: 'INTEGER PRIMARY KEY',
          col2: 'INTEGER',
          new3: 'INTEGER',
          col4: 'INTEGER',
        }
      };

      return runMigration("rename column", NewClass, expectedSchema, [
        readSchema,
        /CREATE TABLE new_template/i,
        /INSERT INTO new_template \(col1, col2, new3, col4\) SELECT col1, col2, col3, col4 FROM template/i,
        /DROP TABLE template/i,
        /ALTER TABLE new_template RENAME TO template/i,
        loadKeyValues,
        readSchema
      ], false);
    });


    it("rename everything", function() {
      function NewClass() { Updraft.Instance.apply(this, arguments); }
      Updraft.createClass(NewClass, {
        tableName: 'template',
        columns: {
          new1: Column.Int().Key(),
          new2: Column.Int(),
          new3: Column.Int(),
          new4: Column.Int(),
        },
        renamedColumns: {
          'col1': 'new1',
          'col2': 'new2',
          'col3': 'new3',
          'col4': 'new4'
        }
      });
      var expectedSchema = {
        updraft_kv: updraft_kv,
        template: {
          _indices: {},
          _triggers: {},
          new1: 'INTEGER PRIMARY KEY',
          new2: 'INTEGER',
          new3: 'INTEGER',
          new4: 'INTEGER',
        }
      };

      return runMigration("rename everything", NewClass, expectedSchema, [
        readSchema,
        /CREATE TABLE new_template/i,
        /INSERT INTO new_template \(new1, new2, new3, new4\) SELECT col1, col2, col3, col4 FROM template/i,
        /DROP TABLE template/i,
        /ALTER TABLE new_template RENAME TO template/i,
        loadKeyValues,
        readSchema
      ], false);
    });


    it("delete column", function() {
      function NewClass() { Updraft.Instance.apply(this, arguments); }
      Updraft.createClass(NewClass, {
        tableName: 'template',
        columns: {
          col1: Column.Int().Key(),
          col2: Column.Int(),
        }
      });
      var expectedSchema = {
        updraft_kv: updraft_kv,
        template: {
          _indices: {},
          _triggers: {},
          col1: 'INTEGER PRIMARY KEY',
          col2: 'INTEGER',
        }
      };

      return runMigration("delete column", NewClass, expectedSchema, [
        readSchema,
        /CREATE TABLE new_template/i,
        /INSERT INTO new_template \(col1, col2\) SELECT col1, col2 FROM template/i,
        /DROP TABLE template/i,
        /ALTER TABLE new_template RENAME TO template/i,
        loadKeyValues,
        readSchema
      ], false);
    });


    it("delete and rename and add", function() {
      function NewClass() { Updraft.Instance.apply(this, arguments); }
      Updraft.createClass(NewClass, {
        tableName: 'template',
        columns: {
          col1: Column.Int().Key(),
          col2: Column.Int(),
          new3: Column.Int(),
          new4: Column.Int(),
        },
        renamedColumns: {
          'col3': 'new3',
        }
      });
      var expectedSchema = {
        updraft_kv: updraft_kv,
        template: {
          _indices: {},
          _triggers: {},
          col1: 'INTEGER PRIMARY KEY',
          col2: 'INTEGER',
          new3: 'INTEGER',
          new4: 'INTEGER'
        }
      };

      return runMigration("delete and rename and add", NewClass, expectedSchema, [
        readSchema,
        /CREATE TABLE new_template/i,
        /INSERT INTO new_template \(col1, col2, new3\) SELECT col1, col2, col3 FROM template/i,
        /DROP TABLE template/i,
        /ALTER TABLE new_template RENAME TO template/i,
        loadKeyValues,
        readSchema
      ], false);
    });
  });
});


describe("child objects", function() {
  var store;
  var favorite;

  function Image() { Updraft.Instance.apply(this, arguments); }
  function Artist() { Updraft.Instance.apply(this, arguments); }
  function City() { Updraft.Instance.apply(this, arguments); }
  function Tag() { Updraft.Instance.apply(this, arguments); }
  function Color() { Updraft.Instance.apply(this, arguments); }

  Updraft.createClass(Image, {
    tableName: 'images',
    columns: {
      imageId: Column.Int().Key(),
      name: Column.Text(),
      artist: Column.Ptr(Artist),
      tags: Column.Set(Tag),
      colors: Column.Set(Color)
    }
  });

  Updraft.createClass(Artist, {
    tableName: 'artists',
    columns: {
      artistId: Column.Int().Key(),
      name: Column.Text(),
      city: Column.Ptr(City),
      masterpiece: Column.Ptr(Image)
    }
  });

  Updraft.createClass(City, {
    tableName: 'city',
    columns: {
      cityId: Column.Int().Key(),
      name: Column.Text()
    }
  });

  Updraft.createClass(Tag, {
    tableName: 'tags',
    columns: {
      tagId: Column.Int().Key(),
      name: Column.Text()
    }
  });

  Updraft.createClass(Color, {
    tableName: 'colors',
    columns: {
      colorId: Column.Int().Key(),
      name: Column.Text()
    }
  });


  before(function() {
    store = new Updraft.Store();
    return store.purge(storeProps)
    .then(function() {
      store.addClass(Image);
      store.addClass(Artist);
      store.addClass(City);
      store.addClass(Tag);
      store.addClass(Color);

      var red = new Color({colorId: 300, name: 'red'});
      var green = new Color({colorId: 301, name: 'green'});
      var blue = new Color({colorId: 302, name: 'blue'});

      var venice = new City({cityId: 100, name: 'Venice'});
      var paris = new City({cityId: 101, name: 'Paris'});

      var monet = new Artist({artistId: 500, name: 'Monet', city: paris});
      var daVinci = new Artist({artistId: 501, name: 'Da Vinci', city: venice});
      var vanGogh = new Artist({artistId: 502, name: 'Van Gogh', city: paris});

      var monaLisa = new Image({imageId: 1, name: 'mona lisa', artist: daVinci});
      var lastSupper = new Image({imageId: 2, name: 'the last supper', artist: daVinci});
      var waterLillies = new Image({imageId: 3, name: 'water lillies', artist: monet});
      var starryNight = new Image({imageId: 4, name: 'starry night', artist: vanGogh});

      var plants = new Tag({tagId: 801, name: 'plants'});
      favorite = new Tag({tagId: 802, name: 'favorite'});

      daVinci.masterpiece = monaLisa;
      monet.masterpiece = waterLillies;
      vanGogh.masterpiece = starryNight;

      lastSupper.tags.push(favorite);
      waterLillies.tags = [favorite, plants];
      starryNight.tags.push(plants);

      waterLillies.colors = [red, green, blue];

      return store.open(storeProps)
      .then(function() {
        store.save(venice, paris,
                    monet, daVinci, vanGogh,
                    monaLisa, lastSupper, waterLillies, starryNight,
                    plants, favorite,
                    red, green, blue
                   );
      });
    });
  });

  after(function() {
    store.close();
  });

  it("should nest pointer fields", function() {
    return Image.all.where('artist.city.name', '=', 'Paris').get()
    .then(function(results) {
      expect(results).to.have.length(2);
      expect(results[0]).to.have.property('name', 'water lillies');
      expect(results[1]).to.have.property('name', 'starry night');
    });
  });


  it("should retrieve sets", function() {
    return Image.get(3)
    .then(function(result) {
      expect(result.tags.values()).to.have.length(2);
    });
  });


  it("should search in sets", function() {
    return Image.all.where('tags', 'contains', favorite).order('imageId').get()
    .then(function(results) {
      expect(results).to.have.length(2);
      expect(results[0]).to.have.property('name', 'the last supper');
      expect(results[1]).to.have.property('name', 'water lillies');
    });
  });


  it("should search in multiple sets", function() {
    return Image.all.where('tags', 'contains', favorite).and('colors', 'contains', 302).order('imageId').get()
    .then(function(results) {
      expect(results).to.have.length(1);
      expect(results[0]).to.have.property('name', 'water lillies');
    });
  });


  it("should search in childrens' sets", function() {
    return Artist.all.where('masterpiece.tags', 'contains', favorite).order('name').get()
    .then(function(results) {
      expect(results).to.have.length(1);
      expect(results[0]).to.have.property('name', 'Monet');
    });
  });
});