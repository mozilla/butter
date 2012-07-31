/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "util/dragndrop", "util/lang", "editor/editor", "text!layouts/plugin-list-editor.html" ],
  function( DragNDrop, LangUtils, Editor, EDITOR_LAYOUT ) {

	return function( butter ) {

    var _parentElement = LangUtils.domFragment( EDITOR_LAYOUT ),
        _containerElement = _parentElement.querySelector( ".container" );

    var _button = butter.ui.tray.pluginArea.querySelector( ".add-popcorn" );

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

    _button.addEventListener( "click", function() {
      // Open the 'plugin-list' editor as defined above, and force the
      // editor tray to open.
      butter.editor.openEditor( "plugin-list", true );
    }, false );

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

      if ( iconImg ) {
        icon.style.backgroundImage = "url('" + iconImg.src + "')";
      }

      text.innerHTML = e.data.type;

      element.setAttribute( "data-popcorn-plugin-type", e.data.type );
      element.setAttribute( "data-butter-draggable-type", "plugin" );

      _containerElement.appendChild( element );
    });
	};

});