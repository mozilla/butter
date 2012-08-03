console.log( __dirname );

const express = require('express'),
      fs = require('fs'),
      path = require('path'),
      jade = require('jade'),
      app = express.createServer(),
      MongoStore = require('connect-mongo')(express),
      lessMiddleware = require('less-middleware'),
      CONFIG = require('config'),
      TEMPLATES_DIR =  CONFIG.dirs.templates,
      PUBLISH_DIR = CONFIG.dirs.publish,
      PUBLISH_PREFIX = CONFIG.dirs.hostname,
      WWW_ROOT = path.resolve( CONFIG.dirs.wwwRoot || path.join( __dirname, ".." ) ),
      VALID_TEMPLATES = CONFIG.templates,
      EXPORT_ASSETS = CONFIG.exportAssets;

var templateConfigs = {};

function readTemplateConfig( templateName, templatedPath ) {
  var configPath = templatedPath.replace( '{{templateBase}}', TEMPLATES_DIR + '/' );
  fs.readFile( configPath, 'utf8', function( err, conf ) {
    var configPathBase = configPath.substring( 0, configPath.lastIndexOf( '/' ) );
    conf = JSON.parse( conf );
    conf.template = configPathBase + '/' + conf.template;
    templateConfigs[ templateName ] = conf;
  });
}

// parse configs ahead of any action that has to happen with them
for ( var templateName in VALID_TEMPLATES ) {
  readTemplateConfig( templateName, VALID_TEMPLATES[ templateName ] );
}

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

app.configure( function() {
  app.use( express.logger( CONFIG.logger ) )
    .use( express.static( WWW_ROOT, JSON.parse( JSON.stringify( CONFIG.staticMiddleware ) ) ) )
    .use( express.static( PUBLISH_DIR, JSON.parse( JSON.stringify( CONFIG.staticMiddleware ) ) ) )
    .use( express.bodyParser() )
    .use( express.cookieParser() )
    .use( express.session( CONFIG.session ) )
    // Auto-compile CSS from LESS.  Other options: https://github.com/emberfeather/less.js-middleware
    .use( lessMiddleware({
      src: WWW_ROOT,
      dest: WWW_ROOT
    }))
    /* Show Zeus who's boss
     * This only affects requests under /api and /browserid, not static files
     * because the static file writes the response header before we hit this middleware
     */
    .use( function( req, res, next ) {
      res.header( 'Cache-Control', 'no-store' );
      return next();
    })
    .set('view options', {layout: false});
});

app.configure( 'development', function() {
  app.use( express.directory( WWW_ROOT, { icons: true } ) );
});

require('express-browserid').plugAll(app);

// From https://github.com/mozilla/zamboni/blob/a4b32033/media/js/mkt/utils.js#L15
function escapeHTMLinJSON( key, value ) {
  if ( typeof value === "string" ) {
    return value.replace( /&/g, '&amp;' ).replace( />/g, '&gt;' ).replace( /</g, '&lt;' )
                .replace( /'/g, '&#39;' ).replace( /"/g, '&#34;' );
  }

  return value;
}

function writeEmbed( projectEmbedPath, embedUrl, res, url, data ) {
  if( !writeEmbed.templateFn ) {
    writeEmbed.templateFn = jade.compile( fs.readFileSync( 'views/embed.jade', 'utf8' ),
                                          { filename: 'embed.jade', pretty: true } );
  }

  fs.writeFile( projectEmbedPath, writeEmbed.templateFn( data ), function( err ){
    if( err ){
      res.json({ error: 'internal file error' }, 500);
      return;
    }
    res.json({ error: 'okay', url: url });
  });
}

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
          customData = JSON.parse( project.customData, escapeHTMLinJSON );

      if ( template && VALID_TEMPLATES[ template ] ) {
        var projectPath = PUBLISH_DIR + "/" + id + ".html",
            projectEmbedPath = PUBLISH_DIR + "/" + id + "-embed.html",
            url = PUBLISH_PREFIX + "/" + id + ".html",
            embedUrl = PUBLISH_PREFIX + "/" + id + "-embed.html",
            projectData = JSON.parse( project.data, escapeHTMLinJSON ),
            templateBase = VALID_TEMPLATES[ template ].replace( '{{templateBase}}', TEMPLATES_DIR + '/' ),
            templateConfig = templateConfigs[ template ],
            templateFile = templateConfig.template;

        fs.readFile( templateFile, 'utf8', function( err, data ){

          if ( err ) {
            res.json( { error: 'error reading template file' }, 500 );
            return;
          }

          var headEndTagIndex,
              bodyEndTagIndex,
              externalAssetsString = '',
              popcornString = '',
              customDataString = '',
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

          externalAssetsString += '\n';
          for ( i = 0; i < EXPORT_ASSETS.length; ++i ) {
            externalAssetsString += '  <script src="' + path.relative( templateFile, path.resolve( EXPORT_ASSETS[ i ] ) ) + '"></script>\n';
          }

          // If the template has custom plugins defined in it's config, add them to our exported page
          if ( templateConfig.plugin && templateConfig.plugin.plugins ) {
            var plugins = templateConfig.plugin.plugins;

            for ( i = 0, len = plugins.length; i < len; i++ ) {
              externalAssetsString += '\n  <script src="' + PUBLISH_PREFIX + '/' + plugins[ i ].path.split( '{{baseDir}}' ).pop() + '"></script>';
            }
            externalAssetsString += '\n';
          }

          popcornString += '<script>';

          for ( i = 0; i < projectData.media.length; ++i ) {
            var mediaUrls,
                mediaUrlsString = '[ "';

            currentMedia = projectData.media[ i ];
            // We expect a string (one url) or an array of url strings.
            // Turn a single url into an array of 1 string.
            mediaUrls = typeof currentMedia.url === "string" ? [ currentMedia.url ] : currentMedia.url;
            mediaPopcornOptions = currentMedia.popcornOptions || {};
            // Force the Popcorn instance we generate to have an ID we can query.
            mediaPopcornOptions.id = "Butter-Generated";

            numSources = mediaUrls.length;

            for ( k = 0; k < numSources - 1; k++ ) {
              mediaUrlsString += mediaUrls[ k ] + '" , "';
            }
            mediaUrlsString += mediaUrls[ numSources - 1 ] + '" ]';

            popcornString += '\n(function(){';
            popcornString += '\nvar popcorn = Popcorn.smart("#' + currentMedia.target + '", ' +
                             mediaUrlsString + ', ' + JSON.stringify( mediaPopcornOptions ) + ');';
            for ( j = 0; j < currentMedia.tracks.length; ++ j ) {
              currentTrack = currentMedia.tracks[ j ];
              for ( k = 0; k < currentTrack.trackEvents.length; ++k ) {
                currentTrackEvent = currentTrack.trackEvents[ k ];
                popcornString += '\npopcorn.' + currentTrackEvent.type + '(';
                popcornString += JSON.stringify( currentTrackEvent.popcornOptions, null, 2 );
                popcornString += ');';
              }
            }

            if ( currentMedia.controls ) {
              popcornString += "\npopcorn.controls( true );\n";
            } else {
              popcornString += "\npopcorn.controls( false );\n";
            }
            popcornString += '}());\n';
          }
          popcornString += '</script>\n';

          customDataString = '\n<script type="application/butter-custom-data">\n' + JSON.stringify( customData, null, 2 ) + '\n</script>\n';
          data = startString + baseString + templateScripts + externalAssetsString + data.substring( headEndTagIndex, bodyEndTagIndex ) + customDataString + popcornString + data.substring( bodyEndTagIndex );

          fs.writeFile( projectPath, data, function( err ){
            if( err ){
              res.json({ error: 'internal file error' }, 500);
              return;
            }

            // Write out embed HTML, too.
            writeEmbed( projectEmbedPath, embedUrl, res, url, {
              id: id,
              author: email,
              title: "todo",
              templateScripts: templateScripts,
              externalAssets: externalAssetsString,
              customData: customDataString,
              // XXX: need a better way to wrap function, DOM needs to be ready
              popcorn: popcornString.replace( /^\(function\(\)\{/m, "Popcorn( function(){" )
                                    .replace( /\}\(\)\);$/m, "});" )
              // XXX: need a better way to force controls off in embed.
                                    .replace( "popcorn.controls( true );", "popcorn.controls( false );" )
              // XXX: need a better way to force the use of the #smart div
                                    .replace( /Popcorn.smart\("#([^"]+)"/, "Popcorn.smart(\"#embed-smart\"" )
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
  var email = req.session.email;

  if ( !email ) {
    res.render( 'dashboard-unauthorized.jade' );
    return;
  }

  if ( !canStoreData ) {
    res.json( { error: 'storage service is not running' }, 500 );
    return;
  }

  UserModel.findOne( { email: email }, function( err, doc ) {
    var userProjects = [],
        project;
    for ( var i = 0, l = doc.projects.length; i < l; ++i ) {
      project = doc.projects[ i ];
      if ( project.template && VALID_TEMPLATES[ project.template ] ) {
        userProjects.push({
          // make sure _id is a string. saw some strange double-quotes on output otherwise
          _id: String(project._id),
          name: project.name,
          template: project.template,
          href: templateConfigs[ project.template ].template +
            "?savedDataUrl=" + PUBLISH_PREFIX + "/api/project/" + project._id
        });
      }
    }

    res.render( 'dashboard.jade', {
      user: {
        email: email,
      },
      projects: userProjects
    });
  });
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
    var project;
    for( var i=0; i<doc.projects.length; ++i ){
      project = doc.projects[ i ];
      if( String( project._id ) === id ){
        var projectJSON = JSON.parse( project.data );
        projectJSON.name = project.name;
        projectJSON.projectID = project._id;
        res.json( projectJSON );
        return;
      }
    }
    res.json( { error: "project not found" } );
  });
});

app.get('/api/delete/:id?', function(req, res) {
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
    var project;
    for( var i=0; i<doc.projects.length; ++i ){
      project = doc.projects[ i ];
      if( String( project._id ) === id ){
        doc.projects.splice( i, 1 );
        doc.save();
        res.json( { error: 'okay' }, 200 );
        return;
      }
    }
    res.json( { error: 'project not found' }, 404 );
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
        template: req.body.template,
        data: JSON.stringify( req.body.data ),
        customData: JSON.stringify( req.body.customData, null, 2 )
      });
      doc.projects.push( proj );
    }
    else{
      proj.template = req.body.template;
      proj.name = req.body.name;
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
