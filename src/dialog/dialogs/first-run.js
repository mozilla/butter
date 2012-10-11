/* This Source Code Form is subject to the terms of the MIT license
 *  * If a copy of the MIT license was not distributed with this file, you can
 *  * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "text!dialog/dialogs/first-run.html", "dialog/dialog",
          "ui/widget/tooltip", "util/shims" ],
  function( LAYOUT_SRC, Dialog, ToolTip ) {


    var TOOLTIP_DELAY = 3000;

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
        window.removeEventListener( "click", secondStep, false );
        mediaEditorButton.classList.remove( "overlay-highlight" );
        popupTile.classList.remove( "overlay-highlight" );
        editor.removeChild( overlayDiv );
        document.body.classList.remove( "first-run" );
        dialog.activity( "default-close" );
      }
   
      function secondStep() {
        closeFirstRunDialog();
        popupTooltip = ToolTip.create({
          name: "tooltip-popup",
          element: popupTile,
          message: "<h3>Event</h3>Try dragging this to the stage",
          hidden: false
        });
        mediaTooltip = ToolTip.create({
          name: "tooltip-media",
          element: mediaEditorButton,
          top: "60px",
          message: "<h3>Media Editor</h3>Change your media source here!<span class=\"center-div\"><span class=\"media-icon youtube-icon\"></span><span class=\"media-icon vimeo-icon\"></span><span class=\"media-icon soundcloud-icon\"></span><span class=\"media-icon html5-icon\"></span></span>",
          hidden: false
        });

        setTimeout( function() {
          if ( mediaTooltip ) {
            mediaTooltip.parentNode.removeChild( mediaTooltip );
          }
          if ( popupTooltip ) {
            popupTooltip.parentNode.removeChild( popupTooltip );
          }
        }, TOOLTIP_DELAY );

        popupTile.removeEventListener( "mouseover", secondStep, false );
      }

      popupTile.addEventListener( "mouseover", secondStep, false );
      window.addEventListener( "click", secondStep, false );

      dialog.assignEscapeKey( "default-close" );
    });
});
