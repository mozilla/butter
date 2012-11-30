/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

/*jshint evil: true */

/**
 * In the source case, use document.write to write out the require tag,
 * and load all moduels as distinct scripts for debugging. After a build,
 * all the modules are inlined, so will not use the document.write path.
 * Use has() testing module, since the requirejs optimizer will convert
 * the has test to false, and minification will strip the false code
 * branch. http://requirejs.org/docs/optimization.html#hasjs
 */
(function ( window, document ) {

  // Stub for window.Butter
  if ( !window.Butter ) {
    window.Butter = {
      init: function() {
        if ( this.__waiting ) {
          throw "Butter: can't create more than one instance per document.";
        }
        this.__waiting = arguments;
      }
    };
  }

  // Get the location of the butter source. The last script tag should be the
  // butter source tag since in dev, it will be a blocking script tag, so latest
  // tag is the one for this script.
  var scripts = document.getElementsByTagName( 'script' ),
      path = scripts[scripts.length - 1].src;

  path = path.split( '/' );
  path.pop();
  path = path.join( '/' ) + '/';

  document.write( '<script data-main="' + path + 'config" data-butter-exclude="true" src="' +
                  path + '../external/require/require.js"></' + 'script>' );

}( window, window.document ));
