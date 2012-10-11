/* This Source Code Form is subject to the terms of the MIT license
 *  * If a copy of the MIT license was not distributed with this file, you can
 *  * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

/**
 * Module: Cookie
 *
 * This module's only use is for determining if a first run dialog should be displayed.
 */

define( [], function() {

  var POPCORN_MAKER_COOKIE = "HASVISITED=YES",
      COOKIE_REGEX = new RegExp( POPCORN_MAKER_COOKIE );

  return {

    isPopcornCookieSet: function() {
      var cookie = document.cookie;
      if ( cookie && COOKIE_REGEX.test( cookie ) ) {
        return true;
      }
      return false;
    },
    setPopcornCookie: function() {
      document.cookie = POPCORN_MAKER_COOKIE;
    }
  }
});
