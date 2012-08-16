// Options must be shared with anyone require()-ing this file
var options, filters;

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
    if ( options.dbOnline ) {
      next();
    } else {
      res.json({
        error: 'storage service is not running'
      }, 500 );
    }
  }
};

module.exports = function ctor( opts ) {
  options = opts;
  return filters;
};
