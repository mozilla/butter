"use strict";

var datauri = require('./datauri'),
    utils, user;

function defaultDBReadyFunction( err ) {
  if ( err ) {
    err = Array.isArray( err ) ? err[ 0 ] : err;
    console.warn( "lib/project.js: DB setup error\n", err.number ? err.number : err.code, err.message );
  }
}

module.exports = function( config, dbReadyFn, utilities ) {
  config = config || {};
  utils = utilities || {};

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

  user = {

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
          data = options.data,
          uri, regexMatch, imageFile, pid,
          urlPair = utils.generateDataURIPair();

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
        remixedFrom: data.remixedFrom,
        thumbnail: data.thumbnail
      });

      function buildProject() {
        project.updateAttributes({
          thumbnail: uri
        })
        .error(function( err ) {
          callback( err );
        })
        .save(function( updatedProject ) {
          callback( null, updatedProject );
        });
      }

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
          data = options.data,
          regexMatch, imageFile, uri,
          urlPair = utils.generateDataURIPair();

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
