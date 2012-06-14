/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

document.addEventListener( "DOMContentLoaded", function( e ) {
  (function( Butter, $ ) {
    Butter({
      config: "butter/config.json",
      ready: function( butter ){
        var media = butter.currentMedia;

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

        function mediaReady() {
          var popcorn = butter.currentMedia.popcorn.popcorn,
              editor = new EditorHelper( butter, popcorn );
        }

        media.onReady( start );
        butter.listen( "mediaready", mediaReady );

      }
    });

  }( window.Butter, window.jQuery ));
}, false );
