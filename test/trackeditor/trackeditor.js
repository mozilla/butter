/*global text,expect,ok,module,notEqual,test,window*/
(function () {

  var butter;

  module ( "trackeditor", {
    setup: function() {
      stop();
      new Butter({
        modules: {
          "trackeditor": {
            target: "target-div",
          }
        },
        ready: function( e ) {
          butter = e.data;
          start();
        }
      });
    },
    teardown: function() {
    }
  });

  test( "Setup", function() {
    expect( 2 );
    ok( butter.trackeditor, "trackeditor exists" );
    ok( butter.trackeditor.Editor, "Editor exists" );
  });

  test( "Functionality", function() {
    expect( 10 );
    ok( butter.trackeditor.target.id === "target-div", "target is correct" );

    butter.addMedia({ name: "Media 1" })
          .addTrack({
            name: "Track 1",
            target: "Target 1"
          })
          .addTrackEvent({
            name: "TrackEvent 1", 
          });

    var editor = new butter.trackeditor.Editor( butter.getTrack({ name: "Track 1" }) );
    ok( editor.close, "close" );
    ok( editor.remove, "remove" );
    ok( editor.track, "track" );
    ok( editor.target === "Target 1", "target" );

    editor.target = "Target 2";
    ok( editor.target === "Target 2", "target changed properly" );

    butter.tracks[ 0 ].target = "Target 3";
    ok( editor.target === "Target 3", "target changed properly" );
    ok( butter.tracks[ 0 ].trackEvents[ 0 ].target === "Target 3", "track event target changed properly" );

    var json = editor.json;
    ok( json && json.name === "Track 1", "json output is correct" );
    json.name = "1 kcarT";
    editor.json = json;
    ok( json && json.name === "1 kcarT", "track is correct after json input change" );
  });

})();
