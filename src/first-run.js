/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

/**
 * Module: First-Run
 *
 * Determines whether or not a user should be shown a first-run dialog
 */
define( [ "dialog/dialog", "util/cookie" ], function( Dialog, Cookie ) {
  return {
    init: function( config ) {

      var _dialog;

      if ( !Cookie.isPopcornCookieSet() || window.location.search.match( "alwaysFirst" ) ) {
        Cookie.setPopcornCookie();
        _dialog = Dialog.spawn( "first-run", { data: "foo" } );
        _dialog.open( false );
      }
    }
  };
});
