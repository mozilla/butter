"use strict";

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

      project.save().complete(function( err, result ) {
        callback( err, result );
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
          project.destroy().complete( function( err ) {
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
        project.updateAttributes({
          data: JSON.stringify( data.data ),
          email: email,
          name: data.name,
          author: data.author || "",
          template: data.template,
          latestButterVersion: versions.butter
        })
        .complete( function(err, result) {
          callback( err, result );
        });
      })
      .error(function( error ) {
        callback( error );
      });
    }
  };
};
