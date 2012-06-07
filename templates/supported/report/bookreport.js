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
            target: "Secondary"
          }
        });

        butter.tracks[ 2 ].addTrackEvent({ 
          type: "text",
          popcornOptions: {
            start: 1,
            end: 2,
            target: "Background"
          }
        });
      }

      media.onReady( start );
      
    } 
  }); //Butter
}, false );
