/*jshint white: false, strict: false, plusplus: false, evil: true,
  onevar: false, nomen: false */
/*global require: false, document: false, console: false, window: false,
  setTimeout: false */

/**
 * In the source case, use document.write to write out the require tag,
 * and load all moduels as distinct scripts for debugging. After a build,
 * all the modules are inlined, so will not use the document.write path.
 * Use has() testing module, since the requirejs optimizer will convert
 * the has test to false, and minification will strip the false code
 * branch. http://requirejs.org/docs/optimization.html#hasjs
 */
(function () {
    // Stub for has function.
    function has() {
        return true;
    }

    if ( has( 'source-config' ) ) {
        // Get the location of the butter source.
        // The last script tag should be the butter source
        // tag since in dev, it will be a blocking script tag,
        // so latest tag is the one for this script.
        var scripts = document.getElementsByTagName( 'script' ),
        path = scripts[scripts.length - 1].src;
        path = path.split( '/' );
        path.pop();
        path = path.join( '/' ) + '/';

        document.write( '<script data-requirebootstrap="butter.previewer" src="' + path + '../../external/require/require.js"></' + 'script>' );

        document.write('<script data-requirebootstrap="butter.previewer">' + 
          '(function(){' + 
          'var ctx = require.config({ ' + 
            'baseUrl: "' + path + '../",' +
            'context: "butter.previewer",' +
            'paths: {' +
              // Paths are relative to baseUrl; Notice the commas!
            '}' +
          '});' +
          'ctx(["previewer/main"])' + 
          '})()' +
        '</script>');
    }

    var ButterTemplate = function() {
      if ( !ButterTemplate.__waiting ) {
        ButterTemplate.__waiting = [];
      } //if
      ButterTemplate.__waiting.push( arguments );
    }; //ButterTemplate

    if ( !window.ButterTemplate ) {
      window.ButterTemplate = ButterTemplate;
    } //if

}());
