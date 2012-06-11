#!/usr/bin/env node

var JSLINT = './node_modules/jshint/bin/hint',
    CSSLINT = './node_modules/csslint/cli.js',
    RJS    = './node_modules/requirejs/bin/r.js',
    STYLUS = './node_modules/stylus/bin/stylus',
    DOX    = './tools/dox.py',
    DIST_DIR = 'dist',
    SRC_DIR = 'src',
    CSS_DIR = 'css',
    TEMPLATES_DIR = 'templates',
    DIALOGS_DIR = 'dialogs',
    DOCS_DIR = 'docs',
    EDITORS_DIR = 'editors',
    PACKAGE_NAME = 'butter'
    SLICE = Array.prototype.slice;

require('shelljs/make');


function checkCSS() {
  echo('### Linting CSS files');

  var dirs = SLICE.call( arguments ).join( ' ' );

  // see cli.js --list-rules.
  var warnings = [
//    "important",
//    "adjoining-classes",
//    "duplicate-background-images",
//    "qualified-headings",
    "fallback-colors",
//    "empty-rules",
//    "shorthand",
//    "overqualified-elements",
//    "import",
    "regex-selectors",
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
    "floats",
    "vendor-prefix"
  ].join(",");

  exec(CSSLINT + ' --warnings=' + warnings +
                 ' --errors=' + errors +
                 ' --quiet --format=compact' +
                 ' ' + dirs);
}

function checkJS(){
  // Takes a string or an array of strings referring to directories.
  echo('### Linting JS files');

  var dirs = SLICE.call( arguments );

  var files = find( dirs ).filter( function( file ) {
        return file.match(/\.js$/);
      }).join(' ');

  exec(JSLINT + ' ' + files + ' --show-non-errors');
}

target.all = function() {
  target.submodules();
  target.check();
  target.build();
};

target.clean = function() {
  rm('-fr', DIST_DIR);
};

target.dist = function() {
  mkdir('-p', DIST_DIR);
};

target.submodules = function() {
  echo('### Updating git submodules');

  exec('git submodule update --init --recursive');
};

target.docs = function() {
  echo('### Creating documentation from src...');
  mkdir('-p', DOCS_DIR);

  var files = find( SRC_DIR ).filter( function( file ) {
    return file.match(/\.js$/);
  });

  var docTypes = [
    'md'
  ];

  for (var i = files.length - 1; i >= 0; i--) {
    echo('### Processing documentation for ' + files[i]);
    for (var j = docTypes.length - 1; j >= 0; j--) {
      var newFileName = DOCS_DIR + '/' + files[i].substring(4).replace(/\//g, '-').replace(/\.js$/, '.' + docTypes[j]),
          command = 'python ' + DOX + ' -t ' + docTypes[j] + ' -o '+ newFileName + ' -i ' + files[i];
      exec(command);
    };
  };
};

target.check = function() {
  checkJS( SRC_DIR, EDITORS_DIR );
  checkCSS( CSS_DIR, DIALOGS_DIR, EDITORS_DIR );
};

target['check-templates'] = function() {
  checkJS( TEMPLATES_DIR );
  checkCSS( TEMPLATES_DIR );
};

target['check-css'] = function( dirs ) {
  checkCSS( CSS_DIR, DIALOGS_DIR, EDITORS_DIR );
};

target['check-lint'] = function( dir ) {
  checkJS( SRC_DIR, EDITORS_DIR );
};

target.build = function() {
  echo('### Building butter');

  target.clean();
  target.dist();

  exec(RJS + ' -o tools/build.js');
  exec(RJS + ' -o tools/build.optimized.js');

  // Stamp Butter.version with the git commit sha we are using
  var version = exec('git describe',
                     {silent:true}).output.replace(/\r?\n/m, "");
  sed('-i', '@VERSION@', version, 'dist/butter.js');
  sed('-i', '@VERSION@', version, 'dist/butter.min.js');

  exec(STYLUS + ' css');
  cp('css/*.css', DIST_DIR);
};

target.server = function() {
  echo('### Serving butter');

  cd('cornfield');
  exec('node app.js', { async: true });
};

target.package = function() {
  echo('### Making Butter Package');

  target.build();

  cp('-R', 'resources', DIST_DIR);
  cp('-R', 'dialogs', DIST_DIR);
  cp('-R', 'editors', DIST_DIR);
  cp('-R', 'templates', DIST_DIR);

  echo('### Creating butter.zip');
  cd(DIST_DIR)
  exec('zip -r ' + PACKAGE_NAME + '.zip ' + ls('.').join(' '));
};

target.beautify = function( a ) {
  echo('### Beautifying butter');
  cd('tools')
  exec('./beautify.sh');
};

target.test = function() {
  var unbeautified = [ "if.js", "for.js", "while.js", "array.js", "function.js", "object.js", "comments.js", "eolspace.js" ],
      beautified = [ "if.expected.js", "for.expected.js", "while.expected.js", "array.expected.js", "function.expected.js", "object.expected.js", "comments.expected.js", "eolspace.expected.js" ],
      result;

  echo('### Testing Beautifier');
  for( var i = 0, l = unbeautified.length; i < l; i++ ) {
    result = exec('bash test/beautifier/test.sh ' + unbeautified[ i ] + ' ' + beautified[ i ]);
    rm('tmp.txt');
    // checking against a length of 1 because if the output is empty a newline character gets returned
    if( result.output.length === 1 ) {
      echo(unbeautified[ i ] + ' was beautified correctly');
    } else {
      echo(unbeautified[ i ] + ' did not beautify correctly');
    }
  }
};
