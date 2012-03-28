#!/usr/bin/env node

var JSLINT = './node_modules/jshint/bin/hint',
    RJS    = './node_modules/requirejs/bin/r.js';

require('shelljs/make');

target.all = function() {
  target.submodules();
  target.lint();
}

target.submodules = function() {
  echo('### Updating git submodules');

  exec('git submodule update --init --recursive');
}

target.lint = function() {
  echo('### Linting JS files');

  var files = '';
  for (file in find('src')) {
    if (file.match(/\.js$/)) {
      files = files + file + ' ';
    }
  }

  exec(JSLINT + ' ' + files);
}

target.build = function() {
  echo('### Building butter');

  rm('-rf', 'dist');
  mkdir('-p', 'dist');
  exec(RJS + ' -o tools/build.js');
  exec(RJS + ' -o tools/build.optimized.js');
}

target.server = function() {
  echo('### Serving butter');
  echo('Go to http://localhost:9999 in your web browser');
  echo('Press Ctrl-C to stop');

  exec('python -m SimpleHTTPServer 9999');
}
