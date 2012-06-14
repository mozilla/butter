/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

document.addEventListener( "DOMContentLoaded", function( e ){
  (function( Butter, EditorHelper ) {
    Butter({
      config: "butter/config.json",
      ready: function( butter ){
        var media = butter.currentMedia,
            popcorn = butter.currentMedia.popcorn.popcorn,
            editor = new EditorHelper( butter, popcorn );

        function start() {

          media.addTrack( "Track1" );
          media.addTrack();
          media.addTrack();

          butter.tracks[ 0 ].addTrackEvent({
            type: "text",
            popcornOptions: {
              start: 0,
              end: 1,
              text: "This is a test.",
              target: "Area1"
            }
          });
        } //start

        media.onReady( start );

      }
    });

  }( window.Butter, window.EditorHelper ));
}, false );
