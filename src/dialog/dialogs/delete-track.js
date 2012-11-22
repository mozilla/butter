/*! This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define([ "text!dialog/dialogs/delete-track.html", "dialog/dialog" ],
  function( LAYOUT_SRC, Dialog ){

  Dialog.register( "delete-track", LAYOUT_SRC, function( dialog, trackName ) {
    dialog.registerActivity( "ok", function( e ){
      dialog.send( "submit", true );
    });

    dialog.rootElement.querySelector( ".track-name" )
      .appendChild( document.createTextNode( trackName ) );

    dialog.enableElements( ".yes", ".no" );
    dialog.enableCloseButton();
    dialog.assignEscapeKey( "default-close" );
    dialog.assignEnterKey( "ok" );
    dialog.assignButton( ".yes", "ok" );
    dialog.assignButton( ".no", "default-close" );
  });
});