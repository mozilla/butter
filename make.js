#!/usr/bin/env node

var JSLINT = './node_modules/jshint/bin/hint',
    RJS    = './node_modules/requirejs/bin/r.js',
    STYLUS = './node_modules/stylus/bin/stylus';

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

  exec(STYLUS + ' css');
  cp('css/*.css', 'dist');
};

target.server = function() {
  echo('### Serving butter');

  cd('cornfield');
  exec('node app.js', { async: true });
};
