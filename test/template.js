document.addEventListener( "DOMContentLoaded", function( e ){

  Butter({
    config: "../config/default.conf",
    ready: function( butter ){
      var media = butter.media[ 0 ];

      var count = 0;
      media.listen( "mediaready", function( e ){

        var track = media.addTrack( "Track1" );
        media.addTrack( "Track" + Math.random() );
        media.addTrack( "Track" + Math.random() );

        butter.plugin.add([
          { name: "footnote", type: "footnote", path: "../external/popcorn-js/plugins/footnote/popcorn.footnote.js" },
          { name: "attribution", type: "attribution", path: "../external/popcorn-js/plugins/attribution/popcorn.attribution.js" },
          { name: "image", type: "image", path: "../external/popcorn-js/plugins/image/popcorn.image.js" }], function( e ) {

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

        });

      });
      window.butter = butter;
    } 
  }); //Butter
}, false );
