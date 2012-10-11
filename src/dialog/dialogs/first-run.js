/* This Source Code Form is subject to the terms of the MIT license
 *  * If a copy of the MIT license was not distributed with this file, you can
 *  * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "text!dialog/dialogs/first-run.html", "dialog/dialog",
          "ui/widget/tooltip" ],
  function( LAYOUT_SRC, Dialog, ToolTip ) {

    Dialog.register( "first-run", LAYOUT_SRC, function ( dialog, data ) {

      var EVENT_EDITOR_NAME = "butter-first-run-editor-img",
          MEDIA_EDITOR_NAME = "butter-first-run-media-img";

      var rootElement = dialog.rootElement,
          continueBtn = rootElement.querySelector( "#continue" ),
          eventEditorDiv = rootElement.querySelector( "." + EVENT_EDITOR_NAME ),
          mediaEditorDiv = rootElement.querySelector( "." + MEDIA_EDITOR_NAME ),
          eventEditorTooltip,
          mediaEditorTooltip;

      // This Tooltip stuff will probably go
      ToolTip.create({
        name: EVENT_EDITOR_NAME,
        element: eventEditorDiv,
        message: "Drag these items to the timeline to create events.",
        top: "85%",
        left: "35%",
        hidden: false,
        hover: false,
        error: true
      });

      ToolTip.create({
        name: MEDIA_EDITOR_NAME,
        element: mediaEditorDiv,
        message: "Click this button to open the media editor and change your project's media source.",
        top: "30%",
        left: "15%",
        hidden: false,
        hover: false,
        error: true
      });

      eventEditorTooltip = ToolTip.get( EVENT_EDITOR_NAME );
      mediaEditorTooltip = ToolTip.get( MEDIA_EDITOR_NAME );

      dialog.listen( "close", function() {
        eventEditorTooltip.destroy();
        mediaEditorTooltip.destroy();
      });

      continueBtn.addEventListener( "click", function() {
        dialog.activity( "default-close" );
      }, false );

      dialog.enableCloseButton();
      dialog.assignEscapeKey( "default-close" );
    });
});
