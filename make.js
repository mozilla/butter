/*global cat,echo,exec,exit,find,target */

var async = require( "async" ),
    path = require( "path" ),
    normalize = function( p ){ return path.normalize( p ); },
    // Make Windows happy, use `node <path>`
    nodeExec = function( p ){ return 'node "' + p + '"'; },

    JSLINT = nodeExec( normalize( "./node_modules/jshint/bin/jshint" ) ),
    html5lint = require( "html5-lint" ),

    // Global var for exit code
    passed = true;

require("shelljs/make");

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

target.server = function() {
  echo("### Serving butter");

  require( "./server.js" );
};
