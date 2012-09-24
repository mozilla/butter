document.addEventListener( "DOMContentLoaded", function( e ){

  Butter.init({
    config: "default-config.json",
    ready: function( butter ){
      var media = butter.media[ 0 ];

      function start(){
        var track = media.addTrack( "Track1" );
        media.addTrack( "Track" + Math.random() );
        media.addTrack( "Track" + Math.random() );

        var event = track.addTrackEvent({
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
            text: "test",
            target: "Area2"
          }
        });

      }

      media.onReady( start );

    }
  }); //Butter
}, false );
