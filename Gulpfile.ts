///<reference path="typings/tsd.d.ts"/>

var gulp = require("gulp");
var gutil = require("gulp-util");
var merge = require("merge2");
var insert = require("gulp-insert");
var sourcemaps = require("gulp-sourcemaps");
var sync = require("gulp-config-sync");
var ts = require("gulp-typescript");
var typedoc = require("gulp-typedoc");
var uglify = require("gulp-uglify");
var tslint = require("gulp-tslint");
var mochaPhantomJS = require('gulp-mocha-phantomjs');
var istanbul = require('gulp-istanbul');
var rename = require("gulp-rename");
var insert = require('gulp-insert');
import mocha = require("gulp-mocha");

var minify = false;

var tslintOpts = {
		//tslint: require("tslint")
};

var tsProject = ts.createProject("tsconfig.json", {
	sortOutput: true,
	noEmit: false,
	declaration: true,
	out: "dist/updraft.js",
	typescript: require("typescript")
});


gulp.task("compile", function() {
	var tsResult = tsProject.src()
		.pipe(sourcemaps.init())
		.pipe(ts(tsProject));
	
	var dts = tsResult.dts
		.pipe(insert.transform(function(contents: string, file: any) {
			contents = contents.replace(/\/\/\/\s*\<reference path=".*"\s*\/\>\s*\n/ig, "");
			contents += "declare module \"updraft\" {\n" +
									"	export = Updraft;\n" +
									"}\n";
			return contents;
		}));
	
	dts = tsResult.dts.pipe(gulp.dest("./"));
	
	var js = tsResult.js;
	
	if(minify) {
		js = js.pipe(uglify());
	}
	
	js = js
		.pipe(sourcemaps.write("./"))
		.pipe(gulp.dest("./"));

	return merge([dts, js]);
});


gulp.task('pre-coverage', ['compile'], function () {
	return gulp.src(['dist/*.js'])
		// Covering files
		.pipe(istanbul())
		// Force `require` to return covered files
		.pipe(istanbul.hookRequire());
});


gulp.task('coverage', ['pre-coverage'], function () {
  return gulp.src(['test/*.ts'])
    .pipe(mocha())
    // Creating the reports after tests ran
    .pipe(istanbul.writeReports())
});


gulp.task("typedoc", function() {
	return gulp.src(["src/*.ts"])
		.pipe(typedoc({
			module: "commonjs",
			out: "./doc",
			theme: "minimal",
			name: "Updraft",
			target: "es5",
			mode: "file",
			includeDeclarations: true
		}));
});


gulp.task("watch", ["compile"], function() {
		gulp.watch("src/*.ts", ["compile"]);
});


gulp.task("lint", function () {
	return gulp.src(["src/*.ts", "test/*.ts"])
		.pipe(tslint(tslintOpts))
		.pipe(tslint.report("verbose"));
});


gulp.task("test", ["test-node"/*, "test-phantomjs"*/]);


gulp.task("test-node", ["compile"], function () {
	return gulp.src(["test/*.ts", "test/*.js"])
		.pipe(mocha());
});


gulp.task('test-phantomjs', ["compile"], function() {
     return gulp.src('./test/test.html')
        .pipe(mochaPhantomJS({ 'webSecurityEnabled': false, "outputEncoding": "utf8", "localToRemoteUrlAccessEnabled": true }));
});


gulp.task("sync", function() {
	return gulp.src(["bower.json"])
		.pipe(sync())
		.pipe(gulp.dest(".")); // write it to the same dir
});


gulp.task("default", ["compile", "coverage", "lint", "typedoc", "sync"]);
