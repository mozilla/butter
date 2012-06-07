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

        media.popcorn.popcorn.on("play", function(){
          document.getElementById("logo").classList.add("on");
        });
         media.popcorn.popcorn.on("pause", function(){
          document.getElementById("logo").classList.remove("on");
        });

      } //start

      media.onReady( start );

    }
  }); //Butter

}, false );
