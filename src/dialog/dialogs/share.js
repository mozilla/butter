/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define([ "text!dialog/dialogs/share.html", "dialog/dialog" ],
  function( LAYOUT_SRC, Dialog ){

  Dialog.register( "share", LAYOUT_SRC, function( dialog, data ) {
    var url = dialog.rootElement.querySelector( ".url-text" );

    var container = dialog.rootElement.querySelector( ".url" );
    container.removeChild( container.querySelectorAll( "span" )[ 0 ] );
    url.innerHTML = data;
    url.href = data;
    
    dialog.enableCloseButton();
    dialog.assignEscapeKey( "default-close" );
    dialog.assignEnterKey( "default-close" );
    
  });
});
