/*global Butter*/
document.addEventListener( "DOMContentLoaded", function( e ){

  Butter({
    ready: function( butter ){
      var media = butter.currentMedia;

      function start(){
        media.addTrack( "Track1" );
        media.addTrack( "Track" + Math.random() );
        media.addTrack( "Track" + Math.random() );

        butter.tracks[ 0 ].addTrackEvent({
          type: "text",
          popcornOptions: {
            start: 0,
            end: 3,
            text: "test",
            target: "Area1"
          }
        });

        butter.tracks[ 2 ].addTrackEvent({
          type: "text",
          popcornOptions: {
            start: 1,
            end: 2,
            target: "Area2"
          }
        });

      }

      media.onReady( start );
    }
  }); //Butter
}, false );
