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
          type: "image2",
          popcornOptions: {
            start: 0,
            end: 2,
            target: "sidebar",
            src: "http://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Persian_Cat_(kitten).jpg/220px-Persian_Cat_(kitten).jpg",
            href: "http://www.google.com"
          }
        });

        butter.tracks[ 1 ].addTrackEvent({ 
          type: "image2",
          popcornOptions: {
            start: 0,
            end: 2,
            width: "400px",
            height: "200px",
            top: "30px",
            left: "70px",
            target: "video-overlay"
          }
        });

        butter.tracks[ 2 ].addTrackEvent({ 
          type: "text",
          popcornOptions: {
            start: 0,
            end: 2,
            target: "sidebar",
            text: "Bloopy bloop",
          }
        });

      }

      window.butter = butter;
      media.onReady( start );

      
    } 
  }); //Butter
}, false );
