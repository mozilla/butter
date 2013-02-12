/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

/**
 * Module: First-Run
 *
 * Determines whether or not a user should be shown a first-run dialog
 */
define( [ "dialog/dialog", "ui/widget/tooltip" ], function( Dialog, ToolTip ) {

  var __butterStorage = window.localStorage;

  return {
    init: function() {

      var dialog,
          mediaTooltip,
          overlayDiv,
          editor = document.querySelector( ".butter-editor-area" ),
          eventsEditorButton = document.querySelector( ".butter-editor-header-popcorn" ),
          mediaInput = document.querySelector( ".add-media-input" );

      function showFirstRunTooltips() {
        ToolTip.create({
          name: "tooltip-media",
          element: eventsEditorButton,
          top: "60px",
          message: "<h3>Events Editor</h3>Augment your media with track events here!",
          hidden: false
        });

        mediaTooltip = ToolTip.get( "tooltip-media" );

        document.body.addEventListener( "mousedown", function removeTooltips() {
          mediaTooltip.hidden = true;
          document.body.removeEventListener( "mousedown", removeTooltips, true );
        }, true );

      }

      function onDialogClose() {
        // Remove Listeners
        dialog.unlisten( "close", onDialogClose );
        window.removeEventListener( "click", closeDialog, false );

        // Remove Classes
        eventsEditorButton.classList.remove( "overlay-highlight" );
        mediaInput.classList.remove( "overlay-highlight" );
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

        // Add Listener
        window.addEventListener( "click", closeDialog, false );

        // Add Classes
        mediaInput.classList.add( "overlay-highlight" );
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
