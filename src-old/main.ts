/// <reference path="./store.ts" />
/// <reference path="./query.ts" />

module Updraft {
}

declare var module: any;
if(typeof module !== "undefined") {
	module.exports = Updraft;
}