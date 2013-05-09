'use strict';

var dbCheckFn, filters;

filters = {
  isLoggedIn: function( req, res, next ) {
    if ( req.session.email ) {
      next();
    } else {
      res.json({
        error: 'unauthorized'
      }, 403 );
    }
  },
  isStorageAvailable: function( req, res, next ) {
    if ( dbCheckFn() ) {
      next();
    } else {
      res.json({
        error: 'storage service is not running'
      }, 500 );
    }
  },
  crossOriginAccessible: function( req, res, next ) {
    res.set( 'Access-Control-Allow-Origin', '*' );
    next();
  },
  isImage: function( req, res, next ) {
    var validMimeTypes = [
          "image/jpeg",
          "image/png",
          "image/gif"
        ],
        image = req.files.image;

    if ( validMimeTypes.indexOf( image.type ) >= 0 ) {
      return next();
    }

    next( new Error( "Upload Failed - Invalid MimeType." ) );
  }
};

module.exports = function ctor( fn ) {
  dbCheckFn = fn;
  return filters;
};
