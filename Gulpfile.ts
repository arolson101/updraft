///<reference path="typings/index.d.ts"/>

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
var shell = require("gulp-shell");
var rename = require("gulp-rename");
import mocha = require("gulp-mocha");

var minify = false;

var tslintOpts = {
		//tslint: require("tslint")
};

var tsProject = ts.createProject("src/tsconfig.json", {
	sortOutput: true,
	noEmit: false,
	declaration: true,
	out: "dist/updraft.js"
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
	
	js = js.pipe(insert.transform(function(contents: string, file: any) {
		contents = contents.replace(/(Updraft = {})/g, "/* istanbul ignore next */ $1");
		contents = contents.replace(/(var _a(,|;))/g, "/* istanbul ignore next */ $1");
		return contents;
	}));
	

	if(minify) {
		js = js.pipe(uglify());
	}
	
	js = js
		.pipe(sourcemaps.write("./"))
		.pipe(gulp.dest("./"));

	return merge([dts, js]);
});


gulp.task('coverage', ['compile'], shell.task([
  "ts-node node_modules/istanbul/lib/cli.js cover node_modules/mocha/bin/_mocha test/*.ts"
]));


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


gulp.task("test", ["test-node", "test-phantomjs"]);


gulp.task("test-node", ["compile"], function () {
	return gulp.src(["test/*.ts", "test/*.js"])
		.pipe(mocha());
});


gulp.task('test-phantomjs', ["compile"], function() {
	return gulp.src('./test/test.html')
		.pipe(mochaPhantomJS({
			"webSecurityEnabled": false,
			"outputEncoding": "utf8",
			"localToRemoteUrlAccessEnabled": true
		}));
});


gulp.task('test-phantomjs-quiet', ["compile"], function() {
	return gulp.src('./test/test.html')
		.pipe(mochaPhantomJS({
			"reporter": "dot",
			"webSecurityEnabled": false,
			"outputEncoding": "utf8",
			"localToRemoteUrlAccessEnabled": true
		}));
});


gulp.task("sync", function() {
	return gulp.src(["bower.json"])
		.pipe(sync())
		.pipe(gulp.dest(".")); // write it to the same dir
});


gulp.task("default", ["compile", "coverage", "test-node", "test-phantomjs-quiet", "lint", /*"typedoc",*/ "sync"]);
