'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');
var jsdoc = require("gulp-jsdoc");
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var browserify = require('browserify');
var mochaPhantomJS = require('gulp-mocha-phantomjs');
var uglify = require('gulp-uglify');
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');

function makeBundle(watch) {
  var b = browserify({
    debug: true,
    cache: {},
    packageCache: {},
    fullPaths: true
  });
  
  var bundle = function(file) {
    if(file) {
      file.map(function (fileName) {
        gutil.log('File updated', gutil.colors.yellow(fileName));
      });
    }
    
    return b
      .bundle()
      .on('error', function(err) {
        gutil.log("Browserify error:", err.message);
      })
      .pipe(source('updraft.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
      // Add transformation tasks to the pipeline here.
      //.pipe(uglify())
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('./dist/'));
  }

  if(watch) {
    b = watchify(b);
    b.on('update', bundle);
  }
  
  b.add('./src/main.js');
  return bundle();
};

gulp.task('bundle', function() {
  makeBundle(false);
});

gulp.task('watch', function() {
  makeBundle(true);
});

gulp.task('lint', function() {
  return gulp.src('./src/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('jsdoc', function() {
  return gulp.src(['./src/*.js', 'README.md'])
    .pipe(jsdoc('./docs', null, null, {outputSourceFiles: false}));
});

gulp.task('test', ['bundle'], function() {
     return gulp.src('./test/test.html')
        .pipe(mochaPhantomJS({ 'webSecurityEnabled': false, "outputEncoding": "utf8", "localToRemoteUrlAccessEnabled": true }));
});


gulp.task('default', ['bundle', 'lint', 'test', 'jsdoc']);
