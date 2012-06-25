require( [ "../src/core/comm" ], function( Comm ) {
  var _iframe,
      _comm,
      _butter,
      _event = "trackeventadded",
      _message = "This is a Test";

  module( "Comm" );
  function startTests() {
    asyncTest( "send and listen functionality", 2, function() {
      _comm.listen( _event, function( e ) {
        equal( _event, e.type, "Comm module successfully caught the event " + _event );
        equal( _message, e.data, "Comm module successfully sent the message '" + _message + "' with the event" );
        start();
      });

      _comm.send( _event, _message );
    });
  }

  function loaded() {
    asyncTest( "Test Callback", 1, function() {
      ok( true, "Callback fired successfully" );
      start();
      startTests();
    });
  }

  _comm = new Comm( window, loaded );

});
