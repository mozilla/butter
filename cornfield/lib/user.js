'use strict';

var
dbOnline = false,
mongoose = require('mongoose'),
Schema = mongoose.Schema,

Project = new Schema({
  name: String,
  data: String,
  template: String,
  customData: String
}),
ProjectModel = mongoose.model( 'Project', Project ),

User = new Schema({
  email: String,
  projects: [Project],
}),
UserModel = mongoose.model( 'User', User );

mongoose.connect( 'mongodb://localhost/test', function( err ) {
  if ( !err ) {
    dbOnline = true;
  }
});

module.exports = {
  createProject: function( email, data, callback ) {
    if ( !email || !data ) {
      callback( 'not enough parameters to update' );
      return;
    }

    this.findAllProjects( email, function( err, doc ) {
      if ( err ) {
        callback( err );
        return;
      }

      if ( !doc ) {
        doc = new UserModel({
          email: email
        });
      }

      var project = new ProjectModel({
        customData: JSON.stringify( data.customData ),
        data: JSON.stringify( data.data ),
        name: data.name,
        template: data.template
      });

      doc.projects.push( project );

      doc.save( function( err ) {
        callback( err, project );
      });
    });
  },
  deleteProject: function( email, pid, callback ) {
    if ( !email || !pid ) {
      callback( 'not enough parameters to delete' );
      return;
    }

    this.findAllProjects( email, function( err, doc ) {
      if ( err ) {
        callback( err );
        return;
      }

      doc.projects.id( pid ).remove();
      doc.save( function( err ) {
        callback( err );
      });
    });
  },
  findAllProjects: function findAllProjects( email, callback ) {
    if ( !email ) {
      callback( 'not enough parameters to search' );
      return;
    }

    UserModel.findOne( { email: email }, callback );
  },
  findProject: function findProject( email, pid, callback ) {
    if ( !email || !pid ) {
      callback( 'not enough parameters to search' );
      return;
    }

    this.findAllProjects( email, function( err, doc ) {
      if ( err ) {
        callback( err );
        return;
      }

      callback( err, doc.projects.id( pid ) );
    });
  },
  findUser: function findUser( pid, callback ) {
    if ( !pid ) {
      callback( 'not enough parameters to search' );
      return;
    }
    UserModel.find({
      "projects._id": pid
    }).select( "projects.data" ).exec(function( err, doc ) {
      var projects = doc[ 0 ].projects;

      for ( var i = 0, l = projects.length; i < l; i++ ) {
        if ( "" + projects[ i ]._id === pid ) {
          callback( err, projects[ i ] );
          break;
        }
      }
    });
  },
  isDBOnline: function isDBOnline() {
    return dbOnline;
  },
  updateProject: function updateProject( email, pid, data, callback ) {
    if ( !email || !pid || !data || !data.id ) {
      callback( 'not enough parameters to update' );
      return;
    }

    this.findProject( email, pid, function( err, doc ) {
      if ( err ) {
        callback( err );
        return;
      }

      if ( !doc ) {
        callback( 'project id not found' );
      }

      doc.customData = JSON.stringify( data.customData );
      doc.data = JSON.stringify( data.data );
      doc.name = data.name;
      doc.template = data.template;

      doc.save( function( err ) {
        callback( err, doc );
      });
    });
  }
};
