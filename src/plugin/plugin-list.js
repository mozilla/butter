/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "util/dragndrop", "util/lang", "editor/editor", "text!layouts/plugin-list-editor.html" ],
  function( DragNDrop, LangUtils, Editor, EDITOR_LAYOUT ) {

	return function( butter ) {

    var _parentElement = LangUtils.domFragment( EDITOR_LAYOUT, ".plugin-list-editor" ),
        _containerElement = _parentElement.querySelector( ".container" );

    var _pluginArchetype = _containerElement.querySelector( "div" );
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
          icon = element.querySelector( "span.icon" ),
          text = element.querySelector( "span.label" );

      DragNDrop.helper( element, {
        start: function() {
          var targets = butter.targets,
              media = butter.currentMedia;
          media.view.blink();
          for ( var i = 0, l = targets.length; i < l; ++i ) {
            targets[ i ].view.blink();
          }
        },
        stop: function() {

        }
      });

      element.addEventListener( "dblclick", function( e ) {
        var media = butter.currentMedia;
         media.tracks[0].view.dispatch( "plugindropped", {
            start: media.currentTime,
            track: media.tracks[ 0 ],
            type: element.getAttribute( "data-popcorn-plugin-type" )
          });
      }, false );

      if ( iconImg ) {
        icon.style.backgroundImage = "url('" + iconImg.src + "')";
      }

      text.innerHTML = e.data.type;

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
