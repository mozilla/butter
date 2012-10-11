'use strict';

module.exports = function routesCtor( app, User, filter, sanitizer, stores, EMBED_SUFFIX ) {
  app.get( '/api/whoami', filter.isLoggedIn, filter.isXHR, function( req, res ) {
    var email = req.session.email;

    res.json({
      status: "okay",
      email: email,
      name: email,
      username: email
    });
  });

  app.get( '/api/project/:id?',
    filter.isLoggedIn, filter.isStorageAvailable, filter.isXHR,
    function( req, res ) {

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
      projectJSON.projectID = doc.id;
      projectJSON.author = doc.author;
      projectJSON.template = doc.template;
      res.json( projectJSON );
    });
  });

  app.post( '/api/delete/:id?',
    filter.isLoggedIn, filter.isStorageAvailable, filter.isXHR,
    function( req, res ) {

    var id = parseInt( req.params.id, 10 );

    if ( isNaN( id ) ) {
      res.json( { error: "ID was not a number" }, 500 );
      return;
    }

    User.deleteProject( req.session.email, req.params.id, function( err ) {
      if ( err ) {
        res.json( { error: 'project not found' }, 404 );
        return;
      }

      // Delete published projects, too
      var embedShell = id.toString( 36 ),
          embedDoc = embedShell + EMBED_SUFFIX;

      stores.publish.remove( embedShell, function( e ) {
        if( e ) {
          res.json( { error: 'unable to remove file: ' + embedShell }, 500 );
          return;
        }
        stores.publish.remove( embedDoc, function( e ) {
          if( e ) {
            res.json( { error: 'unable to remove file: ' + embedDoc }, 500 );
            return;
          }
          res.json( { error: 'okay' }, 200 );
        });
      });
    });
  });

  app.post( '/api/project/:id?',
    filter.isLoggedIn, filter.isStorageAvailable, filter.isXHR,
    function( req, res ) {

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

        // Send back the newly added row's ID
        res.json( { error: 'okay', projectId: doc.id } );
      });
    }
  });

  // We have a separate remix API for unsecured and sanitized access to projects
  app.get( '/api/remix/:id',
    filter.isStorageAvailable, filter.isXHR,
    function( req, res ) {

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
      projectJSON.template = sanitizer.escapeHTML( project.template );

      res.json( projectJSON );
    });
  });

  function storeData( req, res, store ) {
    var s = '';

    req.addListener( 'data', function( data ) {
      s += data;
    });

    req.addListener( 'end', function() {
      var id = Date.now();
      store.write( id, s, function() {
        res.writeHead( 200, { 'content-type': 'text/plain' } );
        res.end();
      });
    });
  }

  // Store crash reports
  app.post( '/crash', function( req, res ) {
    storeData( req, res, stores.crash );
  });

  // Store feedback reports
  app.post( '/feedback', function( req, res ) {
    storeData( req, res, stores.feedback );
  });

};
