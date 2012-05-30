/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define([ "text!dialog/dialogs/quit-confirmation.html", "dialog/dialog" ],
  function( LAYOUT_SRC, Dialog ){

  Dialog.register( "quit-confirmation", LAYOUT_SRC, function( dialog ) {
    dialog.assignButton( ".yes", "default-ok" );
    dialog.assignButton( ".no", "default-close" );
    dialog.assignEnterKey( "default-ok" );
    dialog.assignEscapeKey( "default-close" );
    dialog.enableCloseButton();
  });
});