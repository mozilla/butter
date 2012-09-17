'use strict';

var
dbOnline = false,
mongoose = require('mongoose'),
Schema = mongoose.Schema,

TestResult = new Schema({
  testName: String,
  testURL: String,
  result: String,
  userAgent: String,
  popcornVersion: String,
  butterVersion: String
}),
TestResultModel = mongoose.model( "TestResult", TestResult );

mongoose.connect( 'mongodb://localhost/test', function( err ) {
  if ( !err ) {
    dbOnline = true;
  }
});

module.exports = {
  saveResults: function( data, callback ) {
    var newResult,
        currentResult,
        x;
    
    if( !data ) {
      callback( { error: 'no test result data received' } );
      return;
    }

    for ( x in data ) {
      currentResult = data[ x ];
    
      newResult = new TestResultModel({
        testName: currentResult.testTitle,
        testURL: currentResult.testURL,
        result: currentResult.result,
        userAgent: currentResult.ua,
        popcornVersion: currentResult.popcornVersion,
        butterVersion: currentResult.butterVersion
      });
      
      newResult.save( function( err ) {
        if ( err ) {
          callback( err );
          return;
        }
      });
    }

  },
  getResults: function( callback ) {
    TestResultModel.find( {}, function( err, doc ) {
      if ( err ) {
        callback( { error: err, status: 500 }, doc );
        return;
      }

      if ( !doc ) {
        callback( { error: "No data stored" }, doc );
        return;
      }

      callback( err, doc );
    });
  }
};
