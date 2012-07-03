#!/usr/bin/env node

var JSLINT = './node_modules/jshint/bin/hint',
    CSSLINT = './node_modules/csslint/cli.js',
    UGLIFY = './node_modules/uglify-js/bin/uglifyjs',
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
    DEFAULT_CONFIG = './src/default-config',
    BUTTERED_POPCORN = DIST_DIR + '/buttered-popcorn.js',
    BUTTERED_POPCORN_MIN = DIST_DIR + '/buttered-popcorn.min.js',
    PACKAGE_NAME = 'butter',
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

  // Get all js and json files in dirs
  var files = "";
  [ /\.js$/, /\.json$/ ].forEach( function( regexp ){
    files += find( dirs ).filter( function( file ) {
        return file.match( regexp );
      }).join(' ') + ' ';
  });

  // jshint with non-errors plus linting of json files
  exec(JSLINT + ' ' + files + ' --show-non-errors --extra-ext json');
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

function build( version ){
  echo('### Building butter');

  target.clean();
  target.dist();

  exec(RJS + ' -o tools/build.js');
  exec(RJS + ' -o tools/build.optimized.js');

  // Stamp Butter.version with supplied version, or git info
  if( !version ){
    version = exec('git describe',
                   {silent:true}).output.replace(/\r?\n/m, "");
  }

  sed('-i', '@VERSION@', version, 'dist/butter.js');
  sed('-i', '@VERSION@', version, 'dist/butter.min.js');

  exec(STYLUS + ' css');
  cp('css/*.css', DIST_DIR);
}

target.build = function(){
  build();
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
  cd(DIST_DIR);
  exec('zip -r ' + PACKAGE_NAME + '.zip ' + ls('.').join(' '));
};

target['buttered-popcorn'] = function(){
  echo('### Making Combined Popcorn for Butter: Buttered Popcorn');

  var defaultConfig = require( DEFAULT_CONFIG ),
      popcornDir = defaultConfig.dirs['popcorn-js'].replace( '{{baseDir}}', './' ),
      players = defaultConfig.player.players,
      plugins = defaultConfig.plugin.plugins,
      popcornFiles = [];

  // Popcorn License Header
  popcornFiles.push( popcornDir + '/LICENSE_HEADER' );

  // classList shim
  popcornFiles.push( './tools/classlist-shim.js' );

  // popcorn IE8 shim
  popcornFiles.push( popcornDir + '/ie8/popcorn.ie8.js' );

  // popcorn.js
  popcornFiles.push( popcornDir + '/popcorn.js' );

  // plugins
  plugins.forEach( function( plugin ){
    popcornFiles.push( plugin.path.replace( '{{baseDir}}', './' ) );
  });

  // module for baseplayer
  popcornFiles.push( popcornDir + '/modules/player/popcorn.player.js' );

  // players
  players.forEach( function( player ){
    popcornFiles.push( player.path.replace( '{{baseDir}}', './' ) );
  });

  // Stamp Popcorn.version with the git commit sha we are using
  var cwd = pwd();
  cd( popcornDir );
  var popcornVersion = exec('git describe',
                       {silent:true}).output.replace(/\r?\n/m, "");
  cd( cwd );

  // Write out dist/buttered-popcorn.js
  cat( popcornFiles ).to( BUTTERED_POPCORN );
  sed('-i', '@VERSION', popcornVersion, BUTTERED_POPCORN);

  // Write out dist/buttered-popcorn.min.js
  exec( UGLIFY + ' --output ' + BUTTERED_POPCORN_MIN + ' ' + BUTTERED_POPCORN );
};

target.release = function() {
  echo('### Making Butter Release');

  // To pass a release version number, use:
  // $ VERSION=0.5 node make release
  var version = env['VERSION'];

  if( !version ){
    console.log( "ERROR: Must provide a version when building a release: VERSION=XXX node make release" );
    return;
  }

  build( version );

  // Build buttered-popcorn.js
  target['buttered-popcorn']();

  // Copy over templates and other resources
  cp('-R', 'resources', DIST_DIR);
  cp('-R', 'dialogs', DIST_DIR);
  cp('-R', 'editors', DIST_DIR);
  cp('-R', 'templates', DIST_DIR);

  echo('### Creating butter.zip');
  cd(DIST_DIR);
  exec('zip -r ' + PACKAGE_NAME + '.zip ' + ls('.').join(' '));
};

target.beautify = function( a ) {
  echo('### Beautifying butter');
  cd('tools');
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

target.storycamp = function(){
  echo('### Making single file version of Butter + Popcorn (use UNMINIFIED=1 for unminified)');

  // To get unminified butter.js, use the UNMINIFIED env variable:
  // $ UNMINIFIED=1 node make storycamp
  var unminified = env['UNMINIFIED'] === "1";

  build( 'storycamp' );
  target['buttered-popcorn']();

  var storyCamp = 'butter.js',
      storyCampMin = 'butter.min.js';

  function makeButterJS( keepMe, deleteMe ){
    echo( '### Cleaning temp files' );
    cd( DIST_DIR );
    rm( '-f', deleteMe );

    // Mirror layout in butter/ so templates are happy, renaming to src/butter.js
    mkdir( 'src' );
    mv( keepMe, './src/butter.js' );
  }

  var cwd = pwd();

  // Depending on whether we want minified source, keep one, delete one.
  if( unminified ){
    makeButterJS( storyCamp, storyCampMin );
  } else {
    // Write out dist/storycamp-butter.min.js
    exec( UGLIFY + ' --output ' + DIST_DIR + '/' + storyCampMin + ' ' + DIST_DIR + '/' + storyCamp );
    makeButterJS( storyCampMin, storyCamp );
  }

  // Move css files into dist/css
  mkdir('css');
  mv('*.css', './css');

  // Copy other assets over
  cd(cwd);
  cp('-R', 'resources', DIST_DIR);
  cp('-R', 'dialogs', DIST_DIR);
  cp('-R', 'editors', DIST_DIR);
  cp('-R', 'templates', DIST_DIR);
  cp('-R', 'cornfield', DIST_DIR);

  // Copy the popcorn test videos over
  mkdir('-p', './dist/external/popcorn-js/test');
  cp('external/popcorn-js/test/trailer.*', './dist/external/popcorn-js/test');

  // Copy the rest of the popcorn plugins over in case templates look for them
  mkdir('-p', './dist/external/popcorn-js/plugins');
  cp('-R', 'external/popcorn-js/plugins/*', './dist/external/popcorn-js/plugins');

  // Export will need a version of popcorn.js where the templates expect it
  // at dist/external/popcorn-js/popcorn.js
  cd( DIST_DIR );
  if( unminified ){
    mv( 'buttered-popcorn.js', './external/popcorn-js/popcorn.js' );
    rm( '-f', 'buttered-popcorn.min.js' );
  } else {
    mv( 'buttered-popcorn.min.js', './external/popcorn-js/popcorn.js' );
    rm( '-f', 'buttered-popcorn.js' );
  }
};
