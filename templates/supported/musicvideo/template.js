/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */
document.addEventListener( "DOMContentLoaded", function( e ){

  Butter({
    config: "config.json",
    ready: function( butter ){
      var media = butter.media[ 0 ];

      function start(){
        var track1 = media.addTrack( "Track1" ),
            track2 = media.addTrack();

        track1.addTrackEvent({
          type: "text",
          popcornOptions: {
            start: 0,
            end: 3,
            text: "Music video",
            target: "Title"
          }
        });
        
        track1.addTrackEvent({
          type: "text",
          popcornOptions: {
            start: 4,
            end: 9,
            text: "Cool!",
            target: "Title"
           }
        });
           
        track2.addTrackEvent({
          type: "lastfm",
          popcornOptions: {
            start: 1,
            end: 6,
            artist: "mother mother",
            apikey: "30ac38340e8be75f9268727cb4526b3d",
            target: "Area1"
           }
        });
         
        track1.addTrackEvent({
          type: "flickr",
          popcornOptions: {
            start: 6,
            end: 9 ,
            height: 120,
            width: 120,
            tags: "mothermother",
            numberofimages: 10,
            target: "Area1"
          }
        });
      }

      media.onReady( start );

    }
  }); //Butter
}, false );
