document.addEventListener( "DOMContentLoaded", function( e ){

  document.getElementById( "removePlugin" ).addEventListener( "click", function( e ) {
    butter.plugin.remove( document.getElementById( "pluginName" ).value );
  }, false);

  Butter({
    config: "../config/default.conf",
    ready: function( butter ){
      butter.preview.prepare(function() {
        var media = butter.media[ 0 ];

        var count = 0;
        media.listen( "mediaready", function( e ){

          var track = media.addTrack( "Track1" );
          media.addTrack( "Track" + Math.random() );
          media.addTrack( "Track" + Math.random() );
          media.addTrack( "Track" + Math.random() );
          media.addTrack( "Track" + Math.random() );
          media.addTrack( "Track" + Math.random() );
          media.addTrack( "Track" + Math.random() );
          media.addTrack( "Track" + Math.random() );
          media.addTrack( "Track" + Math.random() );
          media.addTrack( "Track" + Math.random() );
          media.addTrack( "Track" + Math.random() );
          media.addTrack( "Track" + Math.random() );
          media.addTrack( "Track" + Math.random() );
          media.addTrack( "Track" + Math.random() );

          butter.plugin.add([
            { name: "footnote", type: "footnote", path: "../external/popcorn-js/plugins/footnote/popcorn.footnote.js" },
            { name: "image", type: "image", path: "../external/popcorn-js/plugins/image/popcorn.image.js" }], function( e ) {

            var event = track.addTrackEvent({
              type: "text",
              popcornOptions: {
                start: 1,
                end: 9,
                text: "test"
              }
            });

            butter.tracks[ 0 ].addTrackEvent({ 
              name: "TrackEvent 1",
              type: "footnote" 
            });
            event.update({
              start: 2,
              end: 5 
            });
          });
        });
      });
      window.butter = butter;
    } 
  }); //Butter
}, false );
