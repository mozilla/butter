'use strict';

var utils,
    stores,
    CONSTANTS;

utils = {
  generatePublishUrl: function( id ) {
    return CONSTANTS.EMBED_HOSTNAME + '/' + stores.publish.expand( utils.generateIdString( id ) );
  },
  generateIframeUrl: function( id ) {
    return CONSTANTS.EMBED_HOSTNAME + '/' + stores.publish.expand( utils.generateIdString( id ) + CONSTANTS.EMBED_SUFFIX );
  },
  generateIdString: function( id ) {
    return id.toString( 36 );
  },
  constants: function() {
    return CONSTANTS;
  }
};

module.exports = function( consts, store ) {
  CONSTANTS = consts;
  stores = store;
  return utils;
};
