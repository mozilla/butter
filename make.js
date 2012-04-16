#!/usr/bin/env node

var JSLINT = './node_modules/jshint/bin/hint',
    RJS    = './node_modules/requirejs/bin/r.js',
    STYLUS = './node_modules/stylus/bin/stylus',
    DIST_DIR = 'dist',
    PACKAGE_NAME = 'butter';

require('shelljs/make');

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

  target.clean();
  target.dist();

  exec(RJS + ' -o tools/build.js');
  exec(RJS + ' -o tools/build.optimized.js');

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
  cp('-R', 'config', DIST_DIR);
  cp('-R', 'editors', DIST_DIR);
  cp('-R', 'templates', DIST_DIR);

  echo('### Creating butter.zip');
  cd(DIST_DIR)
  exec('zip -r ' + PACKAGE_NAME + '.zip ' + ls('.').join(' '));
};
