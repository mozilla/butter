/*global text,expect,ok,module,notEqual,Butter,test,window*/
(function (window, document, Butter, undefined) {

  require( [ "../src/core/eventmanager" ], function( EventManagerWrapper ){
    EventManagerWrapper( window );

    test( "EventManagerWrapper existence" , function (){
      ok( EventManagerWrapper, "EventManagerWrapper exists" );
    });


    test( "EventManagerWrapper wrapping" , function (){
      var o = {};
      EventManagerWrapper( o );

      ok( o.listen && typeof o.listen === "function", "EventManagerWrapper adds listen" );
      ok( o.unlisten && typeof o.unlisten === "function", "EventManagerWrapper adds unlisten" );
      ok( o.chain && typeof o.chain === "function", "EventManagerWrapper adds chain" );
      ok( o.unchain && typeof o.unchain === "function", "EventManagerWrapper adds unchain" );
      ok( o.dispatch && typeof o.dispatch === "function", "EventManagerWrapper adds dispatch" );
    });


    asyncTest( "Simple Async listen, dispatch", 6, function(){
      var a = {},
          name = "eventA",
          data = "eventA data";

      EventManagerWrapper( a );

      a.listen( name, function eventAHandler( e ){
        ok( true, "eventA handler fired" );
        ok( e, "got event object" );
        ok( e.type &&
            e.target &&
            e.data,
            "event has proper structure" );
        ok( e.data === data, "data passed on event object" );
        ok( e.target === a, "correct target on event object" );
        ok( e.type === name, "correct name on event type" );

        start();
      });

      a.dispatch( name, data /*, sync=false */ );
    });


    test( "Simple Sync listen, dispatch", function(){
      var a = {},
          name = "eventA",
          data = "eventA data",
          evt = {};

      EventManagerWrapper( a );

      a.listen( name, function eventAHandler( e ){
        ok( true, "eventA handler fired" );

        evt.type = e.type;
        evt.target = e.target;
        evt.data = e.data;
      });

      a.dispatch( name, data, /* sync = */ true );

      // Test right away, since sync...
      ok( evt.data === data, "data passed on event object" );
      ok( evt.target === a, "correct target on event object" );
      ok( evt.type === name, "correct name on event type" );
    });


    asyncTest( "Unlisten should remove listeners", 1, function(){
      var a = {},
          count = 0,
          name = "eventA",
          data = "eventA data";

      EventManagerWrapper( a );

      function eventHandler1() { count += 1; }
      function eventHandler2() {
        ok( false, "Should never be called." );
        count += 2;
      }
      function eventHandler3() { count += 3; }

      a.listen( name, eventHandler1 );
      a.listen( name, eventHandler2 );
      a.listen( name, eventHandler3 );

      a.listen( "done", function(){
        equals( count, 4, "Count should have been incremented by 1 and 3" );
        start();
      });

      // Remove second listener
      a.unlisten( name, eventHandler2 );

      a.dispatch( name, data );
      a.dispatch( "done" );
    });


    asyncTest( "Unlisten to remove all listeners", 1, function(){
      var a = {},
          count = 0,
          name = "eventA",
          data = "eventA data";

      EventManagerWrapper( a );

      function eventHandler1() { count += 1; }
      function eventHandler2() { count += 2; }
      function eventHandler3() { count += 3; }

      a.listen( name, eventHandler1 );
      a.listen( name, eventHandler2 );
      a.listen( name, eventHandler3 );

      a.listen( "done", function(){
        equals( count, 0, "Count should have been incremented by 1 and 3" );
        start();
      });

      // Remove all listeners (none specified) for event `name`
      a.unlisten( name );

      a.dispatch( name, data );
      a.dispatch( "done" );
    });


    asyncTest( "Chaining events", 4, function(){
      var a = {},
          b = {},
          event1 = "event1",
          event2 = "event2",
          names = [ event1, event2 ],
          data = "event data";

      var aEvent1 = false,
          aEvent2 = false,
          bEvent1 = false,
          bEvent2 = false;

      EventManagerWrapper( a );
      EventManagerWrapper( b );

      a.listen( event1, function( e ) { aEvent1 = e.data === data; } );
      a.listen( event2, function( e ) { aEvent2 = e.data === data; } );

      b.listen( event1, function( e ) { bEvent1 = e.data === data; } );
      b.listen( event2, function( e ) { bEvent2 = e.data === data; } );

      a.chain( b, names );

      b.dispatch( event1, data );
      b.dispatch( event2, data );

      b.listen( "done", function(){
        ok( aEvent1, "aEvent1 handler fired with correct data" );
        ok( aEvent2, "aEvent2 handler fired with correct data" );
        ok( bEvent1, "bEvent1 handler fired with correct data" );
        ok( bEvent2, "bEvent1 handler fired with correct data" );
        start();
      });
      b.dispatch( "done" );
    });


    asyncTest( "Unchaining events", 4, function(){
      var a = {},
          b = {},
          event1 = "event1",
          event2 = "event2",
          names = [ event1, event2 ],
          data = "event data";

      var aEvent1 = false,
          aEvent2 = false,
          bEvent1 = false,
          bEvent2 = false;

      EventManagerWrapper( a );
      EventManagerWrapper( b );

      a.listen( event1, function( e ) { aEvent1 = e.data === data; } );
      a.listen( event2, function( e ) { aEvent2 = e.data === data; } );

      b.listen( event1, function( e ) { bEvent1 = e.data === data; } );
      b.listen( event2, function( e ) { bEvent2 = e.data === data; } );

      a.chain( b, names );
      a.unchain( b, names );

      b.dispatch( event1, data );
      b.dispatch( event2, data );

      b.listen( "done", function(){
        equals( aEvent1, false, "aEvent1 handler should not have fired" );
        equals( aEvent2, false, "aEvent2 handler should not have fired" );
        ok( bEvent1, "bEvent1 handler fired with correct data" );
        ok( bEvent2, "bEvent1 handler fired with correct data" );
        start();
      });
      b.dispatch( "done" );
    });

  });

})(window, document, Butter);
