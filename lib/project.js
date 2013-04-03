"use strict";

var datauri = require('./datauri');

function defaultDBReadyFunction( err ) {
  if ( err ) {
    err = Array.isArray( err ) ? err[ 0 ] : err;
    console.warn( "lib/project.js: DB setup error\n", err.number ? err.number : err.code, err.message );
  }
}

module.exports = function( config, dbReadyFn ) {
  config = config || {};

  dbReadyFn = dbReadyFn || defaultDBReadyFunction;

  var username = config.username || "",
      password = config.password || "",
      Sequelize = require( "sequelize" ),
      sequelize;

  try {
    sequelize = new Sequelize( config.database, username, password, config.options );
  } catch (e) {
    dbReadyFn(e);
    return {
      isDBOnline: function isDBOnline() {
        return false;
      }
    };
  }

  var dbOnline = false,
      Project = sequelize.import( __dirname + "/models/project" ),
      ImageReference = sequelize.import( __dirname + "/models/image" ),
      butterVersion = require( "../package.json" ).version;

  sequelize.sync().complete(function( err ) {
    if ( !err ) {
      dbOnline = true;
    }

    dbReadyFn( err );
  });

  function forceRange( lower, upper, n ) {
    // Deal with n being undefined
    n = n|0;
    return n < lower ? lower : Math.min( n, upper );
  }

  // TODO: should strip out the null fields I'm not passing to attributes in results
  function getProjectsByDate( whichDate, limit, callback ) {
    Project.findAll({
      limit: forceRange( 1, 100, limit ),
      // createdAt or updatedAt
      order: whichDate + ' DESC'
    }).complete( callback );
  }

  function getProjectsWhere( where, callback ) {
    Project.findAll( { where: where } ).complete( callback );
  }

  return {

    linkImageFilesToProject: function( options, callback ) {
      options = options || {};
      var files = options.files,
          projectId = options.id,
          finishedItems = 0,
          errs = [];

      function itemCallback( err ) {
        if ( err ) {
          errs.push( err );
        }

        if ( ++finishedItems === files.length ) {
          callback( errs.length > 0 ? errs : null );
        }
      }

      Project.find( { where: { id: projectId } } )
        .success( function( project ) {
          if ( project ) {
            files.forEach( function( file ) {
              file.createDBReference( ImageReference, projectId, itemCallback );
            });
          }
          else {
            callback( "Project not found" );
          }
        })
        .error( callback );
    },

    createImageReferencesForProject: function( options, callback ) {
      options = options || {};
      var imageFiles = options.files,
          projectId = options.id,
          savedImages = 0,
          errs =[];

      imageFiles.forEach( function( imageFile ) {
        ImageReference.build({
          filename: imageFile.filename,
          url: imageFile.url,
          project: projectId
        }).save().complete( function( err ) {
          if ( err ) {
            errs.push( err );
          }

          if ( ++savedImages === imageFiles.length ) {
            callback( errs.length > 0 ? errs : null );
          }
        });
      });
    },

    getSequelizeInstance: function(){
      return sequelize;
    },

    create: function( options, callback ) {
      options = options || {};
      var email = options.email,
          data = options.data;

      if ( !email || !data ) {
        callback( "Expected email and data on options object" );
        return;
      }

      var project = Project.build({
        data: JSON.stringify( data.data ),
        email: email,
        name: data.name,
        author: data.author || "",
        description: data.description,
        template: data.template,
        originalButterVersion: butterVersion,
        latestButterVersion: butterVersion,
        remixedFrom: data.remixedFrom
      });

      project.save().complete( callback );
    },

    delete: function( options, callback ) {
      options = options || {};
      var email = options.email,
          pid = options.id;

      if ( !email || !pid ) {
        callback( "not enough parameters to delete" );
        return;
      }

      Project.find( { where: { email: email, id: pid } } )
      .success(function( project ) {

        if ( project ) {
          ImageReference.findAll( { where: { project: pid } } ).complete( function( err, imageReferences ) {

            imageReferences.forEach( function( imageReference ) {
              imageReference.destroy();
            });

            project.destroy().complete( function( err ) {
              callback( err, imageReferences );
            });

          });

        } else {
          callback( "the project has already been deleted" );
        }
      })
      .error(function( error ) {
        callback( error );
      });
    },

    findAll: function( options, callback ) {
      options = options || {};
      var email = options.email;

      if ( !email ) {
        callback( "Missing email parameter" );
        return;
      }

      getProjectsWhere( { email: email }, callback );
    },

    find: function( options, callback ) {
      options = options || {};
      if ( !options.id ) {
        callback( "Missing Project ID" );
        return;
      }

      // We always have a project id, but only sometimes an email.
      var where = options.email ? { id: options.id, email: options.email } :
                                  { id: options.id };

      getProjectsWhere( where, function( err, results ) {
        callback( err, results[0] );
      });
    },

    findRecentlyCreated: function( options, callback ) {
      options = options || {};
      getProjectsByDate( 'createdAt', options.limit, callback );
    },

    findRecentlyUpdated: function( options, callback ) {
      options = options || {};
      getProjectsByDate( 'updatedAt', options.limit, callback );
    },

    findRecentlyRemixed: function( options, callback ) {
      options = options || {};
      Project.findAll({
        where: 'NOT remixedFrom IS NULL',
        limit: forceRange( 1, 100, options.limit ),
        order: 'createdAt DESC'
      }).complete( callback );
    },

    findRemixes: function( options, callback ) {
      options = options || {};
      getProjectsWhere( { remixedFrom: options.id }, callback );
    },

    isDBOnline: function isDBOnline() {
      return dbOnline;
    },

    update: function updateProject( options, callback ) {
      options = options || {};
      var email = options.email,
          pid = options.id,
          data = options.data;

      if ( !email || !pid || !data ) {
        callback( "Expected email, id, and data parameters to update" );
        return;
      }

      Project.find( { where: { email: email, id: pid } } )
      .success(function( project ) {
        if ( !project ) {
          callback( "project not found" );
          return;
        }

        var projectDataJSON = data.data;
        var projectDataString = JSON.stringify( projectDataJSON );

        project.updateAttributes({
          data: projectDataString,
          email: email,
          name: data.name,
          author: data.author || "",
          description: data.description,
          template: data.template,
          latestButterVersion: butterVersion,
          remixedFrom: data.remixedFrom
        })
        .error( function( err ) {
          callback( err );
        })
        .success( function( projectUpdateResult ) {

          ImageReference.findAll( { where: { project: pid } } ).complete( function( imageReferenceErr, imageReferences ) {

            var imagesToDestroy = datauri.compareImageReferencesInProject( imageReferences, projectDataJSON );

            imagesToDestroy.forEach( function( imageReference ) {
              imageReference.destroy();
            });

            callback( null, projectUpdateResult, imagesToDestroy );
          });
        });
      })
      .error(function( error ) {
        callback( error );
      });
    }
  };
};
