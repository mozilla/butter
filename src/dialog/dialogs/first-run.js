/* This Source Code Form is subject to the terms of the MIT license
 *  * If a copy of the MIT license was not distributed with this file, you can
 *  * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "text!dialog/dialogs/first-run.html", "dialog/dialog",
          "ui/widget/tooltip", "util/shims" ],
  function( LAYOUT_SRC, Dialog, ToolTip ) {

    Dialog.register( "first-run", LAYOUT_SRC, function ( dialog, data ) {

      var EVENT_EDITOR_NAME = "butter-first-run-editor-img",
          MEDIA_EDITOR_NAME = "butter-first-run-media-img";

      var mediaEditorButton = document.querySelector( ".butter-editor-header-media" ),
          popupTile = document.querySelector( ".butter-plugin-tile[data-popcorn-plugin-type=popup]" );

      mediaEditorButton.classList.add( "overlay-highlight" );
      popupTile.classList.add( "overlay-highlight" );

      window.addEventListener( "click", function closeFirstRunDialog() {
        window.removeEventListener( "click", closeFirstRunDialog );
        mediaEditorButton.classList.remove( "overlay-highlight" );
        popupTile.classList.remove( "overlay-highlight" );
        dialog.activity( "default-close" );
      }, false );

      dialog.assignEscapeKey( "default-close" );
    });
});
