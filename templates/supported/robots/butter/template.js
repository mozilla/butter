document.addEventListener( "DOMContentLoaded", function( e ){

  Butter({
    config: "butter/config.json",
    ready: function( butter ){
      var media = butter.media[ 0 ],
          popcorn = butter.media[ 0 ].popcorn.popcorn;

      function start(){
        media.addTrack( "Track1" );
        media.addTrack();
        media.addTrack();

        butter.tracks[0].addTrackEvent({
          type: "titles",
          popcornOptions: {
            start: 0,
            end: 1,
            text: "Robots invade...",
            target: "video-overlay"
          }
        });

      } //start

      media.onReady( start );

      popcorn.on( "play", function(){
        $(".popcorn-effect-rumble-play").addClass(".popcorn-effect-rumble");
      });
      popcorn.on( "pause", function(){
        $(".popcorn-effect-rumble-play").removeClass(".popcorn-effect-rumble");
      });

    }
  }); //Butter

}, false );
