'use strict';

var datauri = require('../lib/datauri');

module.exports = function routesCtor( app, User, filter, sanitizer, stores, utils ) {

  var uuid = require( "node-uuid" ),
      // Keep track of whether this is production or development
      deploymentType = app.settings.env === "production" ? "production" : "development";

  app.get( '/api/whoami', function( req, res ) {
    var email = req.session.email;

    if (email) {
      res.json({
        status: "okay",
        csrf: req.session._csrf,
        email: email,
        name: email,
        username: email
      });
    } else {
      res.json({
        error: 'unauthorized',
        csrf: req.session._csrf,
      });
    }
  });

  app.get( '/api/project/:id?',
    filter.isLoggedIn, filter.isStorageAvailable,
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
      projectJSON.publishUrl = utils.generatePublishUrl( doc.id );
      projectJSON.iframeUrl = utils.generateIframeUrl( doc.id );
      res.json( projectJSON );
    });
  });

  app.post( '/api/delete/:id?',
    filter.isLoggedIn, filter.isStorageAvailable,
    function( req, res ) {

    var id = parseInt( req.params.id, 10 );

    if ( isNaN( id ) ) {
      res.json( { error: "ID was not a number" }, 500 );
      return;
    }

    User.deleteProject( req.session.email, req.params.id, function( err, imagesToDestroy ) {
      if ( err ) {
        res.json( { error: 'project not found' }, 404 );
        return;
      }

      // Delete published projects, too
      var embedShell = utils.generateIdString( id ),
          embedDoc = embedShell + utils.constants().EMBED_SUFFIX;

      // If we can't delete the file, it's already gone, ignore errors.
      // Fire-and-forget.
      stores.publish.remove( embedShell );
      stores.publish.remove( embedDoc );

      if ( imagesToDestroy ) {
        imagesToDestroy.forEach( function( imageReference ) {
          stores.images.remove( imageReference.filename );
        });
      }

      res.json( { error: 'okay' }, 200 );
    });
  });

  function linkAndSaveImageFiles( files, projectId, callback ) {
    User.linkImageFilesToProject( files, projectId, function( err ) {
      if ( err ) {
        callback( err );
        return;
      }

      datauri.saveImageFilesToStore( stores.images, files, callback );
    });
  }

  app.post( '/api/project/:id?',
    filter.isLoggedIn, filter.isStorageAvailable,
    function( req, res ) {

    var files;

    var projectData = req.body;

    if ( req.body.id ) {
      files = datauri.filterProjectDataURIs( projectData.data, utils.generateDataURIPair );

      User.updateProject( req.session.email, req.body.id, projectData, function( err, doc, imagesToDestroy ) {
        if ( err ) {
          res.json( { error: err }, 500 );
          return;
        }

        if ( imagesToDestroy ) {
          imagesToDestroy.forEach( function( imageReference ) {
            stores.images.remove( imageReference.filename );
          });
        }

        if ( files && files.length > 0 ) {
          linkAndSaveImageFiles( files, doc.id, function( err ) {
            if ( err ) {
              res.json( { error: 'Unable to store data-uris.', }, 500 );
              return;
            }
            res.json( { error: 'okay', project: doc, imageURLs: files.map( function( file ) { return file.getJSONMetaData(); } ) }, 200 );
          });
        }
        else {
          res.json( { error: 'okay', project: doc } );
        }

      });
    } else {
      files = datauri.filterProjectDataURIs( projectData.data, utils.generateDataURIPair );

      User.createProject( req.session.email, projectData, function( err, doc ) {
        if ( err ) {
          res.json( { error: err }, 500 );
          return;
        }

        if ( files && files.length > 0 ) {
          linkAndSaveImageFiles( files, doc.id, function( err ) {
            if ( err ) {
              res.json( { error: 'Unable to store data-uris.', }, 500 );
              return;
            }
            res.json( { error: 'okay', projectId: doc.id, imageURLs: files.map( function( file ) { return file.getJSONMetaData(); } ) }, 200 );
          });
        }
        else {
          // Send back the newly added row's ID
          res.json( { error: 'okay', projectId: doc.id }, 200 );
        }

      });
    }
  });

  // We have a separate remix API for unsecured and sanitized access to projects
  app.get( '/api/remix/:id',
    filter.isStorageAvailable,
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

  function formatDate( d ) {
    // YYYY-MM-DD
    d = d || new Date();

    function pad( n ) {
      return n < 10 ? '0' + n : n;
    }
    return ( d.getUTCFullYear() + '-' +
             pad( d.getUTCMonth() + 1 ) + '-' +
             pad( d.getUTCDate() ) );
  }

  function generateUniqueName( keys ) {
    // Generate a unique name, with formatting to support analysis later on.
    // The format is:
    // <key1>=<value1>/<key2>=<value2>/<key..>=<value..>/<unique blob name>
    // For example:
    // dt=2012-05-31T20:00/deployment=production/64432AE8-7132-4C01-BD5E-AE49BC343CC8

    // Serialize keys array
    var keysString = '';
    keys.forEach( function( key ) {
      keysString += key.name + '=' + key.value + '/';
    });
    keysString = keysString.replace( /\/$/, '' );

    return keysString + '/' + uuid.v4();
  }

  function storeData( req, res, store ) {
    var s = '';

    req.addListener( 'data', function( data ) {
      s += data;
    });

    req.addListener( 'end', function() {
      var name = generateUniqueName([
        { name: 'dt', value: formatDate() },
        { name: 'deployment', value: deploymentType }
      ]);
      store.write( name, s, function() {
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
