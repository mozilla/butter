var
mongoose = require( 'mongoose' ),
Schema = mongoose.Schema,

Project2 = new Schema({
  data: String,
  email: String,
  name: String,
  template: String
}),
Project2Model = mongoose.model( 'Project2', Project2 ),

Project = new Schema({
  name: String,
  data: String,
  template: String,
  customData: String
}),
ProjectModel = mongoose.model( 'Project', Project ),

User = new Schema({
  email: String,
  projects: [ Project ],
}),
UserModel = mongoose.model( 'User', User );

function migrateData() {
  console.log( "Attempting data migration. Run this program multiple times" );
  console.log( "== Press ctrl-C to quit the program once the console spam stops ==\n" );

  UserModel.find( {}, function( err, users ) {

    if ( users.length === 0 ) {
      console.log( "No users to migrate" );
      process.exit();
      return;
    }

    users.forEach( function( user ) {
      if ( user.projects.length === 0 ) {
        user.remove();
        user.save( function( err ) {
          if ( err ) {
            console.log( err );
            return;
          }

          console.log( "Deleted old record for " + user.email );
        });
      }

      console.log("Iterating over projects for " + user.email + " (" + user.projects.length + ")" );
      user.projects.forEach( function( project ) {

        var newProject = new Project2Model({
          data: project.data,
          email: user.email,
          name: project.name,
          template: project.template
        });

        newProject.save( function( err ) {
          if ( err ) {
            console.log( err );
            return;
          }

          project.remove();
          user.save( function( err ) {
            if ( err ) {
              console.log( err );
              return;
            }

            console.log( "Done converting " + project.id );
          });
        });
      });
    });
  });
}

// Connect to mongo, and attempt to migrate data
mongoose.connect( 'mongodb://localhost/test', function( err ) {
  if ( !err ) {
    migrateData();
  }
});
