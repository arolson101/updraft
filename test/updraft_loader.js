// this file exists because typescript can't load a module from a specifc path.
// JS, however, can do whatever it wants, so bypass typescript's errors
// by putting it on a global instead.

global.Updraft = require("../dist/updraft");
