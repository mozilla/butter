/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define([ "text!dialog/dialogs/save-as.html", "dialog/dialog" ],
  function( LAYOUT_SRC, Dialog ){

  Dialog.register( "save-as", LAYOUT_SRC, function( dialog, name ) {
    var nameInput = dialog.rootElement.querySelector( ".name-input" );

    dialog.registerActivity( "save", function( e ){
      if( nameInput.value.replace( /\s/g, "" ) !== "" ){
        dialog.send( "submit", nameInput.value );  
      }
      else{
        dialog.rootElement.querySelector( ".better" ).style.display = "inline";
      }  
    });

    dialog.enableCloseButton();
    dialog.assignEscapeKey( "default-close" );
    dialog.assignEnterKey( "save" );
    dialog.assignButton( ".save", "save" );

    nameInput.value = name || "";
  });
});
