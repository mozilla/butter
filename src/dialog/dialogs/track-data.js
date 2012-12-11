/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define([ "text!dialog/dialogs/track-data.html", "dialog/dialog" ],
  function( LAYOUT_SRC, Dialog ){

  Dialog.register( "track-data", LAYOUT_SRC, function ( dialog, track ) {
    var rootElement = dialog.rootElement;

    var trackName = rootElement.querySelector( ".track-name" ),
        trackData = rootElement.querySelector( ".track-data" );

    var data = track.json;

    trackName.innerHTML = data.name;
    trackData.value = JSON.stringify( data );
    dialog.enableCloseButton();
    dialog.assignEscapeKey( "default-close" );

  });
});
