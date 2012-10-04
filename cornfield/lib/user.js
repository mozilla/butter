'use strict';

var
dbOnline = false,
mongoose = require('mongoose'),
Schema = mongoose.Schema,

Project = new Schema({
  data: String,
  email: String,
  name: String,
  author: String,
  template: String
}),
ProjectModel = mongoose.model( 'Project2', Project );

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

    var project = new ProjectModel({
      data: JSON.stringify( data.data ),
      email: email,
      name: data.name,
      author: data.author || "",
      template: data.template
    });

    project.save( function( err ) {
      callback( err, project );
    });
  },
  deleteProject: function( email, pid, callback ) {
    if ( !email || !pid ) {
      callback( 'not enough parameters to delete' );
      return;
    }

    ProjectModel.remove( { email: email, _id: pid }, callback );
  },
  findAllProjects: function findAllProjects( email, callback ) {
    if ( !email ) {
      callback( 'not enough parameters to search' );
      return;
    }

    ProjectModel.find( { email: email }, callback );
  },
  findProject: function findProject( email, pid, callback ) {
    if ( !email || !pid ) {
      callback( 'not enough parameters to search' );
      return;
    }

    ProjectModel.find( { email: email, _id: pid }, function( err, doc ) {
      if ( err ) {
        callback( err );
        return;
      }

      // .find() returns an array, but this API expects a single document or null
      doc = doc.length > 0 ? doc[ 0 ] : null;
      callback( err, doc );
    });
  },
  findById: function findById( pid, callback ) {
    if ( !pid ) {
      callback( 'not enough parameters for search' );
      return;
    }

    ProjectModel.findById( pid, callback );
  },
  isDBOnline: function isDBOnline() {
    return dbOnline;
  },
  updateProject: function updateProject( email, pid, data, callback ) {
    if ( !email || !pid || !data ) {
      callback( 'not enough parameters to update' );
      return;
    }

    ProjectModel.find( { email: email, _id: pid }, function( err, doc ) {
      if ( err ) {
        callback( err );
        return;
      }

      if ( doc.length !== 1 ) {
        callback( 'project id not found' );
        return;
      }

      doc = doc[ 0 ];
      doc.data = JSON.stringify( data.data );
      doc.email = email;
      doc.name = data.name;
      doc.author = data.author || "";
      doc.template = data.template;

      doc.save( function( err ) {
        callback( err, doc );
      });
    });
  },
  closeDBConnection: function( callback ) {
    mongoose.connection.close(function() {
      dbOnline = false;

      if ( callback ) {
        callback();
      }
    });
  }
};
