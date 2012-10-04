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

test( "isXHR filter allow", function( t ) {
  t.plan( 1 );

  var mockReq = { header: function( key ) {
        if ( key === "X-Requested-With" ) {
          return "XMLHttpRequest";
        } else {
          return "";
        }
      }},
      mockRes = { json: function() {
        t.ok( false, "this should not be called when X-Requested-With is set" );
      }},
      mockNext = function() {
        t.ok( true, "next() was called when X-Requested-With was set" );
      };

  filter().isXHR( mockReq, mockRes, mockNext );

  t.end();
});

test( "isLoggedIn filter deny", function( t ) {
  t.plan( 2 );

  var mockReq = { header: function( key ) {
        return "";
      }},
      mockRes = { json: function( data, statusCode ) {
        t.deepEqual(data,
          { error: "X-Requested-With is not set to XMLHttpRequest" },
          "error should be X-Requested-With is not set to XMLHttpRequest" );
        t.equal( statusCode, 412, "status should be 412 unauthorized" );
      }},
      mockNext = function() {
        t.ok( false, "next() should not be called when X-Requested-With is null" );
      };

  filter().isXHR( mockReq, mockRes, mockNext );

  t.end();
});

