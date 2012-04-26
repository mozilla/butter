#!/usr/bin/env node

var JSLINT = './node_modules/jshint/bin/hint',
    RJS    = './node_modules/requirejs/bin/r.js',
    BEAUTY = './tools/jsbeautifier.py',
    BEAUTIFIER_TESTS = './test/beautifier/';

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
  var unbeautified = [ "test1.js", "test2.js", "test3.js" ],
      beautified = [ "test1.expected.js", "test2.expected.js", "test3.expected.js" ],
      result,
      expected;

  echo('### Testing Beautifier');
  for( var i = 0, l = unbeautified.length; i < l; i++ ) {
    result = exec('python ' + BEAUTY + ' -s 2 -j --extra-expr-spacing=1 ' + BEAUTIFIER_TESTS + unbeautified[ i ]);
    exec('touch tmp.txt');
    exec('echo ' + result + ' > tmp.txt');
    result = exec('bash tools/regex.sh tmp.txt');
    rm('tmp.txt');
    expected = cat(BEAUTIFIER_TESTS + beautified[ i ]);
    if( result.compare(expected) === 0 ) {
      echo(unbeautified[ i ] + ' was beautified correctly');
    } else {
      echo(unbeautified[ i ] + ' was did not beautify correctly');
      exec('git diff ' + unbeautified[ i ] + ' ' + beautified[ i ]);
    }
  }
};
