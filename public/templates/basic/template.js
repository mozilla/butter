/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

( function( Butter, EditorHelper ) {
  document.addEventListener( "DOMContentLoaded", function() {
    Butter.init({
      config: "config.json",
      ready: function( butter ) {
        var script;
        EditorHelper.init( butter );
        script = document.createElement( "script" );
        script.src = "//www.mozilla.org/tabzilla/media/js/tabzilla.js";
        document.body.appendChild( script );

        butter.listen( "mediaready", function mediaReady() {
          butter.unlisten( "mediaready", mediaReady );
          document.querySelector( "#embed-wrapper" ).classList.remove( "faded" );
          document.querySelector( ".loading-message" ).classList.remove( "show-global" );
        });
      }
    });
  }, false );
}( window.Butter, window.EditorHelper ) );
