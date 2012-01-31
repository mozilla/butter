document.addEventListener( "DOMContentLoaded", function( e ){

  document.getElementById( "removePlugin" ).addEventListener( "click", function( e ) {
    butter.plugin.remove( document.getElementById( "pluginName" ).value );
  }, false);

  Butter({
    modules: {
      preview: {
      },
      plugin: {
        target: "plugin-tray",
        pattern: '<li class="$type_tool"><a href="#" title="$type"><span></span>$type</a></li>'
      },
      track: {
        target: "target-div"
      },
      trackliner: {
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
          butter.plugin.add({ name: "footnote", type: "footnote", path: "../external/popcorn-js/plugins/footnote/popcorn.footnote.js" });
          butter.tracks[ 0 ].addTrackEvent({ name: "TrackEvent 1", type: "notfootnote" });
          butter.tracks[ 0 ].addTrackEvent({ name: "TrackEvent 1", type: "footnote" });
          if ( count === 0 ) {
            butter.track.Editor( track );
            count++;
          }
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
          event.update({
            start: 2,
            end: 5 
          });
        });
      });
      window.butter = butter;
    } 
  }); //Butter
}, false );
