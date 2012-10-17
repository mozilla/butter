/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

/**
 * Module: First-Run
 *
 * Determines whether or not a user should be shown a first-run dialog
 */
define( [ "dialog/dialog", "util/cookie", "ui/widget/tooltip" ], function( Dialog, Cookie, ToolTip ) {
  return {
    init: function( config ) {
    var TOOLTIP_DELAY = 3000;


      var _dialog, popupTooltip, mediaTooltip,
          mediaEditorButton = document.querySelector( ".butter-editor-header-media" ),
          popupTile = document.querySelector( ".butter-plugin-tile[data-popcorn-plugin-type=popup]" );

      function secondStep() {
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

        popupTile.removeEventListener( "mouseover", close, false );
      }

      if ( !Cookie.isPopcornCookieSet() || window.location.search.match( "alwaysFirst" ) ) {
        Cookie.setPopcornCookie();
        _dialog = Dialog.spawn( "first-run", { data: "foo" } );
        _dialog.open( false );
        _dialog.listen( 'close', function boop(){
          _dialog.unlisten('close', boop);
          secondStep();
        });
      }
    }
  };
});
