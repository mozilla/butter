'use strict';

module.exports = function routesCtor( app, User, filter, sanitizer ) {
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
      res.json( projectJSON );
    });
  });

  app.get( '/api/projects', filter.isLoggedIn, filter.isStorageAvailable, function( req, res ) {
    User.findAllProjects( req.session.email, function( err, doc ) {
      if ( err ) {
        res.json( { error: err, projects: [] }, 500 );
        return;
      }

      if ( !doc ) {
        res.json( { error: "no projects found" }, 404 );
        return;
      }

      var projectData = [];
      doc.forEach( function( value ) {
        projectData.push( { name: value.name, id: value._id } );
      });

      res.json({ error: 'okay', projects: projectData });
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
};
