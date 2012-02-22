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
            { name: "wikipedia", type: "wikipedia", path: "../external/popcorn-js/plugins/wikipedia/popcorn.wikipedia.js" },
            { name: "subtitle", type: "subtitle", path: "../external/popcorn-js/plugins/subtitle/popcorn.subtitle.js" }
            ], function( e ) {

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
      });
      window.butter = butter;
    } 
  }); //Butter
}, false );
