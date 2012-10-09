"use strict";

module.exports = function( config, dbReadyFn ) {
  config = config || {};

  var dbOnline = false,
      Sequelize = require( "sequelize" ),
      sequelize = new Sequelize( config.database, config.username, config.password, config.options ),
      Project = sequelize.import(__dirname + "/models/project");

  sequelize.sync()
    .on( "success", function() {
      dbOnline = true;

      if ( dbReadyFn ) {
        dbReadyFn();
      }
    })
    .on( "failure", function( err ) {
      if ( dbReadyFn ) {
        dbReadyFn( err );
      }
    });

  return {
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
        template: data.template
      });

      project.save()
      .success(function() {
        callback( null, project );
      })
      .error(function( err ) {
        callback( err );
      });
    },
    deleteProject: function( email, pid, callback ) {
      if ( !email || !pid ) {
        callback( "not enough parameters to delete" );
        return;
      }

      Project.find( { where: { email: email, id: pid } } )
      .success(function( project ) {
        project.destroy().success( function( success ) {
          callback();
        });
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

      Project.findAll( { where: { email: email } } )
      .success(function( projects ) {
        callback( null, projects );
      })
      .error(function( err ) {
        callback( err );
      });

    },
    findProject: function findProject( email, pid, callback ) {
      if ( !email || !pid ) {
        callback( "not enough parameters to search" );
        return;
      }

      Project.find( { where: { email: email, id: pid } } )
      .success(function( project ) {
        callback( null, project );
      })
      .error(function( error ) {
        callback( error );
      });

    },
    findById: function findById( pid, callback ) {
      if ( !pid ) {
        callback( "not enough parameters for search" );
        return;
      }

      Project.find({ where: { id: pid } } )
      .success(function( project ) {
        callback( null, project );
      })
      .error(function( error ) {
        callback( error );
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
          template: data.template
        })
        .success(function() {
          callback( null, project );
        });
      })
      .error(function( error ) {
        callback( error );
      });
    }
  };
}
