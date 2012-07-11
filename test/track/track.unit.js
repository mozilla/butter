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

module( "Track" );

asyncTest( "getTrackEventById", 1, function() {
  createButter( function( butter ) {
    var t = butter.tracks[ 0 ],
        te = t.addTrackEvent( defaultEvent ),
        retrievedEvent;

    retrievedEvent = t.getTrackEventById( te.id );

    equal( retrievedEvent.id, te.id, "Retrieved track event with correct id" );
    start();
  })
});

asyncTest( "deselectEvents", 2, function() {
  createButter( function( butter ) {
    var t = butter.tracks[ 0 ],
        te1,
        te2;

    te1 = t.addTrackEvent( defaultEvent );
    te2 = t.addTrackEvent( defaultEvent );

    //Set both track events to being selected
    te1.selected = te2.selected = true;

    t.deselectEvents( te1 );

    te1 = t.getTrackEventById( te1.id );
    te2 = t.getTrackEventById( te2.id );

    equal( te1.selected, true, "Track should still be selected" );
    equal( te2.selected, false, "Track shouldn't be selected" );
    start();
  });
});

asyncTest( "addTrackEvent functionality", 5, function() {
  createButter( function( butter ) {
    var t = butter.tracks[ 0 ],
        numTrackEvents = t.trackEvents.length;

    butter.listen( "trackeventadded", function( e ) {
      var popcornOptions = e.data.popcornOptions;

      butter.unlisten( "trackeventadded" );
      equal( ++numTrackEvents, t.trackEvents.length, "Total number of track events increased" );
      equal( e.data.type, defaultEvent.type, "Correct trackevent type of text" );
      equal( popcornOptions.start, defaultEvent.popcornOptions.start, "Correct start time of 2" );
      equal( popcornOptions.end, defaultEvent.popcornOptions.end, "Correct end time of 5" );
      equal( popcornOptions.text, defaultEvent.popcornOptions.text, "Correct text of '" + defaultEvent.popcornOptions.text + "'" );
      start();
    });

    t.addTrackEvent( defaultEvent );
  });
});

asyncTest( "getTrackEventByName", 1, function() {
  createButter( function( butter ) {
    var t = butter.tracks[ 0 ],
        te = t.addTrackEvent( { name: "test" } ),
        retrievedEvent;

    retrievedEvent = t.getTrackEventByName( te.name );

    equal( retrievedEvent.name, te.name, "Got track event by name" );
    start();
  });
});

asyncTest( "removeTrackEvent", 1, function() {
  createButter( function( butter ) {
    var t = butter.tracks[ 0 ],
        te = t.addTrackEvent( defaultEvent );

    butter.listen( "trackeventremoved", function( e ) {
      butter.unlisten( "trackeventremoved" );

      equal( e.data.id, te.id, "Removed correct track event" );
      start();
    });

    t.removeTrackEvent( te );
  });
});
