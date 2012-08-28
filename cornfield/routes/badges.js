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
        name: "Technician Badge",
        description: "You're a master technician",
        image_url: "https://dl.dropbox.com/u/4403845/Screenshots/technician-alive.png"
      }],
      since: Date.now()
    });
  });
};
