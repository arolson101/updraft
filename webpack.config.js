"use strict";

var webpack = require("webpack");
var fs = require("fs");
//var path = require("path");

var production = 0;

module.exports = {
  context: __dirname + "/src",

  entry: "./index.ts",

  output: {
    path: __dirname + "/dist",
    filename: "updraft.js",
    library: "updraft"
  },

  resolve: {
    extensions: ['', '.js', '.ts'],
  },

  module: {
    loaders: [
      { test: /\.tsx?$/, loader: 'ts-loader' },
    ]
  },

  plugins: [
    // production defines
    new webpack.DefinePlugin({
      DEBUG: production ? 0 : 1,
      PRODUCTION: production ? 1 : 0,
    }),
  ],

  resolveLoader: { root: __dirname + "/node_modules" },

  devtool: "source-map"
};


if(production) {
  module.exports.plugins.push(new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false
    },
    test: /\.jsx?($|\?)/i
  }));
}
