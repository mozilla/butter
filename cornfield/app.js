console.log( __dirname );

const express = require('express'),
      fs = require('fs'),
      app = express.createServer(),
      CONFIG = require('config');

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
  var email = "jon@jbuckley.ca"; // req.session.email

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

app.get('/project/:id?', function(req, res) {
  var email = "jon@jbuckley.ca", // req.session.email
      id = req.params.id;

  if (!email) {
    res.json({ error: 'unauthorized' }, 403);
    return;
  }

  res.sendfile(storage + email + '/' + name, function(err) {
    if (err) {
      res.json({ error: 'file not found' }, 404);
    }
  });
});

app.post('/project/:id?', function( req, res ) {
  var email = "jon@jbuckley.ca", // req.session.email
      id = req.params.id;
  
  if ( !email ) {
    res.json( { error: 'unauthorized' }, 403 );
    return;
  }

  UserModel.findOne( { email: email }, function( err, doc ) {
    // No previous id, so this is a new project
    if ( !id ) {
      var obj = {
        name: req.body.name,
        html: req.body.html,
        data: req.body.data
      }
console.log(req.body);
      /*doc.projects.push( obj );
      doc.save( function( err ) {
        if ( err ) {
          console.log( err );
        }
      });*/
      res.json({ error: 'okay' });
      
      return;
    }
    
    
  });
});

app.listen(CONFIG.server.bindPort, CONFIG.server.bindIP, function() {
  var addy = app.address();
  console.log('Server started on http://' + addy.address + ':' + addy.port);
  console.log('Press Ctrl+C to stop');
});
