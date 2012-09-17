/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

( function( Butter, EditorHelper ) {
  document.addEventListener( "DOMContentLoaded", function() {
    Butter({
      config: "default-config.json",
      ready: function( butter ) {
        EditorHelper( butter );
      }
    });
  }, false );
}( window.Butter, window.EditorHelper ) );
