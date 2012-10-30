var test = require( "tap" ).test,
    mockStore = require( "./mock.store" ),
    constants = {
      EMBED_HOSTNAME: "http://localhost:8888",
      EMBED_SUFFIX: "_"
    },
    utils = require( "../lib/utils" )( constants, mockStore ),
    id = 1234;

test( "generateIdString returns expected value", function( t ) {

  t.equal( id.toString( 36 ), utils.generateIdString( id ), "Generated ID matches expected value" );

  t.end();
});

test( "generatePublishUrl returns expected value", function( t ) {
  var expectedUrl = constants.EMBED_HOSTNAME + "/v/" + utils.generateIdString( id ) + ".html";

  t.equal( expectedUrl, utils.generatePublishUrl( id ), "Generated publish URL matches expected value" );

  t.end();
});

test( "generateIframeUrl returns expected value", function( t ) {
  var expectedUrl = constants.EMBED_HOSTNAME + "/v/" + utils.generateIdString( id ) + "_.html";

  t.equal( expectedUrl, utils.generateIframeUrl( id ), "Generated publish URL matches expected value" );

  t.end();
});
