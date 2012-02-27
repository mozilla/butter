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

        document.getElementById('login').addEventListener('click', function() {
          butter.authorize();
        }, false);

        document.getElementById('ls').addEventListener('click', function() {
          butter.ls(function(files) {
            console.log(files);
            files = files.filenames;
            var dropdown = document.getElementById("projectnames");
            dropdown.options.length = 0;
            for (var f in files) {
              dropdown.options[dropdown.options.length] = new Option(files[f], files[f]);
            }
          });
        }, false);

        document.getElementById('loadfile').addEventListener('click', function() {
          var dropdown = document.getElementById("projectnames"),
              name = dropdown.options[dropdown.selectedIndex].value;

          butter.pull(name, function(file) {
            document.getElementById('loadfiledata').value = file;
          });
        }, false);

        document.getElementById('push').addEventListener('click', function() {
          var name = document.getElementById('saveprojectname').value,
              data = document.getElementById('savefiledata').value;

          butter.push(name, data, function(res) {
            console.log(res);
          });
        }, false);

      });
      window.butter = butter;
    } 
  }); //Butter
}, false );
