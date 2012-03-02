/*global text,expect,ok,module,notEqual,test,window*/

/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function(window, document, undefined ){

  QUnit.config.testTimeout = 20000;

  function createButter( callback ){
    stop();

    Butter({
      config: "../config/default.conf",
      ready: function( butter ){
        callback( butter );
        start();
      }
    });

  } //createButter

  module( "Media" );
  module( "Event Handling" );

  test( "Simple event handling", function(){
    expect( 2 );

    createButter( function( butter ){

      var received = false,
          testFn = function( event ){
            received = event.data;
          };

      butter.listen( "testevent", testFn );
      butter.dispatch( "testevent", true );
      ok( received === true, "Event handler dispatched and received event object" );

      received = false;
      butter.unlisten( "testevent", testFn );
      butter.dispatch( "testevent", true );
      ok( received === false, "Stop listening for event (general)" );

    });
  });

  module( "Core Object Functionality" );

  test( "Create Media object", function(){
    expect( 2 );

    createButter( function( butter ){

      var m1 = butter.addMedia( { name: "Media 1", target: "audio-test", url: "http://videos-cdn.mozilla.net/serv/webmademovies/laylapop.ogv" } );
      ok( m1.name === "Media 1", "Name is correct" );
      ok( m1.target === "audio-test" && m1.url === "http://videos-cdn.mozilla.net/serv/webmademovies/laylapop.ogv", "Media storage is correct" );
    });
  });

  test( "Add, retrieve, use, and remove Media object", function(){
    expect( 16 );

    createButter( function( butter ){

      var mediaState = 0,
          mediaEventState = 0,
          mediaContent,
          mediaTarget;

      butter.listen("mediaadded", function( media ){
        mediaEventState--;
        mediaState = [ 1, media.data ];
      });
      butter.listen("mediachanged", function( media ){
        mediaEventState *= 2;
        mediaState = [ 2, media.data ];
      });
      butter.listen( "mediaremoved", function( media ){
        mediaState = [ 0, media.data ];
      });

      var m1 = butter.addMedia( { name: "Media 1", target: "audio-test", url: "http://videos-cdn.mozilla.net/serv/webmademovies/laylapop.ogv" } ),
          m2;

      ok( mediaEventState === -2, "Media events received in correct order" );
      ok( butter.getMediaByType( "name" , "Media 1" ) === m1 && m1.name === "Media 1", "Method 1 object stored and retrieved" );

      m2 = butter.addMedia( { name: "Media 2", media: document.getElementById("audio-test") } );

      ok( butter.getMediaByType( "name", "Media 2" ) === m2 && m2.name === "Media 2", "Method 2 object stored and retrieved" );
      ok( mediaState[ 0 ] === 1 && mediaState[ 1 ] === m2, "mediaadded event received" );
      ok( butter.currentMedia === m1, "Current media is Media 1" );

      butter.currentMedia = m2;
      ok( mediaState[ 0 ] === 2 && mediaState[ 1 ] === m2, "mediachanged event received" );
      ok( butter.currentMedia === m2, "Current media is Media 2" );

      butter.currentMedia = m1;
      ok( butter.currentMedia === m1, "Current media is Media 1 again" );
      ok( mediaState[ 0 ] === 2 && mediaState[ 1 ] === m1, "mediachanged event received" );

      mediaContent = m1.url;
      mediaTarget = m1.target;

      butter.listen( "mediacontentchanged", function( e ){
        mediaContent = e.data.url;
      });
      butter.listen( "mediatargetchanged", function( e ){
        mediaTarget = e.data.target;
      });

      var targetDiv = document.createElement( "div" );
      targetDiv.style.display = "none";
      targetDiv.id = "audio-foo";
      document.body.appendChild( targetDiv );
      m1.target = targetDiv;
      m1.url = "www.mozilla.org";
      ok( mediaTarget.id === "audio-foo", "Media target changed properly" );
      ok( mediaContent === "www.mozilla.org", "Media content changed properly" );

      butter.removeMedia( m2 );
      ok( mediaState[ 0 ] === 0 && mediaState[ 1 ] === m2, "mediaremoved event received" );
      butter.removeMedia( m1 );
      ok( mediaState[ 0 ] === 0 && mediaState[ 1 ] === m1, "mediaremoved event received" );

      ok( butter.getMediaByType( "name", "Media 1" ) === undefined, "Media 1 doesn't exist" );
      ok( butter.getMediaByType( "name", "Media 2" ) === undefined, "Media 2 doesn't exist" );

      ok( butter.media.length === 0, "There are no Media" );

    });
  });

  test( "Media objects have their own tracks", function(){
    expect( 4 );
    createButter( function( butter ){

      var m1 = butter.addMedia(),
          m2 = butter.addMedia();

      m1.addTrack( { name: "Track 1" } );
      butter.currentMedia = m2;
      m2.addTrack( { name: "Track 2" } );
      butter.currentMedia = m1;

      ok( m1.getTrack( { name: "Track 1" } ) !== undefined, "Track 1 is on Media 1");
      ok( m1.getTrack( { name: "Track 2" } ) === undefined, "Track 2 is not on Media 1");

      butter.currentMedia = m2;

      ok( m2.getTrack( { name: "Track 1" } ) === undefined, "Track 1 is not on Media 1");
      ok( m2.getTrack( { name: "Track 2" } ) !== undefined, "Track 2 is on Media 1");
    });
  });

  test( "Simple Media functionality", function(){
    expect( 6 );

    createButter( function( butter ){

      var m1 = butter.addMedia( { media: "test" } ),
          state = [ 0, 0 ];

      butter.listen( "mediatimeupdate", function( media ){
        state[ 0 ] = 1;
      });
      butter.listen( "mediadurationchanged", function( media ){
        state[ 1 ] = 1;
      });

      m1.duration = 2;
      ok( m1.duration === 2, "duration is correct" );
      m1.currentTime = 1;
      ok( m1.currentTime === 1, "currentTime is correct" );
      ok( state[ 0 ] === 1 && state[ 1 ] === 1, "events fired" );

      state = [ 0, 0 ];
      butter.duration = 5;
      ok( butter.duration === 5, "duration is correct" );
      butter.currentTime = 2;
      ok( butter.currentTime === 2, "currentTime is correct" );
      ok( state[ 0 ] === 1 && state[ 1 ] === 1, "events fired" );
    });
  });

  module( "Track" );

  test( "Create Track object", function(){
    expect( 1 );

    createButter( function( butter ){
      var m = butter.addMedia();
      var t1 = m.addTrack( { name: "Track 1" } );
      ok( t1.name === "Track 1", "Track name is correct" );
    });
  });

  test( "Add, retrieve, and remove Track", function(){
    expect( 10 );

    createButter( function( butter ){

      var trackState = 0,
          m = butter.addMedia(),
          t1,
          t2,
          t3;

      butter.listen( "trackadded", function( track ){
        trackState = [ 1, track.data ];
      });
      butter.listen( "trackremoved", function( track ){
        trackState = [ 0, track.data ];
      });

      t1 = m.addTrack( { name: "Track 1" } );
      ok( trackState[ 0 ] === 1 && trackState[ 1 ] === t1, "trackadded event received" );

      t2 = m.addTrack( { name: "Track 2" } );
      ok( trackState[ 0 ] === 1 && trackState[ 1 ] === t2, "trackadded event received" );

      ok( m.getTrack( { name: "Track 1" } ) === t1 &&
          m.getTrack( { name: "Track 1" } ).name === "Track 1",
          "Track generation method 1");
      ok( m.getTrack( { name: "Track 2" } ) === t2 &&
          m.getTrack( { name: "Track 2" } ).name === "Track 2",
          "Track generation method 2");

      m.removeTrack( t1 );
      ok( trackState[ 0 ] === 0 && trackState[ 1 ] === t1, "trackremoved event received" );
      m.removeTrack( t2 );
      ok( trackState[ 0 ] === 0 && trackState[ 1 ] === t2, "trackremoved event received" );

      ok( m.getTrack( { name: "Track 1" } ) === undefined, "Track 1 doesn't exist" );
      ok( m.getTrack( { name: "Track 2" } ) === undefined, "Track 2 doesn't exist" );

      ok( butter.tracks.length === 0, "There are no Tracks" );

      t3 = m.addTrack( { name: "Track 3", target: "Target 1" } );
      m.addTrack( t3 );
      t3.addTrackEvent( { name: "TrackEvent 49", type: "test" } );
      ok( t3.target === "Target 1", "TrackEvents inherit target when track target is set" );
    });
  });

  module( "TrackEvent" );

  test( "Create TrackEvent object", function(){
    expect( 1 );
    createButter( function( butter ){
      var m = butter.addMedia(),
          t = m.addTrack(),
          te1 = t.addTrackEvent( { name: "TrackEvent 1", type: "test", popcornOptions: { start: 0, end: 1 } } );
      ok( te1.name === "TrackEvent 1" && te1.popcornOptions.start ===  0 && te1.popcornOptions.end === 1, "TrackEvent name is setup correctly" );
    });
  });

  test( "Add, retrieve, and remove TrackEvent", function(){
    expect( 13 );

    createButter( function( butter ){

      var eventState = 0,
          m = butter.addMedia(),
          t = m.addTrack();

      butter.listen( "trackeventadded", function( trackEvent ){
        eventState = [ 1, trackEvent.data ];
      });
      butter.listen( "trackeventremoved", function( trackEvent ){
        eventState = [ 0, trackEvent.data ];
      });

      var te1 = t.addTrackEvent( { name: "TrackEvent 1", type: "test", start: 0, end: 1 } );
      ok( eventState[ 0 ] === 1 && eventState[ 1 ] === te1, "trackeventadded event received" );

      var te2 = t.addTrackEvent( { name: "TrackEvent 2", type: "test", start: 1, end: 2 } );
      ok( eventState[ 0 ] === 1 && eventState[ 1 ] === te2, "trackeventadded event received" );

      var te3 = t.addTrackEvent( { name: "TrackEvent 3", type: "test", start: 2, end: 3 } );
      ok( eventState[ 0 ] === 1 && eventState[ 1 ] === te3, "trackeventadded event received" );

      ok( te1 === t.getTrackEventByName( "TrackEvent 1" ), "TrackEvent method 1 is correct" );
      ok( te2 === t.getTrackEventByName( "TrackEvent 2" ), "TrackEvent method 2 is correct" );
      ok( te3 === t.getTrackEventByName( "TrackEvent 3" ), "TrackEvent method 3 is correct" );

      t.removeTrackEvent( te1 );
      ok( eventState[ 0 ] === 0 && eventState[ 1 ] === te1, "trackeventremoved event received" );
      t.removeTrackEvent( te2 );
      ok( eventState[ 0 ] === 0 && eventState[ 1 ] === te2, "trackeventremoved event received" );
      t.removeTrackEvent( te3 );
      ok( eventState[ 0 ] === 0 && eventState[ 1 ] === te3, "trackeventremoved event received" );

      ok( t.getTrackEventByName( "TrackEvent 1" ) === undefined, "TrackEvent 1 doesn't exist" );
      ok( t.getTrackEventByName( "TrackEvent 2" ) === undefined, "TrackEvent 2 doesn't exist" );
      ok( t.getTrackEventByName( "TrackEvent 3" ) === undefined, "TrackEvent 3 doesn't exist" );

      var tracks = butter.tracks;
      for ( var track in tracks ) {
        ok( tracks[ track ].trackEvents.length === 0, "No TrackEvents remain" );
      }

    });

  });

  test( "Media objects have their own tracks", function(){
    expect( 4 );

    createButter( function( butter ){

      var m1 = butter.addMedia(),
          m2 = butter.addMedia();

      m1.addTrack( { name:"Track 1" } );
      butter.currentMedia = m2;
      m2.addTrack( { name:"Track 2" } );
      butter.currentMedia = m1;

      ok( m1.getTrack( { name: "Track 1" } ) !== undefined, "Track 1 is on Media 1" );
      ok( m1.getTrack( { name: "Track 2" } ) === undefined, "Track 2 is not on Media 1" );

      butter.currentMedia = m2;
      ok( m2.getTrack( { name: "Track 1" } ) === undefined, "Track 1 is not on Media 1" );
      ok( m2.getTrack( { name: "Track 2" } ) !== undefined, "Track 2 is on Media 1" );

    });

  });

  test( "Remove/Add Track events for constituent TrackEvents", function(){

    expect( 4 );

    createButter( function( butter ){

      var t1,
          te,
          state,
          m;

      m = butter.addMedia();
      t1 = m.addTrack(),
      te = t1.addTrackEvent({ name: "TrackEvent 3", type: "test", start: 2, end: 3 } ),
      state = undefined;

      butter.listen( "trackeventremoved", function( trackEvent ){
        state = trackEvent.data;
      } );

      butter.listen( "trackeventadded", function( trackEvent ){
        state = trackEvent.data;
      } );

      ok( t1.trackEvents.length === 1, "Track event stored" );

      m.removeTrack( t1 );
      ok( state === te, "Track event removal event" );

      state = undefined;

      m.addTrack( t1 );
      ok( state === te, "Track event added again" );
      ok( t1.trackEvents.length === 1, "Track event stored" );

    });

  });

  test( "Strange usage (setButter shortcutting)", function(){
    expect( 1 );

    createButter( function( butter ){

      butter.listen( "trackeventadded", function(){ eventsFired++ } );
      butter.listen( "trackadded", function(){ eventsFired++ } );
      butter.listen( "mediaadded", function(){ eventsFired++ } );

      var eventsFired = 0,
          m = butter.addMedia(),
          t = m.addTrack(),
          te = t.addTrackEvent({ type: "test" });

      ok( eventsFired === 3, "events fired correctly" );

    });
  });

  test( "Target creation and removal", function() {
    expect( 24 );

    createButter(function( butter ) {

      var targets,
          elem = document.createElement( "div" );

      elem.id = "targetID";
      document.body.appendChild( elem );

      equals( typeof butter.getTargetByType, "function", "butter instance has the getTargetByType function" ); 
      equals( typeof butter.addTarget, "function", "butter instance has the addTarget function" ); 
      equals( typeof butter.removeTarget, "function", "butter instance has the removeTarget function" ); 
      equals( typeof butter.targets, "object", "butter instance has a targets array" );

      butter.addTarget({ name: "Target 2" });
      butter.addTarget({ element: "targetID" });
      butter.addTarget();

      targets = butter.targets;
      equals( targets.length, 3, "targets array has 3 items ( 3 targets )" );

      for( var i = 0, l = targets.length; i < l; i++ ) {
        equals( targets[ i ].id, i, "Target " + (i + 1) + " has the correct id" );
      }

      equals( targets[ 0 ].name, "Target 2", "Target 2 has the correct name" ); 
      equals( typeof targets[ 1 ].element, "object", "Target 3 element exists" );
      equals( targets[ 1 ].element.id, "targetID", "Target 3 element is correct" );
      ok( targets[ 2 ], "empty target is acceptable" );

      equals( butter.getTargetByType( "name", "Target 2" ).name, targets[ 0 ].name, "getting target by name works properly" );
      equals( butter.getTargetByType( "id", 2 ).id, targets[ 2 ].id, "getting target by id works properly" );
      equals( butter.getTargetByType( "element", targets[ 1 ].element).element, targets[ 1 ].element, "getting target by element works properly" );

      for( var i = targets.length, l = 0; i > l; i-- ) {
        var targs = butter.targets;
        equals( targs.length, i, "Before removal: " + i + " targets" ); 
        butter.removeTarget( targs[ i - 1 ] );
        ok( !targs[ i - 1], "Target " + (i - 1) + " no longer exists" );
        equals( targs.length, i - 1, "After removal: " + (i - 1) + " targets" ); 
      }
    });
  });
  test( "Target serialization", function(){
    expect(4);

    createButter( function( butter ){

      var tempElement = document.createElement( "div" ),
          sTargs,
          targs;

      tempElement.id = "targetID";
      document.body.appendChild( tempElement );
      butter.addMedia();
      butter.addTarget( { name:"T1" } );
      butter.addTarget( { name:"T2", element: "targetID" } );

      sTargs = butter.serializeTargets();
      targs = butter.targets;
      ok( sTargs[ 0 ].name === targs[ 0 ].name, "first target name is correct" );
      ok( sTargs[ 1 ].name === targs[ 1 ].name, "second target name is correct" );
      ok( sTargs[ 0 ].element === "", "serialized target defaults safely to empty string" );
      ok( sTargs[ 1 ].element === "targetID", "serialized target return's correct element ID" );

      document.body.removeChild( tempElement );
      delete tempElement;
    });
  });

  test( "Import/Export", function(){
    expect( 12 );

    var m1,
        m2,
        t1,
        t2,
        t3,
        t4,
        te1,
        exported,
        tEvents,
        teEvents,
        mEvents,
        allMedia;

    stop();

    Butter({
      config: "../config/default.conf",
      ready: function( butter ){
        m1 = butter.addMedia( { url:"www.test-url-1.com", target:"test-target-1" } );
        m2 = butter.addMedia( { url:"www.test-url-2.com", target:"test-target-2" } );
        t1 = m1.addTrack();
        t2 = m1.addTrack();
        butter.currentMedia = m2;
        t3 = m2.addTrack();
        t4 = m2.addTrack();
        te1 = t4.addTrackEvent( { popcornOptions: { start: 2, end: 6 }, type: "test" } );
        butter.addTarget( { name: "beep" } );
        exported = butter.exportProject();

        Butter({
          config: "../config/default.conf",
          ready: function( secondButter ){
            teEvents = tEvents = mEvents = 0;
            secondButter.listen( "mediaadded", function(){
              mEvents++;
            });
            secondButter.listen( "trackadded", function(){
              tEvents++;
            });
            secondButter.listen( "trackeventadded", function(){
              teEvents++;
            });

            secondButter.importProject( exported );
            allMedia = secondButter.media;

            ok( allMedia.length === 2, "right number of media objects" );
            ok( allMedia[ 0 ].url === "www.test-url-1.com", "media 1 url is correct" );
            ok( allMedia[ 0 ].target === "test-target-1", "media 1 target is correct" );
            ok( allMedia[ 1 ].url === "www.test-url-2.com", "media 2 url is correct" );
            ok( allMedia[ 1 ].target === "test-target-2", "media 2 target is correct" );

            ok( allMedia[ 0 ].tracks.length === 2, "media 1 has right number of tracks" );
            ok( allMedia[ 1 ].tracks.length === 2, "media 2 has right number of tracks" );
            ok( allMedia[ 1 ].tracks[ 1 ].trackEvents[ 0 ].popcornOptions.end === 6, "trackevent is correct" );

            ok( butter.targets[ 0 ].name === "beep", "target is correct" );

            ok( teEvents === 1, "one trackeventadded events" );
            ok( tEvents === 4, "four trackadded events" );
            ok( mEvents === 2, "two mediaadded events" );

            start();
          }
        });

      }
    });

  });

})(window, window.document );
