console.log( __dirname );

const express = require('express'),
      fs = require('fs'),
      path = require('path'),
      app = express.createServer(),
      stylus = require('stylus'),
      CONFIG = require('config'),
      TEMPLATES_DIR =  CONFIG.dirs.templates,
      PUBLISH_DIR = CONFIG.dirs.publish,
      PUBLISH_PREFIX = CONFIG.dirs.publishPrefix,
      ENVIRONMENT = CONFIG.environment || {},
      MODE = ENVIRONMENT.mode || "production",
      WWW_ROOT = CONFIG.dirs.wwwRoot || __dirname + "/..",
      TEMPLATES = CONFIG.templates || {};

var   DEFAULT_USER = null;

if( MODE === "development" ){
  DEFAULT_USER = ENVIRONMENT.defaultUser;
}

console.log( "Environment: ", MODE );
console.log( "Templates Dir:", TEMPLATES_DIR );
console.log( "Publish Dir:", PUBLISH_DIR );

var mongoose = require('mongoose'),
    db = mongoose.connect('mongodb://localhost/test', function( err ) {
        if ( err ) {
          console.log( "COULD NOT CONNECT TO MONGODB! Make sure it is running!" );
          throw err;
        }
    });
    Schema = mongoose.Schema,
    
    Project = new Schema({
      name: String,
      html: String,
      data: String,
      template: String
    }),
    ProjectModel = mongoose.model( 'Project', Project ),
    
    User = new Schema({
      email: String,
      projects: [Project],
    }),
    UserModel = mongoose.model( 'User', User );

if ( !path.existsSync( PUBLISH_DIR ) ) {
  fs.mkdirSync( PUBLISH_DIR );
} 

app.use(express.logger(CONFIG.logger))
  .use(express.bodyParser())
  .use(express.cookieParser())
  .use(express.session(CONFIG.session))
  .use(stylus.middleware({
    src: WWW_ROOT
  }))
  .use(express.static( WWW_ROOT ))
  .use(express.static( PUBLISH_DIR ))
  .use(express.directory( WWW_ROOT, { icons: true } ) );

require('express-browserid').plugAll(app);

function publishRoute( req, res ){
  var email = req.session.email || DEFAULT_USER,
      id = req.params.id;

  if (!email) {
    res.json({ error: 'unauthorized' }, 403);
    return;
  }

  UserModel.findOne( { email: email }, function( err, doc ) {
    if ( err ) {
      res.json({ error: 'internal db error' }, 500);
      return;
    }

    if ( !doc ) {
      res.json({ error: 'user not found' }, 500);
      return;
    }

    for ( var i=0; i<doc.projects.length; ++i ) {
      if ( String( doc.projects[ i ]._id ) === id ) {
        var projectPath = PUBLISH_DIR + "/" + id + ".html",
            url = PUBLISH_PREFIX + "/" + id + ".html",
            data = doc.projects[ i ].html;

        var template = TEMPLATES[ doc.projects[ i ].template ];
        if( template ){
          for( var r in template ){
            if( template.hasOwnProperty( r ) ){
              var regStr = r + "";
              regStr = regStr.replace( /\./g, "\\." );
              regStr = regStr.replace( /\//g, "\\/" );
              var regex = new RegExp( regStr, "g" );
              data = data.replace( regex, template[ r ] );
            }
          }
        }

        fs.writeFile( projectPath, data, function(){
          if( err ){
            res.json({ error: 'internal file error' }, 500);
            return;
          }
          res.json({ error: 'okay', url: url });
        });
      }  
    }
  });
}

if( MODE === "development" ){
  app.get('/publish/:id', publishRoute );  
}
app.post('/publish/:id', publishRoute );

app.get('/projects', function(req, res) {
  var email = req.session.email;

  if (!email) {
    res.json({ error: 'unauthorized' }, 403);
    return;
  }

  UserModel.findOne( { email: email }, function( err, doc ) {

    // Add a user record if they've never logged in yet
    if ( err === null && doc === null ) {
      doc = new UserModel({
        email: email
      });
      doc.save( function( err ) {
        if ( err ) {
          console.log( err );
        }
      });

      res.json({ error: 'okay', projects: [] });
      return;
    }

    if ( err ) {
      console.log( err );
      res.json({ error: err, projects: [] }, 500);
    }

    // We really only need to send the name and id for future use
    var projectData = [];
    doc.projects.forEach( function( value, index, arr ) {
      projectData.push( { name: value.name, id: value._id } );
    });

    res.json({ error: 'okay', projects: projectData });
  });
});

app.get('/load/:user/:id', function(req, res){
  var email = req.params.user,
      id = req.params.id;

  UserModel.findOne( { email: email }, function( err, doc ) {
    for( var i=0; i<doc.projects.length; ++i ){
      if( String( doc.projects[ i ]._id ) === id ){
        res.send( doc.projects[ i ].html, { 'Content-Type': 'text/html' }, 201);
        return;
      }  
    }
    res.send(404);    
  });
  
});

app.get('/project/:id?', function(req, res) {
  var email = req.session.email,
      id = req.params.id;

  if (!email) {
    res.json({ error: 'unauthorized' }, 403);
    return;
  }

  UserModel.findOne( { email: email }, function( err, doc ) {
    for( var i=0; i<doc.projects.length; ++i ){
      if( String( doc.projects[ i ]._id ) === id ){
        returnVal = { error: "okay", project: doc.projects[ i ].data };
        res.json( returnVal );
        return;
      }
    }
    res.json( { error: "project not found" } );
  });
});

app.post('/project/:id?', function( req, res ) {
  var email = req.session.email,
      id = req.params.id;
  
  if ( !email ) {
    res.json( { error: 'unauthorized' }, 403 );
    return;
  }

  if( !req.body ){
    res.json( {error: 'no project data received' }, 500 );
    return;
  }


  UserModel.findOne( { email: email }, function( err, doc ) {

    if( err ){
      res.json( {error: 'internal db error' }, 500 );
      return;
    }

    if( !doc ){
      doc = new UserModel({
        email: email
      });
    }

    var proj;
    for( var i=0, l=doc.projects.length; i<l; ++i ){
      // purposeful lazy comparison here (String -> string)
      if( doc.projects[ i ]._id == req.body.id ){
        proj = doc.projects[ i ]; 
      }
    }

    if( !proj ){
      if( req.body.id ){
        res.json( {error: 'id specified but not found. data corruption or haxxors.'}, 500 );
        return;
      }
      var proj = new ProjectModel({
        name: req.body.name,
        html: req.body.html,
        template: req.body.template,
        data: JSON.stringify( req.body.data )
      });
      doc.projects.push( proj );
    }
    else{
      proj.template = req.body.template;
      proj.name = req.body.name;
      proj.html = req.body.html;
      proj.data = JSON.stringify( req.body.data );
    }

    doc.save();

    res.json({ error: 'okay', project: proj });
    return;

  });
});

app.listen(CONFIG.server.bindPort, CONFIG.server.bindIP, function() {
  var addy = app.address();
  console.log('Server started on http://' + CONFIG.server.bindIP + ':' + CONFIG.server.bindPort);
  console.log('Press Ctrl+C to stop');
});
