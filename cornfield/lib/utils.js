'use strict';

var utils,
    config = require('config');

utils = {
  generatePublishUrl: function( id ) {
    return config.dirs.hostname + "/v/" + id + ".html";
  }
};

module.exports = utils;
