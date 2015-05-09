'use strict';

var gulp = require('gulp');
var merge = require('merge2');
var mochaPhantomJS = require('gulp-mocha-phantomjs');
var sourcemaps = require('gulp-sourcemaps');
var sync = require('gulp-config-sync');
var ts = require('gulp-typescript');
var typedoc = require("gulp-typedoc");
var uglify = require('gulp-uglify');

var minify = true;

gulp.task('compile', function() {
    var tsProject = ts.createProject('tsconfig.json');
    var tsResult = tsProject.src() // instead of gulp.src(...)
        .pipe(sourcemaps.init())
        .pipe(ts(tsProject));

    var dts = tsResult.dts.pipe(gulp.dest('./dist'));
    var js = tsResult.js;

    if(minify) {
        js = js.pipe(uglify());
    }

    js = js
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./dist'));

    return merge([dts, js]);
});

gulp.task("typedoc", function() {
    return gulp
        .src(["src/*.ts"])
        .pipe(typedoc({
            module: "commonjs",
            out: "./doc",
            theme: "minimal",
            name: "Updraft",
            target: "es5",
            mode: "file",
            includeDeclarations: true
        }))
    ;
});

gulp.task('watch', ['compile'], function() {
    gulp.watch('src/*.ts', ['compile']);
});

gulp.task('test', ['compile'], function() {
     return gulp.src('./test/test.html')
        .pipe(mochaPhantomJS({ 'webSecurityEnabled': false, "outputEncoding": "utf8", "localToRemoteUrlAccessEnabled": true }));
});

gulp.task('sync', function() {
  return gulp.src(['bower.json', 'component.json'])
    .pipe(sync())
    .pipe(gulp.dest('.')); // write it to the same dir
});

gulp.task('default', ['compile', 'test', 'typedoc', 'sync']);
