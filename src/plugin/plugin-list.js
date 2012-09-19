/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "util/dragndrop", "util/lang", "editor/editor", "text!layouts/plugin-list-editor.html" ],
  function( DragNDrop, LangUtils, Editor, EDITOR_LAYOUT ) {

	return function( butter ) {

    var _parentElement = LangUtils.domFragment( EDITOR_LAYOUT, ".plugin-list-editor" ),
        _containerElement = _parentElement.querySelector( ".plugin-container" );

    var _pluginArchetype = _containerElement.querySelector( ".butter-plugin-tile" );
    _pluginArchetype.parentNode.removeChild( _pluginArchetype );

    Editor.register( "plugin-list", null, function( rootElement, butter ) {
      rootElement = _parentElement;

      Editor.BaseEditor( this, butter, rootElement, {
        open: function( parentElement ) {

        },
        close: function() {
        }
      });
    });

    butter.listen( "pluginadded", function( e ) {
      var element = _pluginArchetype.cloneNode( true ),
          iconImg = e.data.helper,
          icon = element.querySelector( ".butter-plugin-icon" ),
          text = element.querySelector( ".butter-plugin-label" ),
          pluginName = e.data.name;

      DragNDrop.helper( element, {
        start: function() {
          var targets = butter.targets,
              mediaContainer = document.getElementById( butter.currentMedia.target ),
              iframeVideo = mediaContainer.querySelector( "iframe" );

          if ( iframeVideo ) {
            iframeVideo.style.pointerEvents = "none";
          }

          for ( var i = 0, l = targets.length; i < l; ++i ) {
            targets[ i ].view.blink();
          }
        },
        stop: function() {

          var mediaContainer = document.getElementById( butter.currentMedia.target ),
              iframeVideo = mediaContainer.querySelector( "iframe" )

          if ( iframeVideo ) {
            iframeVideo.style.pointerEvents = "auto";
          }

          butter.currentMedia.pause();
        }
      });

      if ( iconImg ) {
        icon.style.backgroundImage = "url('" + iconImg.src + "')";
      }

      text.innerHTML = pluginName;

      element.setAttribute( "data-popcorn-plugin-type", e.data.type );
      element.setAttribute( "data-butter-draggable-type", "plugin" );

      _containerElement.appendChild( element );
    });

    // Open the plugin-list editor right after butter is finished starting up
    butter.listen( "ready", function() {
      butter.editor.openEditor( "plugin-list", true );
    });

	};

});
