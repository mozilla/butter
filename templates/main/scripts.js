document.addEventListener( "DOMContentLoaded", function( e ){

  Butter({
    config: "config.json",
    ready: function( butter ){
      var media = butter.media[ 0 ];

      function start(){
        media.addTrack( "Track1" );
        media.addTrack( "Track2" );
        media.addTrack( "Track3" );

        butter.tracks[ 0 ].addTrackEvent({ 
          type: "text",
          popcornOptions: {
            start: 0,
            end: 2,
            text: "Test",   
            target: "sidebar"
          }
        });

      }

      media.onReady( start );
      
    } 
  }); //Butter
}, false );
