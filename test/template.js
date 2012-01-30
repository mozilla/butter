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
      window.butter = butter;
      butter.preview.prepare(function() {
       
        var media = butter.media[ 0 ];
        console.log( media );
        media.listen( "mediaready", function( e ) {

          butter.plugin.add({ name: "footnote", type: "footnote", path: "../external/popcorn-js/plugins/footnote/popcorn.footnote.js" });
          butter.addTrack({ name: "Track 1", target: "Track 1" });
          butter.tracks[ 0 ].addTrackEvent({ name: "TrackEvent 1", type: "notfootnote" });
          butter.tracks[ 0 ].addTrackEvent({ name: "TrackEvent 1", type: "footnote" });
          butter.track.Editor( butter.getTrack({ name: "Track 1" }));
        });
      });
    } 
  }); //Butter
}, false );
