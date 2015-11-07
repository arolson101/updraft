///<reference path="typings/tsd.d.ts"/>

var gulp = require("gulp");
var gutil = require("gulp-util");
var merge = require("merge2");
var sourcemaps = require("gulp-sourcemaps");
var sync = require("gulp-config-sync");
var ts = require("gulp-typescript");
var concat = require('gulp-concat');
var typedoc = require("gulp-typedoc");
var uglify = require("gulp-uglify");
var tslint = require("gulp-tslint");
var mochaPhantomJS = require('gulp-mocha-phantomjs');
import mocha = require("gulp-mocha");
var webpack = require("webpack");
var webpackConfig = require("./webpack.config.js");

//var minify = true;

var tsconfig = require("./tsconfig.json").compilerOptions;
delete tsconfig.noEmit;
tsconfig.sortOutput = true;

var tslintOpts = {
		//tslint: require("tslint")
};

// gulp.task("compile", function() {
// 		// var tsProject = ts.createProject("tsconfig.json", {
// 		// 	sortOutput: true,
// 		// 	noEmit: false,
// 		// 	typescript: require("typescript")
// 		// });
// 		// var tsResult = tsProject.src() // instead of gulp.src(...)
// 		// 		.pipe(sourcemaps.init())
// 		// 		.pipe(ts(tsProject));

//     var tsResult = gulp.src('src/**/*.ts')
// 				.pipe(sourcemaps.init())
//         .pipe(ts(tsconfig));

// 		var dts = tsResult.dts.pipe(gulp.dest("./dist"));
// 		var js = tsResult.js;

// 		// if(minify) {
// 		//     js = js.pipe(uglify());
// 		// }

// 		js = js
// 				.pipe(concat('updraft.js'))
// 				.pipe(sourcemaps.write("./"))
// 				.pipe(gulp.dest("./dist"));

// 		return merge([dts, js]);
// });


gulp.task("compile", function(callback: any) {
    // modify some webpack config options
    var myConfig = Object.create(webpackConfig);
    // myConfig.plugins = myConfig.plugins.concat(
    //     new webpack.DefinePlugin({
    //         "process.env": {
    //             // This has effect on the react lib size
    //             "NODE_ENV": JSON.stringify("production")
    //         }
    //     }),
    //     new webpack.optimize.DedupePlugin(),
    //     new webpack.optimize.UglifyJsPlugin()
    // );

    // run webpack
    webpack(myConfig, function(err: Error, stats: any) {
        if (err) throw new gutil.PluginError("compile", err);
        gutil.log("[compile]", stats.toString({
            colors: true
        }));
        callback();
    });
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


gulp.task("watch", ["compile"], function() {
		gulp.watch("src/*.ts", ["compile"]);
});


gulp.task("lint", function () {
	return gulp.src(["src/*.ts", "test/*.ts"])
		.pipe(tslint(tslintOpts))
		.pipe(tslint.report("verbose"));
});


gulp.task("test", ["test-node", "test-phantomjs"]);

gulp.task("test-node", function () {
	return gulp.src(["test/*.ts"])
		.pipe(mocha());
});

gulp.task('test-phantomjs', [], function() {
     return gulp.src('./test/test.html')
        .pipe(mochaPhantomJS({ 'webSecurityEnabled': false, "outputEncoding": "utf8", "localToRemoteUrlAccessEnabled": true }));
});

gulp.task("sync", function() {
	return gulp.src(["bower.json", "component.json"])
		.pipe(sync())
		.pipe(gulp.dest(".")); // write it to the same dir
});

gulp.task("default", ["compile", "test", "typedoc", "sync"]);
