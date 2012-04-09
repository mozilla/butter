document.addEventListener( "DOMContentLoaded", function( e ){

  Butter({
    config: "../config/musicvideo.conf",
    ready: function( butter ){
      var media = butter.media[ 0 ];

      function start(){
        var track = media.addTrack( "Track1" );
        media.addTrack( "Track" + Math.random() ); 

        var event = track.addTrackEvent({
          type: "text",
          popcornOptions: {
            start: 0,
            end: 3,
            text: "Mother Mother - Hayloft",
            target: "Title"
          }
        });
        
         butter.tracks[ 0 ].addTrackEvent({ 
            type: "text",
            popcornOptions: {
               start: 4,
               end: 9,
               text: "  Luxury Wafers Sessions",
               target: "Title"
             }
           });
           
        butter.tracks[ 1 ].addTrackEvent({ 
          type: "lastfm",
          popcornOptions: {
             start: 1  ,
             end: 6,
             artist: "mother mother",
             target: "lastfmdiv",
             apikey: "30ac38340e8be75f9268727cb4526b3d",
             target: "Area1"
           }
         });
         
         butter.tracks[ 1 ].addTrackEvent({
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
      
      window.butter = butter;
    } 
  }); //Butter
}, false );
