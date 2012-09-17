'use strict';

module.exports = function routesCtor( app, User, TestResult, filter, sanitizer ) {
  app.get( '/api/whoami', filter.isLoggedIn, function( req, res ) {
    var email = req.session.email;

    res.json({
      email: email,
      name: email,
      username: email
    });
  });

  app.get( '/api/project/:id?', filter.isLoggedIn, filter.isStorageAvailable, function( req, res ) {
    User.findProject( req.session.email, req.params.id, function( err, doc ) {
      if ( err ) {
        res.json( { error: err }, 500 );
        return;
      }

      if ( !doc ) {
        res.json( { error: "project not found" }, 404 );
        return;
      }

      var projectJSON = JSON.parse( doc.data );
      projectJSON.name = doc.name;
      projectJSON.projectID = doc._id;
      projectJSON.author = doc.author;
      res.json( projectJSON );
    });
  });

  app.get( '/api/delete/:id?', filter.isLoggedIn, filter.isStorageAvailable, function( req, res ) {
    User.deleteProject( req.session.email, req.params.id, function( err ) {
      if ( err ) {
        res.json( { error: 'project not found' }, 404 );
        return;
      }

      res.json( { error: 'okay' }, 200 );
    });
  });

  app.post( '/api/project/:id?', filter.isLoggedIn, filter.isStorageAvailable, function( req, res ) {
    if ( !req.body ) {
      res.json( {error: 'no project data received' }, 500 );
      return;
    }

    if ( req.body.id ) {
      User.updateProject( req.session.email, req.body.id, req.body, function( err, doc ) {
        if ( err ) {
          res.json( { error: err }, 500 );
          return;
        }

        res.json( { error: 'okay', project: doc } );
      });
    } else {
      User.createProject( req.session.email, req.body, function( err, doc ) {
        if ( err ) {
          res.json( { error: err }, 500 );
          return;
        }

        res.json( { error: 'okay', project: doc } );
      });
    }
  });

  // We have a separate remix API for unsecured and sanitized access to projects
  app.get( '/api/remix/:id', filter.isStorageAvailable, function( req, res ) {
    User.findById( req.params.id, function( err, project ) {
      if ( err ) {
        res.json( { error: err }, 500 );
        return;
      }

      if ( !project ) {
        res.json( { error: 'project not found' }, 404 );
        return;
      }

      var projectJSON = JSON.parse( project.data, sanitizer.escapeHTMLinJSON );
      projectJSON.name = "Remix of " + sanitizer.escapeHTML( project.name );

      res.json( projectJSON );
    });
  });

  app.get( "/api/tests", filter.isStorageAvailable, function( req, res ) {
    TestResult.getResults( function( err, doc ) {
      if ( err ) {
        res.json( { error: "internal db error" }, 500 );
        return;
      }

      if ( !doc ) {
        res.json( { error: "No data stored" }, 500 );
        return;
      }

      res.json( { error: "okay", testResults: doc } );

    });
  });

  app.post( "/api/tests/", filter.isStorageAvailable, function( req, res ) {
    TestResult.saveResults( req.body, function( err ) {
      if ( err ) {
        res.json( { error: err }, 500 );
        return;
      }

      res.json( { error: "okay" }, 200 );
    });
  });
};
