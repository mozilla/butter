/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function(){

  var dialogs = [
    "error-message",
    "track-data",
    "delete-track",
    "export",
    "quit-confirmation",
    "save-as",
    "load",
    "share"
  ];

  var include = [];
  for ( var i = 0; i < dialogs.length; ++i ) {
    include.push( "dialog/dialogs/" + dialogs[ i ] );
  }

  define( include, function() {} );

}());