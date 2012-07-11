
  var defaultEvent = {
        type: "text",
        popcornOptions: {
          start: 2,
          end: 5,
          text: "This is"
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

  module( "Track Event" );

  asyncTest( "update w/ valid options", 5, function() {
    createButter( function( butter ) {
      var t = butter.currentMedia.tracks[ 0 ],
          te;

      butter.listen( "trackeventupdated", function( e ) {
        butter.unlisten( "trackeventupdated" );
        equal( e.data.popcornOptions.start, 0, "Applied correct default start time" );
        equal( e.data.popcornOptions.end, 1, "Applied correct default end time" );

        butter.listen( "trackeventupdated", function( e ) {
          butter.unlisten( "trackeventupdated" );
          equal( e.data.popcornOptions.start, 5, "Correctly applied new start time" );
          equal( e.data.popcornOptions.end, 10, "Correctly applied new end time" );
          equal( e.data.popcornOptions.text, "This is a test", "Correctly applied new text value" );

          start();
        });

        te = t.addTrackEvent( defaultEvent );
        te.update( { start: 5, end: 10, text: "This is a test" } );
      });

      te = t.addTrackEvent( { name: "TestEvent" } );
      // Checking Defaults
      te.update();
    });
  });

  asyncTest( "update w/ invalid options", 4, function() {
    createButter( function( butter ) {
      butter.currentMedia.onReady( function() {
        var te = butter.currentMedia.tracks[ 1 ].trackEvents[ 0 ];

        try {
          te.update( { start: "m", end: 3 } );
        } catch( e ) {
          equal( e.reason, "invalid-start-time", "Correctly caught " + e.reason );

          try {
            te.update( { start: 1, end: "m" } );
          } catch( e2 ) {
            equal( e2.reason, "invalid-end-time", "Correctly caught " + e2.reason );

            try {
              te.update( { start: 10, end: 8 } );
            } catch( e3 ) {
              equal( e3.reason, "start-greater-than-end", "Correctly caught " + e3.reason );

              try {
                te.update( { start: 5, end: 800 } );
              } catch( e4 ) {
                equal( e4.reason, "invalid-times", "Correctly caught " + e4.reason );
                start();
              }
            }
          }
        }
      });
    });
  });

  asyncTest( "moveFrameLeft - event at zero", 4, function() {
    createButter( function( butter ) {
      var te = butter.currentMedia.tracks[ 1 ].trackEvents[ 0 ],
          inc = 3,
          oldStart = te.popcornOptions.start,
          oldEnd = te.popcornOptions.end;

      butter.listen( "trackeventupdated", function( e ) {
        butter.unlisten( "trackeventupdated" );

        equal( te.popcornOptions.end, oldEnd, "End time shouldn't have changed" );
        equal( te.popcornOptions.start, oldStart , "Start time should be zero" );

        // MetaKey specified, shrinkage of event when End - Start !> inc
        butter.listen( "trackeventupdated", function( e ) {
          butter.unlisten( "trackeventupdated" );

          equal( te.popcornOptions.start, oldStart, "Start time should be zero" );
          equal( te.popcornOptions.end, oldEnd - inc, "End should have had increment subtracted from it" );

          start();
        });

        oldStart = te.popcornOptions.start;
        oldEnd = te.popcornOptions.end;
        te.moveFrameLeft( inc, true );
      });

      // increment is greater than the start of the track event
      te.moveFrameLeft( inc );
    });
  });

  asyncTest( "moveFrameLeft - event with start greater than zero", 4, function() {
    createButter( function( butter ) {
      var te = butter.currentMedia.tracks[ 1 ].trackEvents[ 0 ],
          inc = 2,
          oldStart = te.popcornOptions.start,
          oldEnd = te.popcornOptions.end;

      butter.listen( "trackeventupdated", function( e ) {
        butter.unlisten( "trackeventupdated" );

        // No metaKey being pressed
        butter.listen( "trackeventupdated", function( e ) {
          butter.unlisten( "trackeventupdated" );

          equal( te.popcornOptions.start, oldStart - inc, "Start time was decreased by " + inc );
          equal( te.popcornOptions.end, oldEnd - inc, "End time was decreased by " + inc );

          // Meta Key was pressed, indicating to shrink the track event
          // End - Start > inc
          butter.listen( "trackeventupdated", function( e ) {
            butter.unlisten( "trackeventupdated" );

            equal( te.popcornOptions.start, oldStart, "Start shouldn't have changed" );
            equal( te.popcornOptions.end, oldEnd - inc, "End should have been decreased by " + inc );

            start();
          });

          oldStart = te.popcornOptions.start;
          oldEnd = te.popcornOptions.end;
          te.moveFrameLeft( inc, true );
        });

        oldStart = te.popcornOptions.start;
        oldEnd = te.popcornOptions.end;
        te.moveFrameLeft( inc );
      });

      // changing start/end times first
      te.update( { start: 10, end: 20 } );
    });
  });

  asyncTest( "moveFrameRight - not hitting media duration", 4, function() {
    createButter( function( butter ) {
      butter.currentMedia.onReady( function() {
        var te = butter.currentMedia.tracks[ 1 ].trackEvents[ 0 ],
            inc = 2,
            oldStart = te.popcornOptions.start,
            oldEnd = te.popcornOptions.end;

        // MetaKey false, simply moving track event
        butter.listen( "trackeventupdated", function( e ) {
          butter.unlisten( "trackeventupdated" );

          equal( te.popcornOptions.start, oldStart + inc, "Start should have been incremented by " + inc );
          equal( te.popcornOptions.end, oldEnd + inc, "End should have been incremented by " + inc );

          // MetaKey true, only end time should increase
          butter.listen( "trackeventupdated", function( e ) {
            butter.unlisten( "trackeventupdated" );

            equal( te.popcornOptions.start, oldStart, "Start time shouldn't have been incremented" );
            equal( te.popcornOptions.end, oldEnd + inc, "End time should have been incremented by " + inc );

            start();
          });

          oldStart = te.popcornOptions.start;
          oldEnd = te.popcornOptions.end;
          te.moveFrameRight( inc, true );
        });

        te.moveFrameRight( inc );
      });
    });
  });

  asyncTest( "moveFrameRight - hitting media duration", function() {
    createButter( function( butter ) {
      butter.currentMedia.onReady( function() {
        var duration = butter.currentMedia.duration,
            te = butter.currentMedia.tracks[ 1 ].trackEvents[ 0 ],
            inc = 62,
            oldStart = te.popcornOptions.start,
            oldEnd = te.popcornOptions.end;

        // MetaKey false, simply moving track event
        butter.listen( "trackeventupdated", function( e ) {
          butter.unlisten( "trackeventupdated" );

          var expectedStart = oldStart + ( duration - oldEnd );
          equal( te.popcornOptions.start, expectedStart, "Start time should have been increased" );
          equal( te.popcornOptions.end, duration, "End time should be the duration, as " + oldEnd + " + " + inc + " > " + duration );

          butter.listen( "trackeventupdated", function( e ) {
            butter.unlisten( "trackeventupdated" );

            // MetaKey is used. Start time should not change, end should be duration
            butter.listen( "trackeventupdated", function( e ) {
              butter.unlisten( "trackeventupdated" );

              equal( te.popcornOptions.start, oldStart, "Start shouldn't have changed" );
              equal( te.popcornOptions.end, duration, "End should have been set to the duration" );

              start();
            });

            oldStart = te.popcornOptions.start;
            oldEnd = te.popcornOptions.end;
            te.moveFrameRight( inc, true );
          });

          // resetting the times of the track event
          te.update( { start: 5, end: 10 } );
        });

        te.moveFrameRight( inc );
      });
    });
  });
