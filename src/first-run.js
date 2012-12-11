/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

/**
 * Module: First-Run
 *
 * Determines whether or not a user should be shown a first-run dialog
 */
define( [ "dialog/dialog", "ui/widget/tooltip", "util/shims" ], function( Dialog, ToolTip, Shims ) {

  var __butterStorage = window.localStorage;

  return {
    init: function( config ) {

      var dialog,
          popupTooltip,
          mediaTooltip,
          overlayDiv,
          editor = document.querySelector( ".butter-editor-area" ),
          mediaEditorButton = document.querySelector( ".butter-editor-header-media" ),
          popupTile = document.querySelector( ".butter-plugin-tile[data-popcorn-plugin-type=popup]" );

      function showFirstRunTooltips() {
        ToolTip.create({
          name: "tooltip-popup",
          element: popupTile,
          message: "<h3>Event</h3>Try dragging this to the stage",
          hidden: false
        });
        ToolTip.create({
          name: "tooltip-media",
          element: mediaEditorButton,
          top: "60px",
          message: "<h3>Media Editor</h3>Change your media source here!<span class=\"center-div\"><span class=\"media-icon youtube-icon\"></span><span class=\"media-icon vimeo-icon\"></span><span class=\"media-icon soundcloud-icon\"></span><span class=\"media-icon html5-icon\"></span></span>",
          hidden: false
        });

        popupTooltip = ToolTip.get( "tooltip-popup" );
        mediaTooltip = ToolTip.get( "tooltip-media" );

        document.body.addEventListener( "mousedown", function removeTooltips() {
          mediaTooltip.hidden = true;
          popupTooltip.destroy();
          document.body.removeEventListener( "mousedown", removeTooltips, true );
        }, true );

      }

      function onDialogClose() {
        // Remove Listeners
        dialog.unlisten( "close", onDialogClose );
        window.removeEventListener( "click", closeDialog, false );
        popupTile.removeEventListener( "mouseover", closeDialog, false );

        // Remove Classes
        mediaEditorButton.classList.remove( "overlay-highlight" );
        popupTile.classList.remove( "overlay-highlight" );
        document.body.classList.remove( "first-run" );

        // Remove Overlay
        editor.removeChild( overlayDiv );

        // Show First Run Tooltips
        showFirstRunTooltips();
      }

      function closeDialog() {
        dialog.close();
      }

      function setupFirstRun() {
        // Setup and append the first-run overlay
        overlayDiv = document.createElement( "div" );
        overlayDiv.classList.add( "butter-modal-overlay" );
        overlayDiv.classList.add( "butter-modal-overlay-dark-bg" );
        overlayDiv.classList.add( "fade-in" );
        editor.appendChild( overlayDiv );

        // Add Listeners
        popupTile.addEventListener( "mouseover", closeDialog, false );
        window.addEventListener( "click", closeDialog, false );

        // Add Classes
        popupTile.classList.add( "overlay-highlight" );
        document.body.classList.add( "first-run" );
      }

      try {
        var data = __butterStorage.getItem( "butter-first-run" );

        if ( !data || window.location.search.match( "forceFirstRun" ) ) {
          __butterStorage.setItem( "butter-first-run", true );
          setupFirstRun();
          dialog = Dialog.spawn( "first-run" );
          dialog.open( false );
          dialog.listen( "close", onDialogClose );
        }
      } catch( e ) {}
    }
  };
});
