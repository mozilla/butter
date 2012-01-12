/*global text,expect,ok,module,notEqual,test,window*/

(function (window, document, undefined ) {

  module( "Media" );
  module( "Event Handling" );

  test( "Simple event handling", function () {
    expect( 2 );

    var butter = new Butter();
    var received = false;

    var testFn = function ( event ) {
      received = event.data;
    };

    butter.listen( "testevent", testFn );
    butter.dispatch( "testevent", true );
    ok( received && received === true, "Event handler dispatched and received event object" );
    received = false;
    butter.unlisten( "testevent", testFn );
    butter.dispatch( "testevent", true );
    ok( received === false, "Stop listening for event (general)" );
  });

  module( "Core Object Functionality" );

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
    var m1 = new Butter.Media( { name: "Media 1", target: 'audio-test', url: 'www.google.ca' } );
    ok( m1.name === "Media 1", "Name is correct" );
    ok( m1.target === 'audio-test' && m1.url === 'www.google.ca', "Media storage is correct" );
  });

  test( "Add, retrieve, use, and remove Media object", function () {
    expect(16);

    var mediaState = 0;

    var butter = new Butter();
    var mediaEventState = 0;

    var m1 = new Butter.Media( { name: "Media 1", target: 'audio-test', url: 'www.google.ca' } );

    butter.listen("mediaadded", function ( media ) {
      mediaEventState--;
      mediaState = [1, media.data];
    });
    butter.listen("mediachanged", function ( media ) {
      mediaEventState *= 2;
      mediaState = [2, media.data];
    });
    butter.listen( "mediaremoved", function ( media ) {
      mediaState = [0, media.data];
    });

    butter.addMedia( m1 );

    ok( mediaEventState === -2, "Media events received in correct order" );
    ok( butter.getMedia( "Media 1" ) === m1 && m1.name === "Media 1", "Method 1 object stored and retrieved" );

    var m2 = butter.addMedia( { name: "Media 2", media: document.getElementById('audio-test') } );

    ok( butter.getMedia( "Media 2" ) === m2 && m2.name === "Media 2", "Method 2 object stored and retrieved" );
    ok( mediaState[0] === 1 && mediaState[1] === m2, "mediaadded event received" );

    ok( butter.currentMedia === m1, "Current media is Media 1" );
    butter.currentMedia = m2;
    ok( mediaState[0] === 2 && mediaState[1] === m2, "mediachanged event received" );
    ok( butter.currentMedia === m2, "Current media is Media 2" );
    butter.currentMedia = m1;
    ok( butter.currentMedia === m1, "Current media is Media 1 again" );
    ok( mediaState[0] === 2 && mediaState[1] === m1, "mediachanged event received" );
    
    var mediaContent = m1.url;
    var mediaTarget = m1.target;
    butter.listen( "mediacontentchanged", function ( e ) {
      mediaContent = e.data.url;
    });
    butter.listen( "mediatargetchanged", function ( e ) {
      mediaTarget = e.data.target;
    });
    m1.target = "audio-foo";
    m1.url = "www.mozilla.org";
    ok( mediaTarget === "audio-foo", "Media target changed properly" );
    ok( mediaContent === "www.mozilla.org", "Media content changed properly" );

    butter.removeMedia( m2 );
    ok( mediaState[0] === 0 && mediaState[1] === m2, "mediaremoved event received" );
    butter.removeMedia( "Media 1" );
    ok( mediaState[0] === 0 && mediaState[1] === m1, "mediaremoved event received" );

    ok( butter.getMedia("Media 1") === undefined, "Media 1 doesn't exist" );
    ok( butter.getMedia("Media 2") === undefined, "Media 2 doesn't exist" );

    ok( butter.media.length === 0, "There are no Media" );
  });

  test("Media objects have their own tracks", function () {
    var butter = new Butter();
    var m1 = butter.addMedia();
    var m2 = butter.addMedia();

    butter.addTrack( { name:"Track 1" } );

    butter.currentMedia = m2;

    butter.addTrack( { name:"Track 2" } );

    butter.currentMedia = m1;
    ok( butter.getTrack( { name: "Track 1" } ) !== undefined, "Track 1 is on Media 1");
    ok( butter.getTrack( { name: "Track 2" } ) === undefined, "Track 2 is not on Media 1");

    butter.currentMedia = m2;
    ok( butter.getTrack( { name: "Track 1" } ) === undefined, "Track 1 is not on Media 1");
    ok( butter.getTrack( { name: "Track 2" } ) !== undefined, "Track 2 is on Media 1");
  });

  test("Simple Media functionality", function () {
    expect(6);

    var butter = new Butter();
    var m1 = butter.addMedia({media:"test"});

    var state = [0, 0];
    butter.listen( "mediatimeupdate", function ( media ) {
      state[0] = 1;
    });
    butter.listen( "mediadurationchanged", function ( media ) {
      state[1] = 1;
    });

    m1.duration = 2;
    ok( m1.duration === 2, "duration is correct" );
    m1.currentTime = 1;
    ok( m1.currentTime === 1, "currentTime is correct" );
    ok( state[0] === 1 && state[1] === 1, "events fired" );

    state = [0, 0];
    butter.duration = 5;
    ok(butter.duration === 5, "duration is correct");
    butter.currentTime = 2;
    ok(butter.currentTime === 2, "currentTime is correct");
    ok(state[0] === 1 && state[1] === 1, "events fired");
  });

  module( "Track" );

  test( "Create Track object", function () {
    expect(1);

    var butter = new Butter();

    var t1 = new Butter.Track( { name: "Track 1" } );
    ok( t1.name === "Track 1", "Track name is correct" );
  });

  test( "Add, retrieve, and remove Track", function () {
    expect( 10 );

    var trackState = 0;

    var butter = new Butter();

    var m = butter.addMedia();

    butter.listen( "trackadded", function ( track ) {
      trackState = [1, track.data];
    });
    butter.listen( "trackremoved", function ( track ) {
      trackState = [0, track.data];
    });

    var t1 = new Butter.Track( { name: "Track 1" } );
    butter.addTrack( t1 );
    ok( trackState[0] === 1 && trackState[1] === t1, "trackadded event received" );
    var t2 = butter.addTrack( { name: "Track 2" } );
    ok( trackState[0] === 1 && trackState[1] === t2, "trackadded event received" );

    ok( butter.getTrack( { name: "Track 1" } ) === t1 && 
        butter.getTrack( { name: "Track 1" } ).name === "Track 1", 
        "Track generation method 1");
    ok( butter.getTrack( { name: "Track 2" } ) === t2 && 
        butter.getTrack( { name: "Track 2" } ).name === "Track 2", 
        "Track generation method 2");

    butter.removeTrack( "Track 1" );
    ok( trackState[ 0 ] === 0 && trackState[ 1 ] === t1, "trackremoved event received" );
    butter.removeTrack( t2 );
    ok( trackState[ 0 ] === 0 && trackState[ 1 ] === t2, "trackremoved event received" );

    ok( butter.getTrack( "Track 1" ) === undefined, "Track 1 doesn't exist" );
    ok( butter.getTrack( "Track 2" ) === undefined, "Track 2 doesn't exist" );

    ok( butter.tracks.length === 0, "There are no Tracks" );

    var t3 = new Butter.Track({
      name: "Track 3",
      target: "Target 1"
    });
    butter.addTrack( t3 );
    t3.addTrackEvent({ name: "TrackEvent 49" });
    ok( t3.target === "Target 1", "TrackEvents inherit target when track target is set" );
  });

  module( "TrackEvent" );

  test("Create TrackEvent object", function () {
    expect(1);
    var te1 = new Butter.TrackEvent( { name: "TrackEvent 1", start: 0, end: 1 } );
    ok( te1.name === "TrackEvent 1" && te1.start === 0 && te1.end === 1, "TrackEvent is setup correctly");
  });

  test("Add, retrieve, and remove TrackEvent", function () {
    expect(17);

    var eventState = 0;

    var butter = new Butter();

    var m = butter.addMedia();
    var t = butter.addTrack();

    butter.listen( "trackeventadded", function ( trackEvent ) {
      eventState = [1, trackEvent.data];
    });
    butter.listen( "trackeventremoved", function ( trackEvent ) {
      eventState = [0, trackEvent.data];
    });

    var te1 = new Butter.TrackEvent( { name: "TrackEvent 1", start: 0, end: 1 } );
    butter.addTrackEvent( t, te1 );
    ok( eventState[0] === 1 && eventState[1] === te1, "trackeventadded event received" );

    var te2 = butter.addTrackEvent( t, { name: "TrackEvent 2", start: 1, end: 2 } );
    ok( eventState[0] === 1 && eventState[1] === te2, "trackeventadded event received" );

    var te3 = t.addTrackEvent( { name: "TrackEvent 3", start: 2, end: 3 } );
    ok( eventState[0] === 1 && eventState[1] === te3, "trackeventadded event received" );

    var te4 = t.addTrackEvent( new Butter.TrackEvent( { name: "TrackEvent 4", start: 3, end: 4 } ) );
    ok( eventState[0] === 1 && eventState[1] === te4, "trackeventadded event received" );

    ok( te1 === butter.getTrackEvent( "TrackEvent 1" ), "TrackEvent method 1 is correct" );
    ok( te2 === butter.getTrackEvent( "TrackEvent 2" ), "TrackEvent method 2 is correct" );
    ok( te3 === butter.getTrackEvent( "TrackEvent 3" ), "TrackEvent method 3 is correct" );
    ok( te4 === butter.getTrackEvent( "TrackEvent 4" ), "TrackEvent method 4 is correct" );

    butter.removeTrackEvent( "TrackEvent 1" );
    ok( eventState[0] === 0 && eventState[1] === te1, "trackeventremoved event received" );
    butter.removeTrackEvent( te2 );
    ok( eventState[0] === 0 && eventState[1] === te2, "trackeventremoved event received" );
    t.removeTrackEvent( te3 );
    ok( eventState[0] === 0 && eventState[1] === te3, "trackeventremoved event received" );
    t.removeTrackEvent( "TrackEvent 4" );
    ok( eventState[0] === 0 && eventState[1] === te4, "trackeventremoved event received" );

    ok( butter.getTrackEvent( "TrackEvent 1" ) === undefined, "TrackEvent 1 doesn't exist" );
    ok( butter.getTrackEvent( "TrackEvent 2" ) === undefined, "TrackEvent 2 doesn't exist" );
    ok( butter.getTrackEvent( "TrackEvent 3" ) === undefined, "TrackEvent 3 doesn't exist" );
    ok( butter.getTrackEvent( "TrackEvent 4" ) === undefined, "TrackEvent 4 doesn't exist" );

    var tracks = butter.trackEvents;
    for ( var track in tracks ) {
      ok( tracks[ track ].length === 0, "No TrackEvents remain" );  
    }

  });

  test("Media objects have their own tracks", function () {
    expect( 4 );

    var butter = new Butter();
    var m1 = butter.addMedia();
    var m2 = butter.addMedia();

    butter.addTrack( { name:"Track 1" } );

    butter.currentMedia = m2;

    butter.addTrack( { name:"Track 2" } );

    butter.currentMedia = m1;

    ok( butter.getTrack( { name: "Track 1" } ) !== undefined, "Track 1 is on Media 1");
    ok( butter.getTrack( { name: "Track 2" } ) === undefined, "Track 2 is not on Media 1");

    butter.currentMedia = m2;
    ok( butter.getTrack( { name: "Track 1" } ) === undefined, "Track 1 is not on Media 1");
    ok( butter.getTrack( { name: "Track 2" } ) !== undefined, "Track 2 is on Media 1");

  });

  test( "Remove/Add Track events for constituent TrackEvents", function () {

    expect( 4 );

    var butter = new Butter();
    butter.addMedia();

    var t1 = butter.addTrack();
    var te = butter.addTrackEvent( t1, {} );

    var state = undefined;

    butter.listen('trackeventremoved', function ( trackEvent ) {
      state = trackEvent.data;
    });

    butter.listen('trackeventadded', function ( trackEvent ) {
      state = trackEvent.data;
    });

    ok( t1.trackEvents.length === 1, "Track event stored" );

    butter.removeTrack( t1 );

    ok( state === te, "Track event removal event" );

    state = undefined;

    butter.addTrack( t1 );

    ok( state === te, "Track event added again" );

    ok( t1.trackEvents.length === 1, "Track event stored" );

  });

  test( "Strange usage (setButter shortcutting)", function () {
    expect(0);
    var butter = new Butter(),
        eventsFired = 0;
    butter.listen( "trackeventadded", function () { eventsFired++ } );
    butter.listen( "trackadded", function () { eventsFired++ } );
    butter.listen( "mediaadded", function () { eventsFired++ } );

    var m = new Butter.Media();
    var t = new Butter.Track();
    var te = new Butter.TrackEvent();

    t.addTrackEvent( te );
    m.addTrack( t );
    butter.addMedia( m );

    ok( eventsFired === 3, "events fired correctly" );
  });

  test( "Target serialization", function () {
    expect(5);

    var butter = new Butter();
    butter.addMedia();
    butter.addTarget({ name:'T1', object: 'FunFunFun!' });
    butter.addTarget({ name:'T2', object: {foo: 'bar'} });
    butter.addTarget({ name:'T3', object: document.createElement('div') });
    
    var sTargs = butter.serializeTargets();
    var targs = butter.targets;
    ok( sTargs[0].name === targs[0].name, "simple target name" ); 
    ok( sTargs[1].name === targs[1].name, "second target name" ); 
    ok( JSON.parse(sTargs[0].object) === targs[0].object, "simple target object" );
    ok( JSON.parse(sTargs[1].object).foo === 'bar', "less simple target object" );
    ok( sTargs[2].object !== undefined, "complicated target object" );
  });

  test(" Import/Export", function () {
    expect( 13 );

    var butter = new Butter();
    var m1 = butter.addMedia({ url:'www.test-url-1.com', target:'test-target-1' });
    var m2 = butter.addMedia({ url:'www.test-url-2.com', target:'test-target-2' });
    var t1 = butter.addTrack();
    var t2 = butter.addTrack();
    butter.currentMedia = m2;
    var t3 = butter.addTrack();
    var t4 = butter.addTrack();

    var te1 = t4.addTrackEvent({ start: 2, end: 6 });

    butter.setProjectDetails( 'test-key', 'test-value' );

    butter.addTarget({ object: 'beep' });

    var exported = butter.exportProject();

    var secondButter = new Butter();
    var teEvents = 0, tEvents = 0, mEvents = 0;
    secondButter.listen( "mediaadded", function () {
      mEvents++;
    });
    secondButter.listen( "trackadded", function () {
      tEvents++;
    });
    secondButter.listen( "trackeventadded", function () {
      teEvents++;
    });

    secondButter.importProject( exported );
    var allMedia = secondButter.media;
    ok( allMedia.length === 2, "right number of media objects" );
    ok( allMedia[0].url === 'www.test-url-1.com', "media 1 url is correct" );
    ok( allMedia[0].target === 'test-target-1', "media 1 target is correct" );
    ok( allMedia[1].url === 'www.test-url-2.com', "media 2 url is correct" );
    ok( allMedia[1].target === 'test-target-2', "media 2 target is correct" );

    ok( allMedia[0].tracks.length === 2, "media 1 has right number of tracks" );
    ok( allMedia[1].tracks.length === 2, "media 2 has right number of tracks" );

    ok( allMedia[1].tracks[1].trackEvents[0].end === 6, "trackevent is correct" );

    ok( butter.getProjectDetails( 'test-key' ) === 'test-value', "project details are correct" );

    ok( butter.targets[0].object === 'beep', "target is correct" );

    ok( teEvents === 1, "one trackeventadded events" );
    ok( tEvents === 4, "four trackadded events" );
    ok( mEvents === 2, "two mediaadded events" );

  });

})(window, window.document );
