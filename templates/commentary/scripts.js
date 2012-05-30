document.addEventListener( "DOMContentLoaded", function( e ){

  Butter({
    config: "config.json",
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
            end: 1,
            text: "test",
            target: "Area1"
          }
        });

        butter.tracks[ 0 ].addTrackEvent({ 
          type: "text",
          popcornOptions: {
            start: 1,
            end: 2,
            text: "Test",   
            target: "Area1"
          }
        });
    
        butter.tracks[ 0 ].addTrackEvent({ 
          type: "webpage",
          popcornOptions: {
            start:2,
            end: 3,
            id:"webpages-a",
            src:"http://popcornjs.org/",
            target: "Area1"
          }
        });

        butter.tracks[ 0 ].addTrackEvent({ 
          type: "wikipedia",
          popcornOptions: {
            start:3,
            end: 4,
            title: "Cape Town yo",
            src:"http://en.wikipedia.org/wiki/Cape_Town",
            target: "Area1"
          }
        });


      }

      media.onReady( start );
      
    } 
  }); //Butter
}, false );
