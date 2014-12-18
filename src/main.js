'use strict';

var Updraft = {
  VERSION : '0.4.0',
  Store : require('./store')
};

module.exports = Updraft;

if (window) {
  window.Updraft = Updraft;
}
