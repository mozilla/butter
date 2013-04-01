/*global cat,cd,cp,echo,env,exec,exit,find,mkdir,mv,pwd,rm,sed,target,test */

var async = require( "async" ),
    path = require( "path" ),
    normalize = function( p ){ return path.normalize( p ); },
    // Make Windows happy, use `node <path>`
    nodeExec = function( p ){ return 'node "' + p + '"'; },

    JSLINT = nodeExec( normalize( "./node_modules/jshint/bin/jshint" ) ),
    html5lint = require( "html5-lint" ),
    CSSLINT = nodeExec( normalize( "./node_modules/csslint/cli.js" ) ),
    RJS = nodeExec( normalize( "./node_modules/requirejs/bin/r.js" ) ),
    LESS = nodeExec( normalize( "./node_modules/less/bin/lessc" ) ),

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

// To supress CSS warnings/errors for a particular line, end the line
// with a comment indicating you want CSS Lint to ignore this line's
// error(s).  Here are some examples:
//
//   -webkit-appearance: button; /* csslint-ignore */
//   -webkit-appearance: button; /*csslint-ignore*/
//   -webkit-appearance: button; /* csslint-ignore: This is being done because of iOS ... */
function checkCSSFile( filename, warnings, errors ) {
  var fileLines = cat( filename ).split( /\r?\n/ ),
    ignoreLines = "",
    // Look for: "blah blah blah /* csslint-ignore */" or
    //           "blah blah /*csslint-ignore: this is my reason*/"
    ignoreRegex = /\/\*\s*csslint-ignore[^*]*\*\/$/,
    // Errors look like: "css/butter.ui.css: line 186, col 3, Error..."
    lineRegex = /\: line (\d+),/;

  echo( "## `" + filename + "`" );

  // Build a map of lines to ignore: "|14||27|" means ignore lines 14 and 27
  for( var i=0; i < fileLines.length; i++ ){
    if( ignoreRegex.test( fileLines[ i ] ) ) {
      ignoreLines += "|" + i + "|";
    }
  }

  // Run CSSLint across the file, check for errors/warnings and ignore if
  // they are ones we know about from above.
  exec(CSSLINT +
    " --warnings=" + warnings +
    " --errors=" + errors +
    " --quiet --format=compact" +
    " " + filename, { silent: true } ).output.split( /\r?\n/ )
    .forEach( function( line ) {
      if( !line ) {
        return;
      }

      // Some warnings don't refer to a line, e.g.
      // "css/butter.ui.css: Warning - Too many floats (10)..."
      var matches = line.match( lineRegex ),
        lineNumber = matches ? matches[ 1 ] : null;

      if( !!lineNumber ) {
        if( ignoreLines.indexOf( "|" + lineNumber + "|" ) === -1 ) {
          echo( line );
          passed = false;
        }
      } else {
        echo( line );
        passed = false;
      }
  });
}

function checkCSS() {
  // see cli.js --list-rules.
  var warnings = [
//    "important",
//    "adjoining-classes",
//    "duplicate-background-images",
//    "qualified-headings",
//    "fallback-colors",
//    "empty-rules",
//    "shorthand",
//    "overqualified-elements",
//    "import",
//    "regex-selectors",
//    "rules-count",
//    "font-sizes",
//    "universal-selector",
//    "unqualified-attributes",
    "zero-units"
  ].join(",");

  var errors = [
    "known-properties",
    "compatible-vendor-prefixes",
    "display-property-grouping",
    "duplicate-properties",
    "errors",
    "gradients",
    "font-faces",
    //"floats",
    "vendor-prefix"
  ].join(",");

  echo( "" );
  echo( "# Linting CSS files" );

  find( "public/" ).filter(function( filename ) {
    return filename.match( /\.css$/ ) && !filename.match( /^public\/test/ ) &&
           !filename.match( /^public\/external/ );
  }).forEach(function( filename ) {
    checkCSSFile( filename, warnings, errors );
  });

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
  css: "Build LESS files to CSS",
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

function lessToCSS( options ){
  var BUTTER_CSS_FILE_COMMENT = "/* THIS FILE WAS GENERATED BY A TOOL, DO NOT EDIT */";

  var compress = !!options.compress,
      lessFile = options.lessFile,
      cssFile = options.cssFile;

  echo( "## `" + lessFile + "` => `" + cssFile + "`" + ( compress ? " with compression" : "" ));

  var args = compress ? " --yui-compress " : " ",
  result = exec(LESS + args + lessFile, {silent:true});

  if( result.code === 0 ){
    var css = BUTTER_CSS_FILE_COMMENT + "\n\n" + result.output;
    css.to( cssFile );
  } else {
    echo( result.output );
    passed = false;
  }
}

function buildCSS(compress) {
  echo( "" );
  echo( "# Compiling CSS Files" );

  [
    "public/css/butter.ui",
    "public/css/transitions",
    "public/css/embed",
    "public/css/embed-shell",
    "public/src/ui/webmakernav/webmakernav",
    "public/templates/assets/css/jquery-ui/jquery.ui.butter",
    "public/templates/assets/plugins/twitter/popcorn.twitter",
    "public/templates/assets/plugins/wikipedia/popcorn.wikipedia",
    "public/templates/basic/style"
  ].forEach(function( file ) {
    lessToCSS({
      lessFile: file + ".less",
      cssFile: file + ".css",
      compress: compress
    });
  });
}

target.check = function() {
  async.series([
    function( callback ) {
      checkJS();
      callback();
    },
    function( callback ) {
      checkCSS();
      callback();
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

target.css = function() {
  buildCSS();
};

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

  buildCSS( compress );
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
  // We don't need .less files, since they're built in buildCSS()
  // We don't need js files from external/ and src/ because they're built into
  // butter with requirejs or copied selectively below.
  find( "public/" ).filter(function( path ) {
    return !path.match( /\.less$/ ) &&
           !path.match( /^public\/external/ ) &&
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
