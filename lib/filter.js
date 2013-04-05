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
  }
};

module.exports = function ctor( fn ) {
  dbCheckFn = fn;
  return filters;
};
