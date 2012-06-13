/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

document.addEventListener( "DOMContentLoaded", function( e ) {
  (function( Butter, $ ) {
    Butter({
      config: "butter/config.json",
      ready: function( butter ){
        var media = butter.media[ 0 ],
            popcorn = butter.media[ 0 ].popcorn.popcorn,
            editor = Butter.editorHelper( butter, popcorn );

        function start(){
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
    }); //Butter

  }( window.Butter, window.jQuery ));
}, false );
