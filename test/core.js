/*global text,expect,ok,module,notEqual,test,window*/

/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function(window, document, undefined ){

  QUnit.config.testTimeout = 20000;
  QUnit.config.reorder = false;

  window._testInitCallback = function(){};
  window._testBeforeCallback = function(){};
  window._testAfterCallback = function(){};

  function createButter( callback ){

    Butter({
      config: "test-config.json",
      debug: false,
      ready: function( butter ){
        callback( butter );
      }
    });

  } //createButter

  module( "Event Handling" );

  asyncTest( "Simple event handling", 2, function(){

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

      start();
    });
  });

  module( "Core Object Functionality" );

  asyncTest( "Create Media object", 2, function(){

    createButter( function( butter ){

      var m1 = butter.addMedia( { name: "Media 1", target: "audio-test", url: "../external/popcorn-js/test/trailer.ogv" } );
      ok( m1.name === "Media 1", "Name is correct" );
      ok( m1.target === "audio-test" && m1.url === "../external/popcorn-js/test/trailer.ogv", "Media storage is correct" );

      start();
    });
  });

  asyncTest( "Add, retrieve, use, and remove Media object", 16, function(){

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

      var m1 = butter.addMedia( { name: "Media 1", target: "audio-test", url: "../external/popcorn-js/test/trailer.ogv" } ),
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

      start();
    });
  });

  asyncTest( "Media objects have their own tracks", 4, function(){

    createButter( function( butter ){

      var m1 = butter.addMedia(),
          m2 = butter.addMedia();

      var t1 = m1.addTrack( { name: "Track 1" } );
      butter.currentMedia = m2;
      var t2 = m2.addTrack( { name: "Track 2" } );
      butter.currentMedia = m1;

      ok( m1.getTrackById( t1.id ) !== undefined, "Track 1 is on Media 1");
      ok( m1.getTrackById( t2.id ) === undefined, "Track 2 is not on Media 1");

      butter.currentMedia = m2;

      ok( m2.getTrackById( t1.id ) === undefined, "Track 1 is not on Media 1");
      ok( m2.getTrackById( t2.id ) !== undefined, "Track 2 is on Media 1");

      start();
    });
  });

  asyncTest( "Simple Media functionality", 6, function(){

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

      start();
    });
  });

  module( "Track" );

  asyncTest( "Create Track object", 1, function(){

    createButter( function( butter ){

      var m = butter.addMedia();
      var t1 = m.addTrack( { name: "Track 1" } );
      ok( t1.name === "Track 1", "Track name is correct" );

      start();
    });
  });

  asyncTest( "Add, retrieve, and remove Track", 10, function(){

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

      ok( m.getTrackById( t1.id ) === t1 &&
          m.getTrackById( t1.id ).name === "Track 1",
          "Track generation method 1");
      ok( m.getTrackById( t2.id ) === t2 &&
          m.getTrackById( t2.id ).name === "Track 2",
          "Track generation method 2");

      m.removeTrack( t1 );
      ok( trackState[ 0 ] === 0 && trackState[ 1 ] === t1, "trackremoved event received" );
      m.removeTrack( t2 );
      ok( trackState[ 0 ] === 0 && trackState[ 1 ] === t2, "trackremoved event received" );

      ok( m.getTrackById( t1.id ) === undefined, "Track 1 doesn't exist" );
      ok( m.getTrackById( t2.id ) === undefined, "Track 2 doesn't exist" );

      ok( butter.tracks.length === 0, "There are no Tracks" );

      t3 = m.addTrack( { name: "Track 3", target: "Target 1" } );
      m.addTrack( t3 );
      t3.addTrackEvent( { name: "TrackEvent 49", type: "test" } );
      ok( t3.target === "Target 1", "TrackEvents inherit target when track target is set" );

      start();
    });
  });

  module( "TrackEvent" );

  asyncTest( "Create TrackEvent object", 1, function(){

    createButter( function( butter ){

      var m = butter.addMedia(),
          t = m.addTrack(),
          te1 = t.addTrackEvent( { name: "TrackEvent 1", type: "test", popcornOptions: { start: 0, end: 1 } } );
      ok( te1.name === "TrackEvent 1" && te1.popcornOptions.start ===  0 && te1.popcornOptions.end === 1, "TrackEvent name is setup correctly" );

      start();
    });
  });

  asyncTest( "Add, retrieve, and remove TrackEvent", 13, function(){

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

      start();
    });

  });

  asyncTest( "Media objects have their own tracks", 4, function(){

    createButter( function( butter ){

      var m1 = butter.addMedia(),
          m2 = butter.addMedia();

      var t1 = m1.addTrack( { name:"Track 1" } );
      butter.currentMedia = m2;
      var t2 = m2.addTrack( { name:"Track 2" } );
      butter.currentMedia = m1;

      ok( m1.getTrackById( t1.id ) !== undefined, "Track 1 is on Media 1" );
      ok( m1.getTrackById( t2.id ) === undefined, "Track 2 is not on Media 1" );

      butter.currentMedia = m2;
      ok( m2.getTrackById( t1.id ) === undefined, "Track 1 is not on Media 1" );
      ok( m2.getTrackById( t2.id ) !== undefined, "Track 2 is on Media 1" );

      start();
    });

  });

  asyncTest( "Remove/Add Track events for constituent TrackEvents", 4, function(){

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

      start();
    });

  });

  asyncTest( "Strange usage (setButter shortcutting)", 1, function(){

    createButter( function( butter ){

      butter.listen( "trackeventadded", function(){ eventsFired++ } );
      butter.listen( "trackadded", function(){ eventsFired++ } );
      butter.listen( "mediaadded", function(){ eventsFired++ } );

      var eventsFired = 0,
          m = butter.addMedia(),
          t = m.addTrack(),
          te = t.addTrackEvent({ type: "test" });

      ok( eventsFired === 3, "events fired correctly" );

      start();
    });
  });

  asyncTest( "Target creation and removal", 24, function() {

    createButter(function( butter ) {

      var targets,
          elem = document.createElement( "div" );

      elem.id = "targetID";
      document.body.appendChild( elem );

      equals( typeof butter.getTargetByType, "function", "butter instance has the getTargetByType function" );
      equals( typeof butter.addTarget, "function", "butter instance has the addTarget function" );
      equals( typeof butter.removeTarget, "function", "butter instance has the removeTarget function" );
      equals( typeof butter.targets, "object", "butter instance has a targets array" );

      var t1 = butter.addTarget({ name: "Target 2" });
      var t2 = butter.addTarget({ element: "targetID" });
      var t3 = butter.addTarget();

      targets = butter.targets;
      equals( targets.length, 3, "targets array has 3 items ( 3 targets )" );

      for( var i = 0, l = targets.length; i < l; i++ ) {
        equals( targets[ i ].id, "Target" + i, "Target " + (i + 1) + " has the correct id" );
      }

      equals( targets[ 0 ].name, "Target 2", "Target 2 has the correct name" );
      equals( typeof targets[ 1 ].element, "object", "Target 3 element exists" );
      equals( targets[ 1 ].element.id, "targetID", "Target 3 element is correct" );
      ok( targets[ 2 ], "empty target is acceptable" );

      equals( butter.getTargetByType( "name", "Target 2" ).name, targets[ 0 ].name, "getting target by name works properly" );
      equals( butter.getTargetByType( "id", "Target2" ).id, targets[ 2 ].id, "getting target by id works properly" );
      equals( butter.getTargetByType( "element", targets[ 1 ].element).element, targets[ 1 ].element, "getting target by element works properly" );

      for( var i = targets.length, l = 0; i > l; i-- ) {
        var targs = butter.targets;
        equals( targs.length, i, "Before removal: " + i + " targets" );
        butter.removeTarget( targs[ i - 1 ] );
        ok( !targs[ i - 1], "Target " + (i - 1) + " no longer exists" );
        equals( targs.length, i - 1, "After removal: " + (i - 1) + " targets" );
      }

      start();
    });
  });

  asyncTest( "Target serialization", 4, function(){

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

      start();
    });
  });

  asyncTest( "Import/Export", 12, function(){

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

    Butter({
      config: "test-config.json",
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
          config: "test-config.json",
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
  module( "Player tests" );
  // Make sure HTML5 audio/video, youtube, and vimeo work
  asyncTest( "Test basic player support", 7, function() {

    Butter({
      config: "test-config.json",
      ready: function( butter ){
        var mediaURLS = [ "http://www.youtube.com/watch?v=7glrZ4e4wYU",
            "http://vimeo.com/30619461",
            "../external/popcorn-js/test/italia.ogg" ],
            index = 0,
            count = 0;

        equals( butter.currentMedia, undefined, "Initially there is no media" );

        function mediaReady() {
          ok( true, "Media changed triggered" + mediaURLS[ index ] );
          equals( butter.currentMedia.url, mediaURLS[ index ], "The currentMedia's url is equal to the one that has been set" );

          if( mediaURLS[ index + 1 ] === undefined ) {
            butter.unlisten( "mediaready", mediaReady );
            start();
          }

          butter.currentMedia = butter.addMedia({ url: mediaURLS[ ++index ], target: "mediaDiv" });
        }

        butter.listen( "mediaready", mediaReady );
        butter.addMedia({ url: mediaURLS[ index ], target: "mediaDiv" });
      }
    });
  });

  asyncTest( "Test strange div/video player support", 4, function(){

    var el = document.createElement( "video" );
    el.setAttribute( "data-butter-source", "http://www.youtube.com/watch?v=7glrZ4e4wYU" );
    el.setAttribute( "data-butter", "media" );
    el.id = "strange-test-1";
    document.body.appendChild( el );

    createButter(function( butter ){

      ok( butter.media.length > 0 && butter.media[0].url === "http://www.youtube.com/watch?v=7glrZ4e4wYU", "URL match" );
      ok( document.getElementById( "strange-test-1" ), "New element exists" );
      equals( document.getElementById( "strange-test-1" ).attributes.length, el.attributes.length, "has same attribute list length" );
      equals( document.getElementById( "strange-test-1" ).getAttribute( "data-butter" ), "media", "has data-butter attribute" );

      start();
    });
  });

  asyncTest( "Popcorn Options", 2, function(){

    createButter(function( butter ) {
      var m = butter.addMedia({
        name: "Media 1",
        target: "test-target-1",
        url: "../external/popcorn-js/test/trailer.ogv",
        popcornOptions: {
          foo: 2
        }
      });
      ok( m.generatePopcornString().indexOf( "{\"foo\":2}" ) > -1, "Popcorn string contained specified popcornOptions." );
      m.popcornOptions = {
        bar: 3
      };
      ok( m.generatePopcornString().indexOf( "{\"bar\":3}" ) > -1, "Popcorn string contained specified popcornOptions again." );

      start();
    });
  });

  module( "Exported HTML" );
  asyncTest( "exported HTML is properly escaped", 1, function() {

    createButter( function( butter ){
      var m1 = butter.addMedia( { url:"../external/popcorn-js/test/trailer.ogv", target:"mediaDiv" } );

      butter.listen( "mediaready", function( e ) {
        t1 = m1.addTrack();
        var messedUpString = "this'" + 'should"' + '""""""b"e' + "f'i'ne";
        te1 = t1.addTrackEvent( { popcornOptions: { start: 0, end: 6, text: messedUpString, target: "stringSanity" }, type: "footnote" } );
        butter.addTarget( { name: "beep" } );

        var func = Function( "", m1.generatePopcornString() );
            pop = func();

        equals( document.getElementById( "stringSanity" ).children[ 0 ].innerHTML, messedUpString, "String escaping in exported HTML is fine" );

        start();
      });
    });
  });

  asyncTest( "Export HTML snapshotting", 1, function() {

    createButter( function( butter ){

      var m1 = butter.addMedia( { url:"../external/popcorn-js/test/trailer.ogv", target:"mediaDiv" } );

      butter.listen( "mediaready", function( e ) {
        butter.page.snapshotHTML();

        t1 = m1.addTrack();
        te1 = t1.addTrackEvent({
          popcornOptions: {
            start: 0,
            end: 6,
            text: "OBVIOUS",
            target: "stringSanity"
          },
          type: "footnote"
        });

        equals( butter.getHTML().match( "OBVIOUS" ).length, 1, "TrackEvent wasn't exported" );

        start();
      });
    });
  });

  asyncTest( "Modifying exported HTML from Page's getHTML event", 1, function() {
    createButter(function( butter ) {
      var m1 = butter.addMedia( { url:"../external/popcorn-js/test/trailer.ogv", target:"mediaDiv" } ),
          testText = "test text at end of body";

      butter.page.listen( "getHTML", function( e ) {
        var testTextNode = document.createTextNode( testText );
        e.data.getElementsByTagName( "body" )[ 0 ].appendChild( testTextNode );
      });

      butter.listen( "mediaready", function( e ) {
        equals( /test text at end of body\s*<\/body>/.test( butter.getHTML() ), true, "Text appended to body in getHTML event is included in exported HTML." );
        start();
      });
    })
  });

  module( "Debug functionality" );
  asyncTest( "Debug enables/disables logging", 4, function() {

    createButter(function( butter ) {

      var count = 0,
          oldLog;
      equals( butter.debug, false, "debugging is initially false, logging should be enabled" );
      oldLog = console.log;
      console.log = function() {
        count++;
      };
      function ready() {
        equals( count, 0, "No logging was done, debug is correctly suppressing events" );
        butter.debug = true;
        equals( butter.debug, true, "debug setter working correctly" );
        butter.unlisten( "mediaready", ready );
        butter.listen( "mediaready", function() {
          equals( count, 1, "1 log was caught, events are being logged again" );
          start();
          console.log = oldLog;
        });
        butter.addMedia({ url: "../external/popcorn-js/test/trailer.ogv", target: "mediaDiv" });
      }
      butter.listen( "mediaready", ready );
      butter.addMedia({ url: "../external/popcorn-js/test/trailer.ogv", target: "mediaDiv" });

    });
  });

  module( "Popcorn scripts and callbacks" );
  asyncTest( "Existence and execution", 6, function(){

    createButter( function( butter ){

      var theZONE = "";

      window._testInitCallback = function(){ theZONE += "i"; };
      window._testBeforeCallback = function(){ theZONE += "b"; };
      window._testAfterCallback = function(){ theZONE += "a" };

      var initScript = document.createElement( "script" );
      initScript.innerHTML = '"inline test init from element"';
      initScript.id = "init-script";
      document.head.appendChild( initScript );

      var m1 = butter.addMedia( { name: "Media 1", target: "audio-test", url: "../external/popcorn-js/test/trailer.ogv" } );

      m1.onReady(function(){
        butter.preparePopcornScriptsAndCallbacks(function(){
          document.head.removeChild( initScript );
          var exported = butter.getHTML();
          ok( exported.indexOf( "inline test init from element" ) > -1, "found init script" );
          ok( exported.indexOf( "inline test before" ) > -1, "found before script" );
          ok( exported.indexOf( "inline test after" ) > -1, "found after script" );
          ok( theZONE.indexOf( "i" ) > -1, "init callback called" );
          ok( theZONE.indexOf( "b" ) > -1, "before callback called" );
          ok( theZONE.indexOf( "a" ) > -1, "after callback called" );

          start();
        });
      });

    });
  });

  asyncTest( "No scripts/callbacks", 1, function(){
    var succeeded = false;

    setTimeout(function(){
      if( !succeeded ){
        ok( false, "Timeout! Ready not called. Script load skipping failed." );
        start();
      }
    }, 2000);

    Butter({
      config: "test-simple-config.json",
      debug: false,
      ready: function( butter ){
        butter.preparePopcornScriptsAndCallbacks(function(){
          succeeded = true;
          ok( true, "Ready called without any scripts/callbacks." );

          start();
        });
      }
    });
  });

  module( "Dependency Loader" );
  asyncTest( "Load test script", 3, function(){

    createButter( function( butter ){
      butter.loader.load({
        type: "js",
        url: "test-script.js",
        check: function(){
          ok( true, "First check function was run." );
          return !!window.__testScript;
        }
      }, function(){
        butter.loader.load({
          type: "js",
          url: "test-script.js",
          check: function(){
            ok( true, "Second check function was run." );
            return !!window.__testScript;
          }
        }, function(){
          ok( window.__testScript.length === 1, "Test script loaded successfuly and only once." );

          start();
        });
      });
    });
  });

  asyncTest( "Load test CSS", 2, function(){

    createButter( function( butter ){

      butter.loader.load({
        type: "css",
        url: "test-css.css"
      }, function(){
        butter.loader.load({
          type: "css",
          url: "test-script.css",
          check: function(){
            ok( true, "Second check function was run." );
            return true;
          }
        }, function(){
          var testDiv = document.getElementById( "css-test" ),
              style = getComputedStyle( testDiv );
          equals( style.getPropertyValue( "height" ), "100px", "Test css loaded and applied properties." );

          start();
        });
      });

    });
  });

  asyncTest( "Override Default Config", 4, function(){
    // Create 2 butter instances.  Make sure config
    // values are copied and replaced as expected.
    Butter({
      config: "test-config.json",
      debug: false,
      ready: function( butter1 ){

        Butter({
          // Use a user-supplied config file in order to override config.name
          config: "test-override-config.json",
          debug: false,
          ready: function( butter2 ){

            ok( butter1.config.name !== butter2.config.name, "Config names are different" );
            equal( butter2.config.name, "test-override-config", "Config name should be replaced." );

            // Test that things are otherwise the same for both specified and default config options.
            deepEqual( butter1.config.plugin, butter2.config.plugin, "Config plugins are the same" );
            deepEqual( butter1.config.dirs, butter2.config.dirs, "Config dirs are the same" );

            start();

          }
        });

      }
    });
  });

})( window, window.document );
