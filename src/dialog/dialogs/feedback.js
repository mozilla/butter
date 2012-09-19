/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "text!dialog/dialogs/feedback.html", "dialog/dialog" ],
  function( LAYOUT_SRC, Dialog ) {
    Dialog.register( "feedback", LAYOUT_SRC, function ( dialog ) {
      var rootElement = dialog.rootElement,
          updateBtn = rootElement.querySelector( ".update" ),
          infoBtn = rootElement.querySelector( ".icon-info-sign" ),
          dialogInfo = rootElement.querySelector( ".dialog-info" );

      updateBtn.addEventListener( "click", function() {
        dialog.activity( "default-close" );
      }, false );

      infoBtn.addEventListener( "click", function() {
        dialogInfo.classList.toggle( "dialog-hidden" );
      }, false );
      
      dialog.enableCloseButton();
      dialog.assignEscapeKey( "default-close" );
    });
});
