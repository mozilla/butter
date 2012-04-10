document.addEventListener( "DOMContentLoaded", function( e ){
  Butter({
    config: "pop.conf",
    ready: function( butter ){
      var media = butter.media[ 0 ];

      function start(){
        var track = media.addTrack( "Track1" );
        media.addTrack( "Track" + Math.random() );
        media.addTrack( "Track" + Math.random() );
      }

      media.onReady( start );
      
      window.butter = butter;
    } 
  }); //Butter
}, false );
