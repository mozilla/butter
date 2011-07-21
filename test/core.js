/*global text,expect,ok,module,notEqual,Butter,test,window*/
(function (window, document, undefined, Butter) {

  module( "Media" );

  test( "No media check", function () {
    expect(1);
    try {
      butter.addTrack();
      ok( false, "Media error not received" );
    }
    catch (e) {
      ok( true, "No media error received" );
    } //try
  });

  test( "Create Media object", function () {
    expect(2);
    var m1 = new Butter.Media( { name: "Media 1", media: document.getElementById('audio-test') } );
    ok( m1.getName() === "Media 1", "Name is correct" );
    ok( m1.getMedia() === document.getElementById('audio-test'), "Media element is correct" );
  });

  test( "Add, retrieve, and remove Media object", function () {
    expect(9);

    var butter = new Butter();
    var mediaEventState;

    var m1 = new Butter.Media( { name: "Media 1", media: document.getElementById('audio-test') } );
    butter.listen("mediaadded", function () {
      mediaEventState = 0;
    });
    butter.listen("mediachanged", function () {
      mediaEventState = 1;
    });
    butter.addMedia( m1 );
    ok( butter.getMedia("Media 1") === m1 && m1.getName() === "Media 1", "Method 1 object stored and retrieved" );
    ok( mediaEventState === 1, "Media events received in correct order" );

    var m2 = butter.addMedia( { name: "Media 2", media: document.getElementById('audio-test') } );
    ok( butter.getMedia("Media 2") === m2 && m2.getName() === "Media 2", "Method 2 object stored and retrieved" );

    ok( butter.getCurrentMedia() === m1, "Current media is Media 1" );
    butter.setMedia( m2 );
    ok( butter.getCurrentMedia() === m2, "Current media is Media 2" );
    butter.setMedia( m1 );
    ok( butter.getCurrentMedia() === m1, "Current media is Media 1 again" );

    butter.removeMedia( m2 );
    butter.removeMedia( "Media 1" );

    ok( butter.getMedia("Media 1") === undefined, "Media 1 doesn't exist" );
    ok( butter.getMedia("Media 2") === undefined, "Media 2 doesn't exist" );

    ok( butter.getAllMedia().length === 0, "There are no Media" );
  });

  test("Media objects have their own tracks", function () {
    var butter = new Butter();
    var m1 = butter.addMedia();
    var m2 = butter.addMedia();

    butter.addTrack( { name:"Track 1" } );

    butter.setMedia( m2 );

    butter.addTrack( { name:"Track 2" } );

    butter.setMedia( m1 );
    ok( butter.getTrack( "Track 1" ) !== undefined, "Track 1 is on Media 1");
    ok( butter.getTrack( "Track 2" ) === undefined, "Track 2 is not on Media 1");

    butter.setMedia( m2 );
    ok( butter.getTrack( "Track 1" ) === undefined, "Track 1 is not on Media 1");
    ok( butter.getTrack( "Track 2" ) !== undefined, "Track 2 is on Media 1");

  });

  module( "Track" );

  test( "Create Track object", function () {
    expect(1);

    var butter = new Butter();

    var t1 = new Butter.Track( { name: "Track 1" } );
    ok( t1.getName() === "Track 1", "Track name is correct" );
  });

  test( "Add, retrieve, and remove Track", function () {
    expect(5);

    var butter = new Butter();

    var m = butter.addMedia();

    var t1 = new Butter.Track( { name: "Track 1" } );
    butter.addTrack( t1 );
    var t2 = butter.addTrack( { name: "Track 2" } );

    ok( butter.getTrack("Track 1") === t1 && butter.getTrack("Track 1").getName() === "Track 1", "Track generation method 1");
    ok( butter.getTrack("Track 2") === t2 && butter.getTrack("Track 2").getName() === "Track 2", "Track generation method 2");

    butter.removeTrack( "Track 1" );
    butter.removeTrack( t2 );

    ok( butter.getTrack( "Track 1" ) === undefined, "Track 1 doesn't exist" );
    ok( butter.getTrack( "Track 2" ) === undefined, "Track 2 doesn't exist" );

    ok( butter.getTracks().length === 0, "There are no Tracks" );
  });

  module( "TrackEvent" );

  test("Create TrackEvent object", function () {
    expect(1);
    var te1 = new Butter.TrackEvent( { name: "TrackEvent 1", start: 0, end: 1 } );
    ok( te1.getName() === "TrackEvent 1" && te1.start === 0 && te1.end === 1, "TrackEvent is setup correctly");
  });

  test("Add, retrieve, and remove TrackEvent", function () {
    expect(9);

    var butter = new Butter();

    var m = butter.addMedia();

    var t = butter.addTrack();

    var te1 = new Butter.TrackEvent( { name: "TrackEvent 1", start: 0, end: 1 } );

    butter.addTrackEvent( t, te1 );
    var te2 = butter.addTrackEvent( t, { name: "TrackEvent 2", start: 1, end: 2 } );

    var te3 = t.addTrackEvent( { name: "TrackEvent 3", start: 2, end: 3 } );
    var te4 = t.addTrackEvent( new Butter.TrackEvent( { name: "TrackEvent 4", start: 3, end: 4 } ) );

    ok( te1 === butter.getTrackEvent( "TrackEvent 1" ), "TrackEvent method 1 is correct" );
    ok( te2 === butter.getTrackEvent( "TrackEvent 2" ), "TrackEvent method 2 is correct" );
    ok( te3 === butter.getTrackEvent( "TrackEvent 3" ), "TrackEvent method 3 is correct" );
    ok( te4 === butter.getTrackEvent( "TrackEvent 4" ), "TrackEvent method 4 is correct" );

    butter.removeTrackEvent( "TrackEvent 1" );
    butter.removeTrackEvent( te2 );
    t.removeTrackEvent( te3 );
    t.removeTrackEvent( "TrackEvent 4" );

    ok( butter.getTrackEvent( "TrackEvent 1" ) === undefined, "TrackEvent 1 doesn't exist" );
    ok( butter.getTrackEvent( "TrackEvent 2" ) === undefined, "TrackEvent 2 doesn't exist" );
    ok( butter.getTrackEvent( "TrackEvent 3" ) === undefined, "TrackEvent 3 doesn't exist" );
    ok( butter.getTrackEvent( "TrackEvent 4" ) === undefined, "TrackEvent 4 doesn't exist" );

    var tracks = butter.getTrackEvents();
    for ( var track in tracks ) {
      ok( tracks[ track ].length === 0, "No TrackEvents remain" );  
    }

  });

})(window, document, undefined, Butter);
