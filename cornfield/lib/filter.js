var filters = {
  isLoggedIn: function( req, res, next ) {
    if ( req.session.email ) {
      next();
    } else {
      res.json( { error: 'unauthorized' }, 403 );
    }
  }
}

module.exports = filters;
