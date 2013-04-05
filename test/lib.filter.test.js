var test = require("tap").test;

var filter = require( "../lib/filter" );

test( "isLoggedIn filter allow", function( t ) {
  t.plan( 1 );

  var mockReq = { session: { email: "test.example.org" } },
      mockRes = { json: function() {
        t.ok( false, "this should not be called when session email is set" );
      }},
      mockNext = function() {
        t.ok( true, "next() was called when session was set" );
      };

  filter().isLoggedIn( mockReq, mockRes, mockNext );

  t.end();
});

test( "isLoggedIn filter deny", function( t ) {
  t.plan( 2 );

  var mockReq = { session: {} },
      mockRes = { json: function( data, statusCode ) {
        t.deepEqual(data,
          { error: "unauthorized" },
          "error should be unauthorized" );
        t.equal( statusCode, 403, "status should be 403 unauthorized" );
      }},
      mockNext = function() {
        t.ok( false, "next() should not be called when session email is null" );
      };

  filter().isLoggedIn( mockReq, mockRes, mockNext );

  t.end();
});

test( "isStorageAvailable filter allow", function( t ) {
  t.plan( 1 );

  var mockRes = { json: function() {
        t.ok( false, "this should not be called when storage is available" );
      }},
      mockNext = function() {
        t.ok( true, "next() was called when storage was available" );
      };

  filter(function() {
    return true;
  }).isStorageAvailable( null, mockRes, mockNext );

  t.end();
});

test( "isStorageAvailable filter deny", function( t ) {
  t.plan( 2 );

  var mockRes = { json: function( data, statusCode ) {
        t.deepEqual(data,
          { error: "storage service is not running" },
          "error should be storage service is not running" );
        t.equal( statusCode, 500, "status should be 500 server error" );
      }},
      mockNext = function() {
        t.ok( false, "next() should not be called when storage is not available" );
      };

  filter(function() {
    return false;
  }).isStorageAvailable( null, mockRes, mockNext );

  t.end();
});

test( "crossOriginAccessible filter allow", function( t ) {
  t.plan( 3 );

  filter().crossOriginAccessible( null, {
    "set": function( header, value ) {
      t.equal( header, "Access-Control-Allow-Origin", "CORS header name is set" );
      t.equal( value, "*", "CORS header value is set" );
    }
  }, function mockNext() {
    t.ok( true, "next() was called" );
  });

  t.end();
});
