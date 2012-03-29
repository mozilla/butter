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

  const express = require('express'),
        app = express.createServer();

  app.use(express.static(__dirname));
  app.use(express.directory(__dirname, { icons: true }));

  app.listen(9999, '127.0.0.1', function() {
    var addy = app.address();
    console.log('Server started on http://' + addy.address + ':' + addy.port);
    console.log('Press Ctrl+C to stop');
  });
};
