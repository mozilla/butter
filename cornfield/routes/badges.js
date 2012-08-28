'use strict';

module.exports = function routesCtor( app, User, filter, sanitizer ) {
  app.get( '/api/badges/since/:timestamp', filter.isLoggedIn, function( req, res ) {
    res.json({
      badges: [],
      since: Date.now()
    });
  });

  app.get( '/api/badges', filter.isLoggedIn, function( req, res ) {
    res.json({
      badges: [{
        name: "First Login",
        description: "Like a champion, you logged in, vanquishing all privacy policies and terms of service in your path.",
        image_url: "https://wiki.mozilla.org/images/b/bb/Merit-badge.png"
      }],
      since: Date.now()
    });
  });
};
