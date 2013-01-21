"use strict";

var datauri = require('./datauri');

function defaultDBReadyFunction( err ) {
  if ( err ) {
    err = Array.isArray( err ) ? err[ 0 ] : err;
    console.warn( "lib/user.js: DB setup error\n", err.number ? err.number : '[No Error Number]', err.message );
  }
}

module.exports = function( config, dbReadyFn ) {
  config = config || {};

  dbReadyFn = dbReadyFn || defaultDBReadyFunction;

  var username = config.username || "";
  var password = config.password || "";

  var dbOnline = false,
      Sequelize = require( "sequelize" ),
      sequelize = new Sequelize( config.database, username, password, config.options ),
      Project = sequelize.import( __dirname + "/models/project" ),
      ImageReference = sequelize.import( __dirname + "/models/image" ),
      versions;

  // travis-ci doesn't create this file when running `npm test` so we need a workaround
  try {
    versions = require( "../config/versions.json" );
  } catch (ex) {
    versions = {
      butter: "travis-ci"
    };
  }
  sequelize.sync().complete(function( err ) {
    if ( !err ) {
      dbOnline = true;
    }

    dbReadyFn( err );
  });

  return {
    linkImageFilesToProject: function( files, projectId, callback ) {
      var finishedItems = 0;
      var errs = [];

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

    createImageReferencesForProject: function( imageFiles, projectId, callback ) {
      var savedImages = 0;
      var errs = [];

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

    createProject: function( email, data, callback ) {
      if ( !email || !data ) {
        callback( "not enough parameters to update" );
        return;
      }

      var project = Project.build({
        data: JSON.stringify( data.data ),
        email: email,
        name: data.name,
        author: data.author || "",
        template: data.template,
        originalButterVersion: versions.butter,
        latestButterVersion: versions.butter
      });

      project.save().complete( callback );
    },

    deleteProject: function( email, pid, callback ) {
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

    findAllProjects: function findAllProjects( email, callback ) {
      if ( !email ) {
        callback( "not enough parameters to search" );
        return;
      }

      Project.findAll( { where: { email: email } } ).complete( function( err, projects ) {
        callback( err, projects );
      });
    },

    findProject: function findProject( email, pid, callback ) {
      if ( !email || !pid ) {
        callback( "not enough parameters to search" );
        return;
      }

      Project.find( { where: { email: email, id: pid } } ).complete( function( err, project ) {
        callback( err, project );
      });
    },
    findById: function findById( pid, callback ) {
      if ( !pid ) {
        callback( "not enough parameters for search" );
        return;
      }

      Project.find({ where: { id: pid } } ).complete( function( err, project ) {
        callback( err, project );
      });

    },
    isDBOnline: function isDBOnline() {
      return dbOnline;
    },

    updateProject: function updateProject( email, pid, data, callback ) {
      if ( !email || !pid || !data ) {
        callback( "not enough parameters to update" );
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
          template: data.template,
          latestButterVersion: versions.butter
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
