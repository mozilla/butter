#!/usr/bin/env node

var JSLINT = './node_modules/jshint/bin/hint',
    RJS    = './node_modules/requirejs/bin/r.js';

require('shelljs/make');

target.all = function() {
  target.submodules();
  target.check();
  target.build();
};

target.submodules = function() {
  echo('### Updating git submodules');

  exec('git submodule update --init --recursive');
};

target.check = function() {
  target['check-lint']();
};

target['check-lint'] = function() {
  echo('### Linting JS files');

  var files = find('src').filter( function( file ) {
    return file.match(/\.js$/);
  }).join(" ");

  exec(JSLINT + ' ' + files);
};

target.build = function() {
  echo('### Building butter');

  rm('-rf', 'dist');
  mkdir('-p', 'dist');
  exec(RJS + ' -o tools/build.js');
  exec(RJS + ' -o tools/build.optimized.js');
};

target.server = function() {
  echo('### Serving butter');

  cd('cornfield');
  exec('node app.js', { async: true });
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
