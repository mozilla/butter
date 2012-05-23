document.addEventListener( "DOMContentLoaded", function( e ){

  Butter({
    config: 'ui-config.json',
    ready: function( butter ){
      var media = butter.media[ 0 ];

      function start(){
        butterReady = true;

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
          type: "footnote",
          popcornOptions: {
            start: 1,
            end: 2,
            target: "Area2"
          }
        });

        /**
         * QUnit Tests for UI go here.
         **/
        test( "window.SpecialPowers", function(){
          ok( "SpecialPowers" in window, "SpecialPowers extension is installed." );
        });

      }

      media.onReady( start );
    }
  });

}, false );
