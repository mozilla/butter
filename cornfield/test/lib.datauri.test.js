var test = require("tap").test;

var datauri = require( "../lib/datauri" );

function generateTestData() {
  return {
    media: [{
      tracks: [{
        trackEvents: [
          {
            type: "test",
            popcornOptions: {
              src: "data:image/png;base64,yesitismistertorrencewhatllitbe"
            }
          },
          {
            type: "test",
            popcornOptions: {
              src: "imawfullygladyouaskedmethatlloyd"
            }
          }
        ]
      }]
    }]
  };
}

test( "isLoggedIn filter allow", function( t ) {
  t.plan( 4 );

  var file = new datauri.ImageFile( "test", "testfilename", "testurl" );

  t.ok( typeof file.createDBReference === "function", "DB creation function exists" );
  t.ok( typeof file.saveToStore === "function", "Store function exists" );

  var json = file.getJSONMetaData();

  t.equal( json.hash, "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3", "SHA hash is correct" );
  t.equal( json.url, "testurl", "path was processed correctly" );

  t.end();
});

test( "trackevent collection and filtering", function( t ) {
  t.plan( 4 );

  var testData = generateTestData();
  var fullPath;

  var trackEvents = datauri.collectTrackEvents( testData );

  t.equal( trackEvents.length, 2, "2 trackevents found in project data" );

  var files = datauri.filterProjectDataURIs( testData, function() {
    t.ok( true, "path generation occurred" );
    fullPath = "prefix/" + test;
    return {
      filename: "test",
      url: fullPath
    };
  });

  t.equal( files[ 0 ].url, fullPath, "correct url for file" );
  t.equal( files.length, 1, "1 valid file returned from filtering" );

  t.end();

});

test( "committing to storage", function( t ) {
  t.plan( 3 );

  var mockImageStore = {
    write: function( path, buffer, callback ) {
      t.ok( typeof path === "string" && path.length > 0, "path exists" );
      t.ok( buffer instanceof Buffer, "buffer is a Buffer object" );
      callback();
    }
  };

  var files = datauri.filterProjectDataURIs( generateTestData(), function() {
    return {
      filename: "test",
      url: "prefix/test"
    };
  });

  datauri.saveImageFilesToStore( mockImageStore, files, function( err ) {
    t.ok( !err, "image file storage completed" );
  });

  t.end();

});
