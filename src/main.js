'use strict';

var Updraft = {
  Store : require('./store')
};

module.exports = Updraft;

if (window) {
  window.Updraft = Updraft;
}
