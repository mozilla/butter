/*global cat,cd,cp,echo,env,exec,exit,find,mkdir,mv,pwd,rm,sed,target,test */

var async = require( "async" ),
    path = require( "path" ),
    normalize = function( p ){ return path.normalize( p ); },
    // Make Windows happy, use `node <path>`
    nodeExec = function( p ){ return 'node "' + p + '"'; },

    JSLINT = nodeExec( normalize( "./node_modules/jshint/bin/jshint" ) ),
    html5lint = require( "html5-lint" ),
    RJS = nodeExec( normalize( "./node_modules/requirejs/bin/r.js" ) ),

    DIST_DIR = "dist",

    // Global var for exit code
    passed = true;

require("shelljs/make");

// Get the git repo version info for a given repo root dir
function gitDescribe( repoRoot ) {
  var cwd = pwd();
  cd( repoRoot );
  var version = exec( "git describe",
                      { silent: true } ).output.replace( /\r?\n/m, "" );
  cd( cwd );
  return version;
}

function lessToCSS( lessFile, callback ) {
  var less = require( "less" );
  var fileContents = cat( lessFile );
  var parser = new less.Parser({
    filename: lessFile,
    paths: [ path.dirname( lessFile ) ]
  });

  parser.parse( fileContents, function( err, tree ) {
    if ( err ) {
      callback( err );
      return;
    }

    try {
      var css = tree.toCSS();
      callback( null, css );
    } catch ( ex ) {
      callback( ex );
    }
  });
}

function checkCSSFile( cssFile, filename ) {
  var csslint = require( "csslint" ).CSSLint;

  // 0 = disabled, 1 = warning, 2 = error
  // run csslint --list-rules to see more
  var rules = {
    //"important": 2,
    //"adjoining-classes": 2,
    "known-properties": 2,
    //"box-sizing": 2,
    //"box-model": 2,
    //"overqualified-elements": 2,
    "display-property-grouping": 2,
    //"bulletproof-font-face": 2,
    //"compatible-vendor-prefixes": 2,
    //"regex-selectors": 2,
    "errors": 2,
    //"duplicate-background-images": 2,
    "duplicate-properties": 2,
    "empty-rules": 2,
    "selector-max-approaching": 2,
    "gradients": 2,
    //"fallback-colors": 2,
    //"font-sizes": 2,
    "font-faces": 2,
    //"floats": 2,
    //"star-property-hack": 2,
    //"outline-none": 2,
    "import": 2,
    //"ids": 2,
    "underscore-property-hack": 2,
    "rules-count": 2,
    //"qualified-headings": 2,
    "selector-max": 2,
    "shorthand": 2,
    "text-indent": 2,
    //"unique-headings": 2,
    //"universal-selector": 2,
    //"unqualified-attributes": 2,
    "vendor-prefix": 2,
    "zero-units": 2
  };

  var result = csslint.verify( cssFile, rules );

  result.messages.filter( function( msg ) {
    // If the evidence string contains 'csslint-ignore' then skip it
    return !msg.evidence.match( /csslint-ignore/ );
  }).forEach( function( msg ) {
    passed = false;
    console.error( "%s: line %d, col %d, Error - %s",
                   filename, msg.line, msg.col, msg.message );
  });
}

function checkCSS( callback ) {
  echo( "" );
  echo( "# Linting CSS and LESS files" );

  var files = [
    "public/css/butter.ui.less",
    "public/css/transitions.less",
    "public/css/embed.less",
    "public/css/embed-shell.less",
    "public/templates/assets/css/jquery-ui/jquery.ui.butter.less",
    "public/templates/assets/plugins/twitter/popcorn.twitter.less",
    "public/templates/assets/plugins/wikipedia/popcorn.wikipedia.less",
    "public/templates/basic/style.less"
  ];

  files = files.concat( find( "public/" ).filter( function( filename ) {
    return filename.match( /\.css$/ ) && !filename.match( /^public\/test/ ) &&
           !filename.match( /^public\/external/ );
  })).sort();

  var q = async.queue( function( lessFile, cb ) {
    lessToCSS( lessFile, function( err, cssFile ) {
      echo( "## " + lessFile );

      if ( err ) {
        passed = false;
        console.error( "%sError: %s in %s:%d:%d",
                       err.type, err.message, err.filename, err.line, err.column );
        cb();
        return;
      }

      checkCSSFile( cssFile, lessFile );
      cb();
    });
  }, 1);

  q.drain = function() {
    callback();
  };

  q.push( files );
}

function checkJS() {
  var dirs = [ "*.js", "lib/", "public/src/", "public/templates/", "routes/", "test/" ];

  echo( "# Linting JS files" );
  dirs.forEach( function( value ) {
    echo( "## `" + value + "`" );
  });

  // Get all js and json files in dirs
  var files = dirs.join( " " );

  passed = !exec( JSLINT + " " + files + " --extra-ext json" ).code && passed;
}

var desc = {
  check: "Lint CSS, HTML, and JS",
  deploy: "Build Butter suitable for production",
  server: "Run the development server"
};

target.all = function() {
  echo("Please specify a target. Available targets:");
  Object.keys(target).sort().filter(function(t) {
    return t !== "all";
  }).forEach(function(t) {
    echo("  " + t + " - " + desc[t]);
  });
};

function checkHTML( callback ) {
  // Poor-man's HTML Doc vs. Fragment check
  function isHTMLFragment( filename ) {
    return !( /<html[^>]*\>/m ).test( cat( filename ) );
  }

  // List of errors/warnings to ignore, some with a conditional
  // to only ignore when some condition is true.
  var ignoreList = [
    {
      // Don't warn on valid docs
      text: "The document is valid HTML5 + ARIA + SVG 1.1 + MathML 2.0 (subject to the utter previewness of this service)."
    },
    {
      text: "Start tag seen without seeing a doctype first. Expected “<!DOCTYPE html>”.",
      when: isHTMLFragment
    },
    {
      text: "Element “head” is missing a required instance of child element “title”.",
      when: isHTMLFragment
    },
    {
      text: "Bad value “X-UA-Compatible” for attribute “http-equiv” on element “meta”."
    },
    {
      text: "Warning: The character encoding of the document was not declared."
    },
    {
      text: "Attribute “mozallowfullscreen” not allowed on element “iframe” at this point."
    },
    {
      text: "Attribute “webkitallowfullscreen” not allowed on element “iframe” at this point."
    },
    {
      text: "Attribute “allowfullscreen” not allowed on element “iframe” at this point."
    },
    {
      // Let <style> be in fragments.
      text: "Element “style” not allowed as child of element “body” in this context. (Suppressing further errors from this subtree.)",
      when: isHTMLFragment
    },
    {
      // Let <li> be in fragments.
      text: "Element “li” not allowed as child of element “body” in this context. (Suppressing further errors from this subtree.)",
      when: isHTMLFragment
    }
  ];

  echo( "" );
  echo( "# Linting HTML Files" );

  var q = async.queue( function( htmlFile, cb ) {
    html5lint( cat( htmlFile ), function( err, messages ) {
      echo( "## " + htmlFile );
      messages.messages.forEach( function( msg ) {
        var ignored = ignoreList.some( function( ignore ) {
          return ignore.text === msg.message && ( !ignore.when || ( ignore.when && ignore.when( htmlFile ) ) );
        });

        if ( !ignored ) {
          console.log( "Error: %s in %s:%d:%d", msg.message, htmlFile, msg.lastLine, msg.lastColumn );
        }
      });

      cb();
    });
  });

  q.drain = function() {
    callback();
  };

  q.push( find( "public/" ).filter( function( file ) {
    return file.match( /\.html$/ ) && !file.match( /^public\/test/ ) && !file.match( /^public\/external/ );
  }));
}

target.check = function() {
  async.series([
    function( callback ) {
      checkJS();
      callback();
    },
    function( callback ) {
      checkCSS( callback );
    },
    function( callback ) {
      checkHTML( callback );
    },
    function( callback ) {
      exit( passed ? 0 : 1 );
      callback();
    }
  ]);
};

function stampVersion( version, filename ){
  // Stamp embed.version with supplied version, or git info
  version = version || gitDescribe( "." );
  sed( "-i", /@VERSION@/g, version, filename );
}

function buildJS( version, compress ){
  var doCompress = compress ? "" : "optimize=none";
  var result = "";

  echo( "" );
  echo( "# Optimizing JS Files" );

  echo( "## public/src/butter.js" );
  result = exec(RJS + " -o tools/build-butter.js " + doCompress, {silent: true});
  if (!!result.code) {
    echo(result.output);
  }
  stampVersion( version, "dist/public/src/butter.js" );

  echo( "## public/src/embed.js" );
  result = exec(RJS + " -o tools/build-embed.js " + doCompress, {silent: true});
  if (!!result.code) {
    echo(result.output);
  }
  stampVersion( version, "dist/public/src/embed.js" );

  echo( "## public/src/webmakernav.js" );
  result = exec(RJS + " -o tools/build-webmakernav.js " + doCompress, {silent: true});
  if (!!result.code) {
    echo(result.output);
  }
}

target.server = function() {
  echo("### Serving butter");

  require( "./server.js" );
};

target.deploy = function(){
  echo("### Making deployable versions of butter, embed, popcorn, etc. in dist/ (use UNMINIFIED=1 for unminified)");

  // To get unminified butter.js, use the UNMINIFIED env variable:
  // $ UNMINIFIED=1 node make deploy
  var compress = env.UNMINIFIED !== "1",
      version = env.VERSION;

  rm( "-fr" , DIST_DIR );
  mkdir( "-p" , DIST_DIR );

  buildJS( version, compress );

  // Copy server assets
  cp( "-R", [
    "README.md",
    "lib",
    "package.json",
    "routes",
    "server.js",
    "views"
  ], "dist/");

  // Selectively copy things from public/
  // We don't need js files from external/ and src/ because they're built into
  // butter with requirejs or copied selectively below.
  find( "public/" ).filter(function( path ) {
    return !path.match( /^public\/external/ ) &&
           !path.match( /^public\/src/ ) &&
           !path.match( /^public\/test/ );
  }).forEach(function( path ) {
    if ( test( "-d", path ) ) {
      mkdir( "-p", "dist/" + path );
    } else if ( test( "-f", path ) ) {
      cp( path, "dist/" + path );
    }
  });

  // Bug #3357 - Add a Popcorn() shim for projects published <v1.0.19
  mkdir( "-p", "dist/public/external/popcorn-js/" );
  cp( "tools/oldprojectshim.js", "dist/public/external/popcorn-js/popcorn.js" );

  // We host our own version of the stamen map tile script, copy that over.
  mkdir( "-p", "dist/public/external/stamen/" );
  cp( "public/external/stamen/tile.stamen-1.2.0.js", "dist/public/external/stamen" );

  // Copy RPM spec files and stamp with version
  var rpmVersion = ( version ? version : gitDescribe( "." ) ).replace( /-/g, "_" );
  cp( "tools/rpmspec/*", DIST_DIR );
  stampVersion( rpmVersion, "dist/butter.spec" );

  // Add a rev.txt file that's web-accessible
  gitDescribe( "." ).to("dist/public/rev.txt");

  // Create a tar archive
  var tarName = "butter-" + rpmVersion + ".tar.bz2";
  exec( "tar -cjf '" + tarName + "' dist" );
  mv( tarName, "dist" );

  // It's important to use the production config
  echo( "" );
  echo( "Run cornfield with `NODE_ENV=production node server.js`" );
};
