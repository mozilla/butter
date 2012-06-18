/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function( Butter, EditorHelper ) {
  document.addEventListener( "DOMContentLoaded", function(){
    Butter({
      config: "butter/config.json",
      ready: function( butter ){
        var media = butter.currentMedia,
            popcorn = media.popcorn.popcorn;

        EditorHelper( butter, popcorn );

      }
    });
  }, false);
}( window.Butter, window.EditorHelper ));
