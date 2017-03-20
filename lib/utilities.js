var http = require( "http" );

module.exports.error = function( code, msg ) {
  var err = new Error( msg || http.STATUS_CODES[ code ]);
  err.status = code;
  return err;
};
