document.addEventListener( "DOMContentLoaded", function( e ){
  Butter({
    modules: {
      preview: {
      },
      timeline: {
      }
    },
    ready: function( butter ){
      butter.preview.prepare(function() {
        var media = butter.media[ 0 ];

        var count = 0;
        media.listen( "mediaready", function( e ){
          var track = media.addTrack( "Track1" ),
              event = track.addTrackEvent({
                type: "text",
                popcornOptions: {
                  start: 1,
                  end: 9,
                  text: "test"
                }
              });
          event.update({
            start: 2,
            end: 5 
          });
        });
      });
    } 
  }); //Butter
}, false );
