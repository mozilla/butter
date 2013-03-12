document.addEventListener( "DOMContentLoaded", function( e ){

  Butter.init({
    config: "default-config.json",
    ready: function( butter ){
      var media = butter.media[ 0 ];

      function start(){
        var track = media.addTrack( "Track1" );
        media.addTrack( "Track" + Math.random() );
        media.addTrack( "Track" + Math.random() );

      }

      media.onReady( start );

    }
  }); //Butter
}, false );
