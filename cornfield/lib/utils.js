'use strict';

var uuid = require( "node-uuid" );

var utils,
    stores,
    CONSTANTS;

utils = {
  generateDataURIPair: function() {
    var filename = uuid.v4();
    return {
      filename: filename,
      url: ( stores.images.hostname || CONSTANTS.EMBED_HOSTNAME ) +
        '/' + stores.images.expand( filename )
    };
  },
  generatePublishUrl: function( id ) {
    return ( stores.publish.hostname || CONSTANTS.EMBED_HOSTNAME ) +
      '/' + stores.publish.expand( utils.generateIdString( id ) );
  },
  generateIframeUrl: function( id ) {
    return ( stores.publish.hostname || CONSTANTS.EMBED_HOSTNAME ) +
      '/' + stores.publish.expand( utils.generateIdString( id ) +
      CONSTANTS.EMBED_SUFFIX );
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
