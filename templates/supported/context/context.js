/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */
document.addEventListener( "DOMContentLoaded", function( e ){

  Butter({
    
    config: "complete-config.json",
    ready: function( butter ){
      var media = butter.media[ 0 ];

      function start(){
        var track = media.addTrack( "Track1" );
        media.addTrack();
        media.addTrack();

        var event = track.addTrackEvent({
          type: "text",
          popcornOptions: {
            start: 0,
            end: 3,
            text: "test",
            target: "Box1"
          }
        });

        butter.tracks[ 2 ].addTrackEvent({
          type: "text",
          popcornOptions: {
            start: 1,
            end: 2,
            target: "Box2"
        }
        });
      }

      media.onReady( start );
      
    }
  }); //Butter
}, false );
