require( [ "../src/core/track" ], function( Track ) {
  var defaultEvent = {
        type: "text",
        popcornOptions: {
          start: 2,
          end: 5,
          text: "This is a test"
        }
      };

  function createButter( callback ){

    Butter({
      config: "../test-config-core.json",
      debug: false,
      ready: function( butter ){
        callback( butter );
      }
    });
  }
  module( "Media" );

  function startTests() {
    asyncTest( "addTrack functionality", 1, function() {
      createButter( function( butter ) {
        var track = new Track( { name: "TestTrack" } );

        butter.listen( "trackadded", function( e ) {

          butter.unlisten( "trackadded" );
          equal( e.data.name, track.name, "addTrack returned expected track" );
          start();
        });

        butter.currentMedia.addTrack( track );
      });
    });

    asyncTest( "getTrackById functionality", 1, function() {
      createButter( function( butter ) {
        var trackOne = butter.currentMedia.tracks[ 0 ];
            trackTwo = butter.currentMedia.getTrackById( trackOne.id );

        equal( trackOne.id, trackTwo.id, "getTrackById returned expected track event" );
        start();
      });
    });

    asyncTest( "removeTrack functionality", 2, function() {
      createButter( function( butter ) {
        var tracks = butter.currentMedia.tracks,
            trackOne = tracks[ 0 ],
            trackTwo = tracks[ 1 ],
            trackEvent = trackTwo.trackEvents[ 0 ];

        butter.listen( "trackremoved", function( e ) {

          butter.unlisten( "trackremoved" );
          butter.listen( "trackeventremoved", function( e ) {

            butter.unlisten( "trackeventremoved" );
            equal( e.data.id, trackEvent.id, "Successfully sent trackeventremoved for the trackevent on the track" );
            start();
          });

          equal( e.data.id, trackOne.id, "Removed the correct track" );

          butter.currentMedia.removeTrack( trackTwo );
        });

        butter.currentMedia.removeTrack( trackOne );
      });
    });

    asyncTest( "findTrackWithTrackEventId functionality", 1, function() {
      createButter( function( butter ) {
        var track = butter.currentMedia.tracks[ 0 ],
            trackEvent,
            receivedTrack;

        // None of my tracks have events right now, adding a new one
        track.addTrackEvent();
        trackEvent = track.trackEvents[ 0 ];

        receivedTrack = butter.currentMedia.findTrackWithTrackEventId( trackEvent.id );
        equal( receivedTrack.track.id, track.id, "Received expected track with id " + track.id );
        start();
      });
    });

    asyncTest( "getManifest functionality", function() {
      createButter( function( butter ) {
        var fakeManifest = {
              stuff: "stuff",
              stuff2: "stuff2",
              moreStuff: "even more stuff"
            },
            retrievedItem;

        // First need to set a fake manifest
        butter.currentMedia.registry = fakeManifest;

        retrievedItem = butter.currentMedia.getManifest( "stuff" );
        equal( retrievedItem, fakeManifest.stuff, "Retrieved the correct manifest information" );
        start();
      });
    });
  }

  asyncTest( "generatePopcornString functionality", function() {
    createButter( function( butter ) {
      var js = butter.currentMedia.generatePopcornString(),
          index = js.indexOf( "?" ),
          xhr = new XMLHttpRequest();

      // Removing our expected butter UID
      js = js.substring( 0, index ) + js.substring( index + 24 );

      xhr.open( "GET", "expectedScript.js", false );
      xhr.onreadystatechange = function() {
        if ( xhr.readyState === 4 ) {
          equal( xhr.responseText, js, "getHTML generated expected html." );
          start();
          startTests();
        }
      }
      xhr.send();
    });
  });
});