var fs = require( 'fs' );
var fileName = process.argv[ 2 ];

function createCheckFunction( checkFn, errorMessage ) {
  return function( line ) {
    var multiReturn = [];
    var croppedIndex = 0;

    while ( true ) {
      result = checkFn( line );
      if ( result === -1 ) {
        break;
      }
      multiReturn.push({
        column: result + croppedIndex,
        error: errorMessage
      });
      line = line.substr( result + 1 );
      croppedIndex += result + 1;
    }

    return multiReturn.length > 0 ? multiReturn : null;
  };
}

var checkTabs = createCheckFunction( function( line ) { return line.indexOf( "\t" ); }, "line contains tabs" );
var checkIfAndFor = createCheckFunction( function( line ) { return line.search( /(if|for)\(/ ); }, "improper spacing around if/for" );
var checkEquals = createCheckFunction( function( line ) { return line.search( /([^=|\s]=|=[^=|\s])/ ); }, "improper spacing around '='" );
var checkLogicals = createCheckFunction( function( line ) { return line.search( /\S[<>]|[<>]\S/ ); }, "improper spacing around logical operators" );

var checkLeftCircleBracketAfter = createCheckFunction( function( line ) { return line.search( /(\([^\)\s])/ ); }, "improper left-side bracket spacing" );
var checkRightCircleBracket = createCheckFunction( function( line ) { return line.search( /([^\s\()]\)|\)\S)/ ) }, "improper right-side bracket spacing" );

var checkFunctionDeclaration1 = createCheckFunction( function( line ) { return line.search( /function\s\(/ ); }, "improper spacing after function keyword" );
var checkFunctionDeclaration2 = createCheckFunction( function( line ) { return line.search( /function\s\s+\(/ ); }, "improper spacing after function keyword" );
var checkFunctionDeclaration3 = createCheckFunction( function( line ) { return line.search( /function\s\w+\s\(/ ); }, "improper spacing after function name" );

var checks = [
  checkTabs,
  checkLeftCircleBracketAfter,
  checkRightCircleBracket,
  checkFunctionDeclaration1,
  checkFunctionDeclaration2,
  checkFunctionDeclaration3,
  checkIfAndFor,
  checkEquals,
  checkLogicals
];

function printResult( result, line, lineIndex ) {
  var paddingIndex = 0;
  var padding = "";
  var errorMessage;
  var errorColumn;

  if ( typeof result === "object" ) {
    errorMessage = result.error;
    errorColumn = result.column;
    if ( result ) {
      while ( paddingIndex < errorColumn ) {
        padding += " ";
        paddingIndex++;
      }
      console.log( fileName + ": " + ( lineIndex + 1 ) + ": " + errorMessage + "\n" + line + "\n" + padding + "^" );
    }

  }
  else {
    console.log( fileName + ": " + ( lineIndex + 1 ) + ": " + result + "\n" + line );
  }
}

function runChecks( data ) {
  data.forEach( function( line, lineIndex ) {
    checks.forEach( function( check, checkIndex ) {
      var result = check( line );
      if ( result ) {
        if ( !( typeof result === "string" ) && result.length ) {
          for ( var i = 0, l = result.length; i < l; ++i ) {
            printResult( result[ i ], line, lineIndex );
          }
        }
        else {
          printResult( result, line, lineIndex );
        }
      }
    });
  });
}

if ( fileName ) {
  fs.readFile( fileName, function( err, data ) {
    if( err ) {
      console.error("Could not open file: %s", err);
      process.exit(1);
    }

    var splitData = data.toString().split( "\n" );
    runChecks( splitData );
  });
}
else {
  console.log( "mirror.js - butter style linter" );
  console.log( "usage: node mirror.js filename" );
}
