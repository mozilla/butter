"use strict";

var datauri = require('./datauri'),
    utils,
    user;

function defaultDBReadyFunction( err ) {
  if ( err ) {
    err = Array.isArray( err ) ? err[ 0 ] : err;
    console.warn( "lib/user.js: DB setup error\n", err.number ? err.number : err.code, err.message );
  }
}

module.exports = function( config, dbReadyFn, utilities ) {
  config = config || {};
  utils = utilities;

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

  user = {
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
      var uri, regexMatch, imageFile, pid,
          urlPair = utils.generateDataURIPair();

      if ( !email || !data ) {
        callback( "not enough parameters to update" );
        return;
      }

      function buildProject() {
        project.updateAttributes({
          thumbnail: uri
        })
        .error( function( err ) {
          callback( err );
        })
        .success( function( projectUpdateResult ) {
          callback( null, projectUpdateResult );
        });
      }

      var project = Project.build({
        data: JSON.stringify( data.data ),
        email: email,
        name: data.name,
        author: data.author || "",
        template: data.template,
        description: data.description || "",
        originalButterVersion: butterVersion,
        latestButterVersion: butterVersion,
        remixedFrom: data.remixedFrom,
        thumbnail: data.thumbnail
      });

      project.save().complete(function( err, project ) {
        if ( !err ) {
          pid = project.id;
          regexMatch = data.thumbnail.match( datauri.uriRegex );
          if ( regexMatch ) {
            imageFile = new datauri.ImageFile( data.thumbnail.substr( regexMatch[ 0 ].length ),
              urlPair.filename,
              urlPair.url
            );

            user.linkImageFilesToProject( [ imageFile ], pid, function( err ) {
              if ( err ) {
                uri = utils.constants().APP_HOSTNAME + "/resources/icons/fb-logo.png";
                buildProject();
              } else {
                uri = imageFile.url;
                datauri.saveImageFilesToStore( utils.stores().images, [ imageFile ], buildProject );
              }

            });
          } else {
            callback( err, project );
          }
        } else {
          callback( err, project );
        }
      });

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
      var regexMatch, imageFile, uri,
          urlPair = utils.generateDataURIPair();

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

        function updateProject() {
          var projectDataJSON = data.data,
              projectDataString = JSON.stringify( projectDataJSON );

          project.updateAttributes({
            data: projectDataString,
            email: email,
            name: data.name,
            author: data.author || "",
            description: data.description || "",
            template: data.template,
            latestButterVersion: butterVersion,
            remixedFrom: data.remixedFrom,
            thumbnail: uri
          })
          .error( function( err ) {
            callback( err );
          })
          .success( function( projectUpdateResult ) {

            ImageReference.findAll( { where: { project: pid } } ).complete( function( imageReferenceErr, imageReferences ) {

              var imagesToDestroy = datauri.compareImageReferencesInProject( imageReferences, projectDataJSON );

              imagesToDestroy.forEach( function( imageReference ) {
                if ( imageReference.url !== uri ) {
                  imageReference.destroy();
                  utils.stores().images.remove( imageReference.filename );
                }
              });

              callback( null, projectUpdateResult );
            });
          });
        }

        regexMatch = data.thumbnail.match( datauri.uriRegex );

        function checkThumbnail() {
          if ( regexMatch ) {
            imageFile = new datauri.ImageFile( data.thumbnail.substr( regexMatch[ 0 ].length ),
              urlPair.filename,
              urlPair.url
            );

            user.linkImageFilesToProject( [ imageFile ], pid, function( err ) {
              if ( err ) {
                uri = utils.constants().APP_HOSTNAME + "/resources/icons/fb-logo.png";
                updateProject();
              } else {
                uri = imageFile.url;
                datauri.saveImageFilesToStore( utils.stores().images, [ imageFile ], updateProject );
              }

            });
          } else {
            uri = data.thumbnail;
            updateProject();
          }
        }

        ImageReference.findAll( { where: { project: pid } } ).complete( function( imageReferenceErr, imageReferences ) {
          if ( imageReferences.length ) {
            imageReferences.forEach( function( imageReference ) {
              if ( imageReference.url === uri ) {
                imageReference.destroy();
                utils.stores().images.remove( imageReference.filename );
              }
            });
            checkThumbnail();
          } else {
            checkThumbnail();
          }
        });

      })
      .error(function( error ) {
        callback( error );
      });
    }
  };
  return user;
};
