/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define([ "util/lang", "text!layouts/warn.html" ], function( Lang, WARNING_LAYOUT ){

  var WARNING_WAIT_TIME = 500;

  return {
    showWarning: function( warningText ) {
      var warningDiv = Lang.domFragment( WARNING_LAYOUT, ".butter-warning" );
      warningDiv.querySelector( "#warning-content" ).innerHTML = warningText;
      document.body.appendChild( warningDiv );
      setTimeout(function() {
        warningDiv.classList.add( "slide-out" );
      }, WARNING_WAIT_TIME );
      warningDiv.getElementsByClassName( "close-button" )[ 0 ].onclick = function () {
        document.body.removeChild( warningDiv );
      };
    }
  };
});
