/*jshint eqeqeq:false */
console.log( __dirname );

var express = require('express'),
    fs = require('fs'),
    path = require('path'),
    jade = require('jade'),
    app = express.createServer(),
    clientSessions = require('client-sessions'),
    lessMiddleware = require('less-middleware'),
    CONFIG = require('config'),
    User = require( './lib/user' )( CONFIG.database ),
    filter = require( './lib/filter' )( User.isDBOnline ),
    sanitizer = require( './lib/sanitizer' ),
    TEMPLATES_DIR =  CONFIG.dirs.templates,
    PUBLISH_DIR = CONFIG.dirs.publish,
    PUBLISH_DIR_V = path.join( PUBLISH_DIR, 'v' ),
    PUBLISH_DIR_E = path.join( PUBLISH_DIR, 'e' ),
    PUBLISH_PREFIX = CONFIG.dirs.hostname,
    PUBLISH_PREFIX_V = CONFIG.dirs.hostname + "/v",
    PUBLISH_PREFIX_E = CONFIG.dirs.hostname + "/e",
    REPORTS_DIR = path.join( PUBLISH_DIR, "crash" ),
    WWW_ROOT = path.resolve( CONFIG.dirs.wwwRoot ),
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
  if ( VALID_TEMPLATES.hasOwnProperty( templateName ) ) {
    readTemplateConfig( templateName, VALID_TEMPLATES[ templateName ] );
  }
}

console.log( "Templates Dir:", TEMPLATES_DIR );
console.log( "Publish Dir:", PUBLISH_DIR );

if ( !fs.existsSync( PUBLISH_DIR ) ) {
  fs.mkdirSync( PUBLISH_DIR );
}
if ( !fs.existsSync( PUBLISH_DIR_V ) ) {
  fs.mkdirSync( PUBLISH_DIR_V );
}
if ( !fs.existsSync( PUBLISH_DIR_E ) ) {
  fs.mkdirSync( PUBLISH_DIR_E );
}
if ( !fs.existsSync( REPORTS_DIR ) ) {
  fs.mkdirSync( REPORTS_DIR );
}

app.configure( 'development', function() {
  app.use( lessMiddleware( WWW_ROOT ));
  CONFIG.additionalStaticRoots.forEach( function( dir ) {
    app.use( express.static( dir ) );
  });
});

app.configure( function() {
  app.use( express.logger( CONFIG.logger ) )
    .use( express.static( WWW_ROOT, JSON.parse( JSON.stringify( CONFIG.staticMiddleware ) ) ) )
    .use( express.static( PUBLISH_DIR, JSON.parse( JSON.stringify( CONFIG.staticMiddleware ) ) ) )
    .use( express.bodyParser() )
    .use( clientSessions( CONFIG.session ) )
    /* Show Zeus who's boss
     * This only affects requests under /api and /persona, not static files
     * because the static file writes the response header before we hit this middleware
     */
    .use( function( req, res, next ) {
      res.header( 'Cache-Control', 'no-store' );
      return next();
    })
    .set('view options', {layout: false});
});

require( 'express-persona' )( app, {
  audience: CONFIG.dirs.hostname
});
require('./routes')( app, User, filter, sanitizer );

function writeEmbedShell( path, res, url, data, callback ) {
  if( !writeEmbedShell.templateFn ) {
    writeEmbedShell.templateFn = jade.compile( fs.readFileSync( 'views/embed-shell.jade', 'utf8' ),
                                          { filename: 'embed-shell.jade', pretty: true } );
  }

  fs.writeFile( path, writeEmbedShell.templateFn( data ), function( err ){
    if( err ){
      res.json({ error: 'internal file error' }, 500);
      return;
    }
    if( callback ) {
      callback();
    } else {
      res.json({ error: 'okay', url: url });
    }
  });
}

function writeEmbed( path, res, url, data, callback ) {
  if( !writeEmbed.templateFn ) {
    writeEmbed.templateFn = jade.compile( fs.readFileSync( 'views/embed.jade', 'utf8' ),
                                          { filename: 'embed.jade', pretty: true } );
  }

  fs.writeFile( path, writeEmbed.templateFn( data ), function( err ){
    if( err ){
      res.json({ error: 'internal file error' }, 500);
      return;
    }
    if( callback ) {
      callback();
    } else {
      res.json({ error: 'okay', url: url });
    }
  });
}

app.post( '/api/publish/:id',
  filter.isLoggedIn, filter.isStorageAvailable, filter.isXHR,
  function publishRoute( req, res ) {

  var email = req.session.email,
      id = req.params.id;

  User.findProject( email, id, function( err, project ) {
    if ( err ) {
      res.json( { error: err }, 500);
      return;
    }

    if ( !project ) {
      res.json( { error: 'project not found' }, 404);
      return;
    }

    var i = 0,
        template = project.template;

    if( !( template && VALID_TEMPLATES[ template ] ) ) {
      res.json({ error: 'template not found' }, 500);
      return;
    }

    var projectData = JSON.parse( project.data, sanitizer.escapeHTMLinJSON ),
        templateConfig = templateConfigs[ template ],
        templateFile = templateConfig.template,
        baseHref;

    fs.readFile( templateFile, 'utf8', function( err, data ){
      if ( err ) {
        res.json( { error: 'error reading template file' }, 500 );
        return;
      }

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
          numSources,
          j, k, len;

      templateURL = path.relative( WWW_ROOT, path.dirname( templateFile ) );
      baseHref = PUBLISH_PREFIX + "/" + templateURL + "/";
      baseString = '\n  <base href="' + baseHref + '"/>';

      // look for script tags with data-butter-exclude in particular (e.g. butter's js script)
      data = data.replace( /\s*<script[\.\/='":_\-\w\s]*data-butter-exclude[\.\/='":_\-\w\s]*><\/script>/g, '' );

      // Adding  to cut out the actual head tag
      headStartTagIndex = data.indexOf( '<head>' ) + 6;
      headEndTagIndex = data.indexOf( '</head>' );
      bodyEndTagIndex = data.indexOf( '</body>' );

      templateScripts = data.substring( headStartTagIndex, headEndTagIndex );
      startString = data.substring( 0, headStartTagIndex );

      externalAssetsString += '\n';
      for ( i = 0; i < EXPORT_ASSETS.length; ++i ) {
        externalAssetsString += '  <script src="' + path.relative( path.dirname( templateFile ), EXPORT_ASSETS[ i ] ) + '"></script>\n';
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

        popcornString += '}());\n';
      }
      popcornString += '</script>\n';

      data = startString + baseString + templateScripts + externalAssetsString +
             data.substring( headEndTagIndex, bodyEndTagIndex ) +
             popcornString + data.substring( bodyEndTagIndex );

      function publishEmbedShell() {
        // Write out embed shell HTML
        writeEmbedShell( path.join( PUBLISH_DIR_V, id + ".html" ),
                         res, PUBLISH_PREFIX_V + "/" + id + ".html",
                         {
                           author: project.author,
                           projectName: project.name,
                           embedSrc: PUBLISH_PREFIX_E + "/" + id + ".html"
                         });
      }

      // This is a query string-only URL because of the <base> tag
      var remixUrl = "?savedDataUrl=/api/remix/" + project.id;

      writeEmbed( path.join( PUBLISH_DIR_E, id + ".html" ),
                  res, path.join( PUBLISH_PREFIX_E, id + ".html" ),
                  {
                    id: id,
                    author: project.author,
                    title: project.name,
                    baseHref: baseHref,
                    remixUrl: remixUrl,
                    templateScripts: templateScripts,
                    externalAssets: externalAssetsString,
                    // XXX: need a better way to wrap function, DOM needs to be ready
                    popcorn: popcornString.replace( /^\(function\(\)\{/m, "Popcorn( function(){" )
                                          .replace( /\}\(\)\);$/m, "});" )
                  },
                  publishEmbedShell );

    });
  });
});

app.get( '/dashboard', filter.isStorageAvailable, function( req, res ) {
  var email = req.session.email;

  if ( !email ) {
    res.render( 'dashboard-unauthorized.jade' );
    return;
  }

  User.findAllProjects( email, function( err, docs ) {
    var userProjects = [];

    docs.forEach( function( project ) {
      if ( project.template && VALID_TEMPLATES[ project.template ] ) {
        userProjects.push({
          // make sure _id is a string. saw some strange double-quotes on output otherwise
          _id: String(project.id),
          name: sanitizer.escapeHTML( project.name ),
          template: project.template,
          href: path.relative( WWW_ROOT, templateConfigs[ project.template ].template ) +
            "?savedDataUrl=/api/project/" + project.id
        });
      }
    });

    res.render( 'dashboard.jade', {
      user: {
        email: email,
      },
      projects: userProjects
    });
  });
});

// Simple crash reporter
app.post( '/report', function( req, res ) {
  var report = '';

  req.addListener( 'data', function( data ) {
    report += data;
  });

  req.addListener( 'end', function() {
    // Make sure two reports don't have identical timestamp, add some noise
    var noise = ( Math.random() * 1000 ) | 0,
        filename = '' + Date.now() + '-' + noise + '.json';
    fs.writeFile( path.join( REPORTS_DIR, filename ), report, function() {
      res.writeHead( 200, { 'content-type': 'text/plain' } );
      res.end();
    });
  });
});

var port = process.env.PORT || CONFIG.server.bindPort;

app.listen(port, CONFIG.server.bindIP, function() {
  var addy = app.address();
  console.log('HTTP Server started on http://' + CONFIG.server.bindIP + ':' + addy.port);
  console.log('Press Ctrl+C to stop');
});
