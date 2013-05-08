'use strict';

var uuid = require( "node-uuid" );

var utils,
    stores,
    CONSTANTS;

utils = {
  // Converter for paths, which may either use \ or / as
  // delimiter, to URLs, which must use / as delimiter.
  pathToURL: function ( s ) {
    return s.replace( /\\/g, '/' );
  },
  generateFileName: function() {
    var filename = uuid.v4();
    return {
      filename: filename,
      url: utils.pathToURL( (stores.images.hostname || CONSTANTS.EMBED_HOSTNAME ) +
           '/' + stores.images.expand( filename ) )
    };
  },
  generatePublishUrl: function( id ) {
    return utils.pathToURL( ( stores.publish.hostname || CONSTANTS.EMBED_HOSTNAME ) +
      '/' + stores.publish.expand( utils.generateIdString( id ) ) );
  },
  generateIframeUrl: function( id ) {
    return utils.pathToURL( ( stores.publish.hostname || CONSTANTS.EMBED_HOSTNAME ) +
      '/' + stores.publish.expand( utils.generateIdString( id ) +
      CONSTANTS.EMBED_SUFFIX ) );
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
