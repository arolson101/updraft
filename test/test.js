/*global Updraft, chai, sinon, describe, before, beforeEach, after, afterEach, it */

'use strict';

var assert = chai.assert;
var expect = chai.expect;
chai.should();

// phantomjs doesn't like opening databases with different names than the last time
// to clear the cache, go to %APPDATA%\..\Local\Ofi Labs\PhantomJS
var storeProps = {name: 'test db 1'};

describe("basic usage", function () {
  var store, Class,

  Template = {
    tableName: 'template',
    columns: {
      col1: { key: true, type: 'int' },
      col2: { type: 'int' },
      col3: { type: 'int' },
      col4: { type: 'int' }
    }
  };

  before(function () {
    store = new Updraft.Store();
  });

  beforeEach(function () {
    Class = store.createClass(Template);
  });

  afterEach(function () {
    store.close();
  });

  it("#purge should delete all tables", function () {
    store.close();
    return store.purge(storeProps)
      .then(function () { return store.open(storeProps); })
      .then(store.readSchema)
      .should.eventually.deep.equal({});
  });

  it("should be able to create instances", function () {
    var x1 = new Class();
    assert(x1, "empty object");
    assert.deepEqual(x1.changes(), [], "empty object should not have any changes");

    x1.col1 = 1;
    x1.col2 = 2;
    assert.deepEqual(x1.changes(), ['col1', 'col2'], "object should track changed fields");

    var x2 = new Class({col1: 123});
    assert.equal(x2.col1, 123, "constructer properties should be stored on the new object");
    assert.deepEqual(x2.changes(), ['col1'], "object should be flagged with changed fields");
  });

  it("should be able to store & retrieve instances", function () {
    var x1 = new Class({col1: 1, col2: 10});
    var x2 = new Class({col1: 2, col2: 20});
    var x3 = new Class({col1: 3, col2: 30});

    return store.open(storeProps)
      .then(function () {
        return store.save([x1, x2, x3]);
      })
      .then(function () {
        assert.deepEqual(x1.changes(), [], "changes should be reset");
        assert.deepEqual(x2.changes(), [], "changes should be reset");
        assert.deepEqual(x3.changes(), [], "changes should be reset");

      
        return Promise.all([
          Class.get(1).should.eventually.have.property('col2', 10),
          Class.get(2).should.eventually.have.property('col2', 20),
          Class.get(3).should.eventually.have.property('col2', 30),
          Class.get(4).should.eventually.be.null
        ]);
      });
  });
});

describe('query interface', function () {
  var store, Class;
  var x1, x2, x3;

  var Template = {
    tableName: 'template',
    columns: {
      col1: { key: true, type: 'int' },
      col2: { type: 'int' },
      col3: { type: 'text' }
    }
  };

  before(function () {
    store = new Updraft.Store();
    Class = store.createClass(Template);
    return store.open(storeProps)
      .then(function () {
        x1 = new Class({col1: 1, col2: 10, col3: 'foo'});
        x2 = new Class({col1: 2, col2: 20, col3: 'bar'});
        x3 = new Class({col1: 3, col2: 30, col3: 'baz'});
        return store.save([x1, x2, x3]);
      });
  });

  after(function () {
    store.close();
  });

  var checkQuery = function (expected) {
    return function (results) {
      expect(results).to.have.length(expected.length);
      for (var i=0; i<expected.length; i++) {
        var e = expected[i];
        var r = results[i];
        Object.keys(e.factory.columns).forEach(function (prop) {
          expect(r).to.have.property(prop, e[prop], 'object index '+i);
        });
      }
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
  
  var TemplateV1 = {
    tableName: 'template',
    columns: {
      col1: { key: true, type: 'int' },
      col2: { type: 'int' },
      col3: { type: 'int' },
      col4: { type: 'int' },
    }
  };

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
  
  before(function() {
    store = new Updraft.Store();
    sqlSpy = sinon.spy(store, 'exec');
  });

  beforeEach(function() {
    // init a v1 table
    return store.purge(storeProps)
      .then(function() {
        store.createClass(TemplateV1);
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
      .then(store.readSchema)
      .should.eventually.deep.equal(expectedSchemaV1);
  });

  
  var runMigration = function(message, newTemplate, expectedSchema, sqls, debug) {
    if(debug) {
      console.log("*** " + message + " begin");
      store.logSql = true;
    }
    store.createClass(newTemplate);
    return store.open(storeProps)
    .then(store.readSchema)
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
    it("add a columns", function() {
      var newTemplate = {
        tableName: 'template',
        columns: {
          col1: { key: true, type: 'int' },
          col2: { type: 'int' },
          col3: { type: 'int' },
          col4: { type: 'int' },
          new5: { type: 'int' },
        }
      };
      var expectedSchema = {
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

      return runMigration("add a column", newTemplate, expectedSchema, [
        readSchema,
        /ALTER TABLE template ADD COLUMN new5/i,
        readSchema
      ], false);
    });

    it("add 3 columns", function() {
      var newTemplate = {
        tableName: 'template',
        columns: {
          col1: { key: true, type: 'int' },
          col2: { type: 'int' },
          col3: { type: 'int' },
          col4: { type: 'int' },
          new5: { type: 'int' },
          new6: { type: 'int' },
          new7: { type: 'int' },
        }
      };
      var expectedSchema = {
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

      return runMigration("add 3 columns", newTemplate, expectedSchema, [
        readSchema,
        /ALTER TABLE template ADD COLUMN new5/i,
        /ALTER TABLE template ADD COLUMN new6/i,
        /ALTER TABLE template ADD COLUMN new7/i,
        readSchema
      ], false);
    });
    
    it("add an index", function() {
      var newTemplate = {
        tableName: 'template',
        columns: {
          col1: { key: true, type: 'int' },
          col2: { type: 'int', index: true },
          col3: { type: 'int' },
          col4: { type: 'int' },
        }
      };
      var expectedSchema = {
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

      return runMigration("add and remove an index", newTemplate, expectedSchema, [
        readSchema,
        /CREATE INDEX index_template__col2 ON template/i,
        readSchema
      ], false)
      .then(function() {
        store.close();
        sqlSpy.reset();
        return runMigration("remove an index", TemplateV1, expectedSchemaV1, [
          readSchema,
          /DROP INDEX .*/i,
          readSchema
        ], false);
      });
    });
  });
  

  describe("complex migrations", function() {
    it("rename column", function() {
      var newTemplate = {
        tableName: 'template',
        columns: {
          col1: { key: true, type: 'int' },
          col2: { type: 'int' },
          new3: { type: 'int' },
          col4: { type: 'int' },
        },
        renamedColumns: {
          'col3': 'new3'
        }
      };
      var expectedSchema = {
        template: {
          _indices: {},
          _triggers: {},
          col1: 'INTEGER PRIMARY KEY',
          col2: 'INTEGER',
          new3: 'INTEGER',
          col4: 'INTEGER',
        }
      };

      return runMigration("rename column", newTemplate, expectedSchema, [
        readSchema,
        /CREATE TABLE new_template/i,
        /INSERT INTO new_template \(col1, col2, new3, col4\) SELECT col1, col2, col3, col4 FROM template/i,
        /DROP TABLE template/i,
        /ALTER TABLE new_template RENAME TO template/i,
        readSchema
      ], false);
    });
    
    
    it("rename everything", function() {
      var newTemplate = {
        tableName: 'template',
        columns: {
          new1: { key: true, type: 'int' },
          new2: { type: 'int' },
          new3: { type: 'int' },
          new4: { type: 'int' },
        },
        renamedColumns: {
          'col1': 'new1',
          'col2': 'new2',
          'col3': 'new3',
          'col4': 'new4'
        }
      };
      var expectedSchema = {
        template: {
          _indices: {},
          _triggers: {},
          new1: 'INTEGER PRIMARY KEY',
          new2: 'INTEGER',
          new3: 'INTEGER',
          new4: 'INTEGER',
        }
      };

      return runMigration("rename everything", newTemplate, expectedSchema, [
        readSchema,
        /CREATE TABLE new_template/i,
        /INSERT INTO new_template \(new1, new2, new3, new4\) SELECT col1, col2, col3, col4 FROM template/i,
        /DROP TABLE template/i,
        /ALTER TABLE new_template RENAME TO template/i,
        readSchema
      ], false);
    });
    
    
    it("delete column", function() {
      var newTemplate = {
        tableName: 'template',
        columns: {
          col1: { key: true, type: 'int' },
          col2: { type: 'int' },
        }
      };
      var expectedSchema = {
        template: {
          _indices: {},
          _triggers: {},
          col1: 'INTEGER PRIMARY KEY',
          col2: 'INTEGER',
        }
      };

      return runMigration("delete column", newTemplate, expectedSchema, [
        readSchema,
        /CREATE TABLE new_template/i,
        /INSERT INTO new_template \(col1, col2\) SELECT col1, col2 FROM template/i,
        /DROP TABLE template/i,
        /ALTER TABLE new_template RENAME TO template/i,
        readSchema
      ], false);
    });
    
    it("delete and rename and add", function() {
      var newTemplate = {
        tableName: 'template',
        columns: {
          col1: { key: true, type: 'int' },
          col2: { type: 'int' },
          new3: { type: 'int' },
          new4: { type: 'int' },
        },
        renamedColumns: {
          'col3': 'new3',
        }
      };
      var expectedSchema = {
        template: {
          _indices: {},
          _triggers: {},
          col1: 'INTEGER PRIMARY KEY',
          col2: 'INTEGER',
          new3: 'INTEGER',
          new4: 'INTEGER'
        }
      };

      return runMigration("delete and rename and add", newTemplate, expectedSchema, [
        readSchema,
        /CREATE TABLE new_template/i,
        /INSERT INTO new_template \(col1, col2, new3\) SELECT col1, col2, col3 FROM template/i,
        /DROP TABLE template/i,
        /ALTER TABLE new_template RENAME TO template/i,
        readSchema
      ], false);
    });
  });
});


describe("child objects", function() {
  var store, Image, Artist, City, Tag, Color;
  
  before(function() {
    store = new Updraft.Store();
    return store.purge(storeProps)
    .then(function() {
      Image = store.createClass({
        tableName: 'images',
        columns: {
          imageId: { key: true, type: 'int' },
          name: { type: 'text' },
          artist: { type: 'ptr' },
          tags: { type: 'list' },
          colors: { type: 'list' }
        }
      });

      Artist = store.createClass({
        tableName: 'artists',
        columns: {
          artistId: { type: 'int', key: true },
          name: { type: 'text' },
          city: { type: 'ptr' }
        }
      });

      City = store.createClass({
        tableName: 'city',
        columns: {
          cityId: { key: true, type: 'int' },
          name: { type: 'text' }
        }
      });
      
      Tag = store.createClass({
        tableName: 'tags',
        columns: {
          tagId: { key: true, type: 'int' },
          name: { type: 'text' }
        }
      });
      
      Color = store.createClass({
        tableName: 'colors',
        columns: {
          colorId: { key: true, type: 'int' },
          name: { type: 'text' }
        }
      });
      
      Image.columns.artist.ref = Artist;
      Image.columns.tags.ref = Tag;
      Image.columns.colors.ref = Color;
      Artist.columns.city.ref = City;
      
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
      var favorite = new Tag({tagId: 802, name: 'favorite'});
      
      lastSupper.tags.push(favorite);
      waterLillies.tags = [favorite, plants];
      starryNight.tags.push(plants);
      
      waterLillies.colors = [red, green, blue];
      
      return store.open(storeProps)
      .then(function() {
        store.save([venice, paris,
                    monet, daVinci, vanGogh,
                    monaLisa, lastSupper, waterLillies, starryNight,
                    plants, favorite,
                    red, green, blue
                   ]);
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
  
  
  it("should retrieve lists", function() {
    return Image.get(3)
    .then(function(result) {
      expect(result.tags).to.have.length(2);
    });
  });
  
});
