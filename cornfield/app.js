/*jshint eqeqeq:false */
console.log( __dirname );

// Given foo/ return foo
function stripSlash( path ) {
  return path.replace( /\/$/, '' );
}

var express = require('express'),
    fs = require('fs'),
    path = require('path'),
    jade = require('jade'),
    app = express(),
    clientSessions = require('client-sessions'),
    lessMiddleware = require('less-middleware'),
    CONFIG = require('config'),
    User = require( './lib/user' )( CONFIG.database ),
    filter = require( './lib/filter' )( User.isDBOnline ),
    sanitizer = require( './lib/sanitizer' ),
    FileStore = require('./lib/file-store.js'),
    raven = require('raven'),
    utils,
    stores = {},
    TEMPLATES_DIR = CONFIG.dirs.templates,
    APP_HOSTNAME = stripSlash( CONFIG.dirs.appHostname ),
    // If a separate hostname is given for embed, use it, otherwise use app's hostname
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
  if ( VALID_TEMPLATES.hasOwnProperty( templateName ) ) {
    readTemplateConfig( templateName, VALID_TEMPLATES[ templateName ] );
  }
}

console.log( "Templates Dir:", TEMPLATES_DIR );

app.configure( 'development', function() {
  app.use( lessMiddleware( WWW_ROOT ));
  CONFIG.additionalStaticRoots.forEach( function( dir ) {
    app.use( express.static( dir ) );
  });
});

function setupStore( config ) {
  var store = FileStore.create( config.type, config.options );
  if( store.requiresFileSystem ) {
    app.use( express.static( store.root, JSON.parse( JSON.stringify( CONFIG.staticMiddleware ) ) ) );
  }
  return store;
}

app.configure( function() {
  app.use( express.logger( CONFIG.logger ) )
    .use( express.static( WWW_ROOT, JSON.parse( JSON.stringify( CONFIG.staticMiddleware ) ) ) )
    .use( express.bodyParser() )
    .use( clientSessions( CONFIG.session ) )
    .use( express.csrf() )
    /* Show Zeus who's boss
     * This only affects requests under /api and /persona, not static files
     * because the static file writes the response header before we hit this middleware
     */
    .use( function( req, res, next ) {
      res.header( 'Cache-Control', 'no-store' );
      return next();
    })
    .use( app.router );

  // Error handling
  if ( CONFIG.sentry ) {
    var ravenClient = new raven.Client( CONFIG.sentry.dsn, CONFIG.sentry.options );
    app.use( raven.middleware.express( ravenClient ) );
    ravenClient.patchGlobal( function() {
      process.exit(1);
    });
  }

  // File Store types and options come from JSON config file.
  stores.publish = setupStore( CONFIG.publishStore );
  stores.crash = setupStore( CONFIG.crashStore );
  stores.feedback = setupStore( CONFIG.feedbackStore );
  stores.images = setupStore( CONFIG.imageStore );

  utils = require( './lib/utils' )({
    EMBED_HOSTNAME: CONFIG.dirs.embedHostname ? stripSlash( CONFIG.dirs.embedHostname ) : APP_HOSTNAME,
    EMBED_SUFFIX: '_'
  }, stores );
});

require( 'express-persona' )( app, {
  audience: CONFIG.dirs.appHostname
});

require('./routes')( app, User, filter, sanitizer, stores, utils );

function writeEmbedShell( path, url, data, callback ) {
  if( !writeEmbedShell.templateFn ) {
    writeEmbedShell.templateFn = jade.compile( fs.readFileSync( 'views/embed-shell.jade', 'utf8' ),
                                          { filename: 'embed-shell.jade', pretty: true } );
  }

  stores.publish.write( path, writeEmbedShell.templateFn( data ), callback );
}

function writeEmbed( path, url, data, callback ) {
  if( !writeEmbed.templateFn ) {
    writeEmbed.templateFn = jade.compile( fs.readFileSync( 'views/embed.jade', 'utf8' ),
                                          { filename: 'embed.jade', pretty: true } );
  }

  stores.publish.write( path, writeEmbed.templateFn( data ), callback );
}

app.post( '/api/publish/:id',
  filter.isLoggedIn, filter.isStorageAvailable,
  function publishRoute( req, res ) {

  var email = req.session.email,
      id = parseInt( req.params.id, 10 );

  if ( isNaN( id ) ) {
    res.json( { error: "ID was not a number" }, 500 );
    return;
  }

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

      templateURL = templateFile.substring( templateFile.indexOf( '/templates' ), templateFile.lastIndexOf( '/' ) );
      baseHref = APP_HOSTNAME + templateURL + "/";
      baseString = '\n  <base href="' + baseHref + '"/>';

      // look for script and link tags with data-butter-exclude in particular (e.g. butter's js script)
      data = data.replace( /\s*<(script|link)[\.\/='":_\-\w\s]*data-butter-exclude[\.\/='":_\-\w\s]*>(<\/script>)?/g, '' );

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
          externalAssetsString += '\n  <script src="' + APP_HOSTNAME + '/' + plugins[ i ].path.split( '{{baseDir}}' ).pop() + '"></script>';
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

      // Convert 1234567890 => "kf12oi"
      var idBase36 = utils.generateIdString( id ),
          publishUrl = utils.generatePublishUrl( id ),
          iframeUrl = utils.generateIframeUrl( id );

      function finished( err ) {
        if ( err ) {
          res.json({ error: 'internal server error' }, 500);
        } else {
          res.json({ error: 'okay', publishUrl: publishUrl, iframeUrl: iframeUrl });
        }
      }

      function publishEmbedShell() {
        // Write out embed shell HTML
        writeEmbedShell( idBase36, publishUrl,
                         {
                           author: project.author,
                           projectName: project.name,
                           embedShellSrc: publishUrl,
                           embedSrc: iframeUrl,
                           baseHref: APP_HOSTNAME
                         },
                         finished );
      }

      // This is a query string-only URL because of the <base> tag
      var remixUrl = "?savedDataUrl=/api/remix/" + project.id,
          mediaUrl = projectData.media[ 0 ].url,
          attribURL = Array.isArray( mediaUrl ) ? mediaUrl[ 0 ] : mediaUrl;

      writeEmbed( idBase36 + utils.constants().EMBED_SUFFIX, iframeUrl,
                  {
                    id: id,
                    author: project.author,
                    title: project.name,
                    mediaSrc: attribURL,
                    embedShellSrc: publishUrl,
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
            "?savedDataUrl=/api/project/" + project.id,
          updatedAt: project.updatedAt
        });
      }
    });

    userProjects.sort( function( a, b ) {
      var aDate = Date.parse( a.updatedAt ),
          bDate = Date.parse( b.updatedAt );

      if ( aDate < bDate ) {
        return 1;
      }

      if ( aDate > bDate ) {
        return -1;
      }

      return 0;
    });

    res.render( 'dashboard.jade', {
      user: {
        csrf: req.session._csrf,
        email: email
      },
      projects: userProjects
    });
  });
});

var port = process.env.PORT || CONFIG.server.bindPort;

var server = app.listen(port, CONFIG.server.bindIP, function() {
  var addy = server.address();
  console.log('HTTP Server started on http://' + CONFIG.server.bindIP + ':' + addy.port);
  console.log('Press Ctrl+C to stop');
});
