'use strict';

var dbCheckFn, filters;

filters = {
  isLoggedIn: function( req, res, next ) {
    if ( req.session.email ) {
      next();
    } else {
      res.json({
        error: 'unauthorized',
        csrf: req.session._csrf
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
  isXHR: function( req, res, next ) {
    if ( req.header( 'X-Requested-With' ) === 'XMLHttpRequest' ) {
      next();
    } else {
      res.json({
        error: 'X-Requested-With is not set to XMLHttpRequest'
      }, 412 );
    }
  }
};

module.exports = function ctor( fn ) {
  dbCheckFn = fn;
  return filters;
};
