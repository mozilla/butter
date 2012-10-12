'use strict';

var utils,
    stores,
    CONSTANTS = {};

utils = {
  generatePublishURL: function( id ) {
    return CONSTANTS.EMBED_HOSTNAME + '/' + stores.publish.expand( id );
  },
  generateEmbedURL: function( id ) {
    return CONSTANTS.EMBED_HOSTNAME + '/' + stores.publish.expand( id + CONSTANTS.EMBED_SUFFIX );
  },
  generateId: function( id ) {
    return id.toString( 36 );
  }
};

module.exports = function( consts, store ) {
  CONSTANTS = consts;
  stores = store;
  return utils;
};
