document.addEventListener( "DOMContentLoaded", function( e ){

  Butter({
    config: "../config/basic.conf",
    ready: function( butter ){
      var media = butter.media[ 0 ];

      function start(){
        var track = media.addTrack( "Track1" );
        media.addTrack( "Track" + Math.random() );
        media.addTrack( "Track" + Math.random() );

        var event = track.addTrackEvent({
          type: "footnote",
          popcornOptions: {
            start: 0,
            end: 2,
            text: "Play around!",
            target: "Area1"
          }
        });
        
         butter.tracks[ 0 ].addTrackEvent({ 
            type: "footnote",
            popcornOptions: {
              start: 2,
              end: 5,
              text: "Have some fun with Popcorn!",
              target: "Area1"
            }
          });

        butter.tracks[ 1 ].addTrackEvent({ 
          type: "image",
          popcornOptions: {
            start: 1,
            end: 2,
            src: "http://www.raiseakitten.com/wp-content/uploads/2012/03/kitten.jpg",
            target: "Area2"
          }
          
        });
        
         butter.tracks[ 2 ].addTrackEvent({ 
            type: "webpage",
            popcornOptions: {
              start: 3,
              end: 5,
              src:"http://www.popcornjs.org",
              target: "Area2"
            }
          });
          butter.tracks[ 2 ].addTrackEvent({ 
              type: "wikipedia",
              popcornOptions: {
                start: 5,
                end: 6,
                src: "http://en.wikipedia.org/wiki/Cape_Town",
                title: "Cape Town",
                target: "Area2"
              }
            });
      }

      media.onReady( start );
      
      window.butter = butter;
    } 
  }); //Butter
}, false );
