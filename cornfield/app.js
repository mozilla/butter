console.log( __dirname );

const express = require('express'),
      fs = require('fs'),
      path = require('path'),
      app = express.createServer(),
      MongoStore = require('connect-mongo')(express),
      stylus = require('stylus'),
      CONFIG = require('config'),
      TEMPLATES_DIR =  CONFIG.dirs.templates,
      PUBLISH_DIR = CONFIG.dirs.publish,
      PUBLISH_PREFIX = CONFIG.dirs.hostname,
      WWW_ROOT = path.resolve( CONFIG.dirs.wwwRoot || path.join( __dirname, ".." ) ),
      VALID_TEMPLATES = CONFIG.templates,
      EXPORT_ASSETS = CONFIG.exportAssets;

var canStoreData = true;

console.log( "Templates Dir:", TEMPLATES_DIR );
console.log( "Publish Dir:", PUBLISH_DIR );

var mongoose = require('mongoose'),
    db = mongoose.connect('mongodb://localhost/test', function( err ) {
      if ( err ) {
        console.error( "MongoDB: " + err + "\n  You will not be able to store any data." );
        canStoreData = false;
      }
    }),
    Schema = mongoose.Schema,

    Project = new Schema({
      name: String,
      html: String,
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

CONFIG.session.store = new MongoStore({ db: "test" });

if ( !path.existsSync( PUBLISH_DIR ) ) {
  fs.mkdirSync( PUBLISH_DIR );
}

app.use(express.logger(CONFIG.logger))
  .use(express.bodyParser())
  .use(express.cookieParser())
  .use( express.session( CONFIG.session ) )
  .use(stylus.middleware({
    src: WWW_ROOT
  }))
  .use(express.static( WWW_ROOT ))
  .use(express.static( PUBLISH_DIR ))
  .use(express.directory( WWW_ROOT, { icons: true } ) );

require('express-browserid').plugAll(app);

function publishRoute( req, res ){
  var email = req.session.email,
      id = req.params.id;

  if (!email) {
    res.json({ error: 'unauthorized' }, 403);
    return;
  }

  if (!canStoreData) {
    res.json({ error: 'storage service is not running' }, 500);
    return;
  }

  UserModel.findOne( { email: email }, function( err, doc ) {
    var i;
    if ( err ) {
      res.json({ error: 'internal db error' }, 500);
      return;
    }

    if ( !doc ) {
      res.json({ error: 'user not found' }, 500);
      return;
    }

    var project;
    for ( i=0; i<doc.projects.length; ++i ) {
      if ( String( doc.projects[ i ]._id ) === id ) {
        project = doc.projects[ i ];
        break;
      }
    }

    if ( project ) {
      var template = project.template,
          customData = project.customData;

      if ( template && VALID_TEMPLATES[ template ] ) {
        var projectPath = PUBLISH_DIR + "/" + id + ".html",
            url = PUBLISH_PREFIX + "/" + id + ".html",
            projectData = JSON.parse( project.data ),
            templateBase = VALID_TEMPLATES[ template ].replace( '{{templateBase}}', TEMPLATES_DIR + '/' );

        fs.readFile( templateBase, 'utf8', function(err, conf){
          var templateConfig = JSON.parse( conf ),
              templateFile = path.resolve( templateBase, '..', templateConfig.template );

          fs.readFile( templateFile, 'utf8', function( err, data ){
            var headEndTagIndex,
                bodyEndTagIndex,
                externalAssetsString = '',
                popcornString = '',
                currentMedia,
                currentTrack,
                currentTrackEvent,
                mediaPopcornOptions,
                templateURL,
                baseString,
                headStartTagIndex,
                templateScripts,
                startString,
                j, k;

            templateURL = templateFile.substring( templateFile.indexOf( '/templates' ), templateFile.lastIndexOf( '/' ) );
            baseString = '\n  <base href="' + PUBLISH_PREFIX + templateURL + '/"/>';

            // look for script tags with data-butter-exclude in particular (e.g. butter's js script)
            data = data.replace( /\s*<script[\.\/='":_-\w\s]*data-butter-exclude[\.\/='":_-\w\s]*><\/script>/g, '' );

            // Adding 6 to cut out the actual head tag
            headStartTagIndex = data.indexOf( '<head>' ) + 6;
            headEndTagIndex = data.indexOf( '</head>' );
            bodyEndTagIndex = data.indexOf( '</body>' );

            templateScripts = data.substring( headStartTagIndex, headEndTagIndex );
            startString = data.substring( 0, headStartTagIndex );

            for ( i = 0; i < EXPORT_ASSETS.length; ++i ) {
              externalAssetsString += '\n  <script src="' + path.relative( templateFile, path.resolve( EXPORT_ASSETS[ i ] ) ) + '"></script>\n';
            }

            // If the template has custom plugins defined in it's config, add them to our exported page
            if ( templateConfig.plugin && templateConfig.plugin.plugins ) {
              var plugins = templateConfig.plugin.plugins;

              for ( i = 0, len = plugins.length; i < len; i++ ) {
                externalAssetsString += '\n  <script src="' + PUBLISH_PREFIX + '/' + plugins[ i ].path.split( '{{baseDir}}' ).pop() + '"></script>';
              }
              externalAssetsString += '\n';
            }

            popcornString += '<script>'

            for ( i = 0; i < projectData.media.length; ++i ) {
              var mediaUrls = '[ "',
                  numSources;
              currentMedia = projectData.media[ i ];
              mediaPopcornOptions = currentMedia.popcornOptions || {};
              numSources = currentMedia.url.length;
              
              for ( k = 0; k < numSources - 1; k++ ) {
                mediaUrls += currentMedia.url[ k ] + '" , "';
              }
              mediaUrls += currentMedia.url[ numSources - 1 ] + '" ]';

              popcornString += '\n(function(){';
              popcornString += '\nvar popcorn = Popcorn.smart("#' + currentMedia.target + '", ' + mediaUrls + ', ' + JSON.stringify( mediaPopcornOptions ) + ');';
              for ( j = 0; j < currentMedia.tracks.length; ++ j ) {
                currentTrack = currentMedia.tracks[ j ];
                for ( k = 0; k < currentTrack.trackEvents.length; ++k ) {
                  currentTrackEvent = currentTrack.trackEvents[ k ];
                  popcornString += '\npopcorn.' + currentTrackEvent.type + '(';
                  popcornString += JSON.stringify( currentTrackEvent.popcornOptions, null, 2 );
                  popcornString += ');';
                }
              }
              popcornString += '}());\n';
            }
            popcornString += '</script>\n';

            customDataString = '\n<script type="application/butter-custom-data">\n' + customData + '\n</script>';

            data = startString + baseString + templateScripts + externalAssetsString + data.substring( headEndTagIndex, bodyEndTagIndex ) + customDataString + popcornString + data.substring( bodyEndTagIndex );

            fs.writeFile( projectPath, data, function(){
              if( err ){
                res.json({ error: 'internal file error' }, 500);
                return;
              }
              res.json({ error: 'okay', url: url });
            });
          });
        });
      }
      else {
        res.json({ error: 'template not found' }, 500);
        return;
      }
    }
    else {
      res.json({ error: 'project not found' }, 500);
      return;
    }
  });
}

app.post('/api/publish/:id', publishRoute );

app.get('/dashboard', function(req, res) {
  res.send('This is just a placeholder', 200);
});

app.get('/api/projects', function(req, res) {
  var email = req.session.email;

  if (!email) {
    res.json({ error: 'unauthorized' }, 403);
    return;
  }

  if (!canStoreData) {
    res.json({ error: 'storage service is not running' }, 500);
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

app.get('/api/project/:id?', function(req, res) {
  var email = req.session.email,
      id = req.params.id;

  if (!email) {
    res.json({ error: 'unauthorized' }, 403);
    return;
  }

  if (!canStoreData) {
    res.json({ error: 'storage service is not running' }, 500);
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

app.post('/api/project/:id?', function( req, res ) {
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

  if (!canStoreData) {
    res.json({ error: 'storage service is not running' }, 500);
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
        data: JSON.stringify( req.body.data ),
        customData: JSON.stringify( req.body.customData, null, 2 )
      });
      doc.projects.push( proj );
    }
    else{
      proj.template = req.body.template;
      proj.name = req.body.name;
      proj.html = req.body.html;
      proj.data = JSON.stringify( req.body.data );
      proj.customData = JSON.stringify( req.body.customData, null, 2 );
    }

    doc.save();

    res.json({ error: 'okay', project: proj });
    return;

  });
});

app.get('/api/whoami', function( req, res ) {
  var email = req.session.email;

  if ( !email ) {
    res.json( { error: 'unauthorized' }, 403 );
    return;
  }

  res.json({
    email: email,
    name: email,
    username: email
  });
});

var port = process.env.PORT || CONFIG.server.bindPort;

app.listen(port, CONFIG.server.bindIP, function() {
  var addy = app.address();
  console.log('HTTP Server started on http://' + CONFIG.server.bindIP + ':' + addy.port);
  console.log('Press Ctrl+C to stop');
});
