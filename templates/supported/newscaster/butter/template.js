document.addEventListener( "DOMContentLoaded", function( e ){

  Butter({
    config: "butter/config.json",
    ready: function( butter ){
      var media = butter.media[ 0 ];

      function start(){
        media.addTrack( "Track1" );
        media.addTrack( "Track" + Math.random() );
        media.addTrack( "Track" + Math.random() );

        butter.tracks[0].addTrackEvent({
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
      window.butter = butter;

    }
  }); //Butter

}, false );
