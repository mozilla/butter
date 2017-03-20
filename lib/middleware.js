var utils = require( "./utilities" );

module.exports.isAuthenticated = function( req, res, next ) {
  if ( req.session.email ) {
    return next();
  }

  next( utils.error( 403 ));
};
