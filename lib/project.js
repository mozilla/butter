"use strict";

function defaultDBReadyFunction( err ) {
  if ( err ) {
    err = Array.isArray( err ) ? err[ 0 ] : err;
    console.warn( "lib/project.js: DB setup error\n", err.number ? err.number : err.code, err.message );
  }
}

module.exports = function( config, makeapi, utils, dbReadyFn ) {
  config = config || {};

  dbReadyFn = dbReadyFn || defaultDBReadyFunction;

  var username = config.username || "",
      password = config.password || "",
      Sequelize = require( "sequelize" ),
      sequelize,
      makeClient = require( "makeapi" )( makeapi );

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
        remixedFrom: data.remixedFrom,
        thumbnail: data.thumbnail
      });

      project.save().complete(function( err, doc ) {
        if ( !err ) {
          makeClient.create({
            title: doc.name,
            author: doc.author,
            email: email,
            contentType: "application/x-popcorn-maker",
            url: utils.generatePublishUrl( doc.id ),
            thumbnail: doc.thumbnail,
            description: doc.description,
            remixedFrom: data.remixedFrom,
            tags: [
              "makeType:popcorn",
              "demo:popcorn"
            ]
          }, function( error, make ) {
            if ( !error ) {
              callback( err, doc );
              return;
            }

            callback( error, doc );
            return;
          });
        }

        callback( err, doc );
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

          project.destroy()
          .success(function() {
            callback( null, project );
          })
          .error(function( err ) {
            callback( err );
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
          remixedFrom: data.remixedFrom,
          thumbnail: data.thumbnail
        })
        .error( function( err ) {
          callback( err );
        })
        .success( function( projectUpdateResult ) {
          makeClient.url( projectUpdateResult.url ).then(function( err, result ) {
            if ( !err ) {
              makeClient.update( result._id, {
                title: projectUpdateResult.name,
                author: projectUpdateResult.author,
                thumbnail: doc.thumbnail,
                description: doc.description
              }, function( error, make ) {
                if ( !error ) {
                  callback( null, projectUpdateResult );
                  return;
                }

                callback( error, projectUpdateResult );
                return;
              });
            }

            callback( err, projectUpdateResult );
          });
        });
      })
      .error(function( error ) {
        callback( error );
      });
    }
  };
};
