console.log( __dirname );

const express = require('express'),
      fs = require('fs'),
      app = express.createServer(),
      CONFIG = require('config'),
      TEMPLATES_DIR = CONFIG.templates.root;

var mongoose = require('mongoose'),
    db = mongoose.connect('mongodb://localhost/test'),
    Schema = mongoose.Schema,
    
    Project = new Schema({
      name: String,
      html: String,
      data: String
    }),
    ProjectModel = mongoose.model( 'Project', Project ),
    
    User = new Schema({
      email: String,
      projects: [Project],
    }),
    UserModel = mongoose.model( 'User', User );

app.use(express.logger(CONFIG.logger))
  .use(express.bodyParser())
  .use(express.cookieParser())
  .use(express.session(CONFIG.session))
  .use(express.static( __dirname + '/..' ))
  .use(express.directory( __dirname + '/..', { icons: true } ) );

require('express-browserid').plugAll(app);

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
      if( doc.projects[ i ]._id === req.body.id ){
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
        data: JSON.stringify( req.body.data )
      });
      doc.projects.push( proj );
    }
    else{
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
  console.log('Server started on http://' + addy.address + ':' + addy.port);
  console.log('Press Ctrl+C to stop');
});
