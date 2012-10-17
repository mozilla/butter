/* This Source Code Form is subject to the terms of the MIT license
 *  * If a copy of the MIT license was not distributed with this file, you can
 *  * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "text!dialog/dialogs/first-run.html", "dialog/dialog",
          "ui/widget/tooltip", "util/shims" ],
  function( LAYOUT_SRC, Dialog, ToolTip ) {

    Dialog.register( "first-run", LAYOUT_SRC, function ( dialog, data ) {

      var editor = document.querySelector( ".butter-editor-area" ),
          mediaEditorButton = document.querySelector( ".butter-editor-header-media" ),
          popupTile = document.querySelector( ".butter-plugin-tile[data-popcorn-plugin-type=popup]" ),
          overlayDiv = document.createElement( "div" ),
          popupTooltip,
          mediaTooltip;

      overlayDiv.classList.add( "butter-modal-overlay" );
      overlayDiv.classList.add( "butter-modal-overlay-dark-bg" );
      overlayDiv.classList.add( "fade-in" );

      editor.appendChild( overlayDiv );
      document.body.classList.add( "first-run" );

      popupTile.classList.add( "overlay-highlight" );

      function closeFirstRunDialog() {
        window.removeEventListener( "click", close, false );
        //popupTile.removeEventListener( "mouseover", close, false );
        //mediaEditorButton.classList.remove( "overlay-highlight" );
        //popupTile.classList.remove( "overlay-highlight" );
        editor.removeChild( overlayDiv );
        document.body.classList.remove( "first-run" );
      }

      dialog.listen('close', function farp(e){
        dialog.unlisten('close', farp);
        closeFirstRunDialog();
      });

      function close() {
        dialog.activity( "default-close" );
      }

      popupTile.addEventListener( "mouseover", close, false );
      window.addEventListener( "click", close, false );

      dialog.assignEscapeKey( "default-close" );
    });
});
