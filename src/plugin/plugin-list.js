/*! This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "util/dragndrop", "util/lang", "editor/editor", "text!layouts/plugin-list-editor.html" ],
  function( DragNDrop, LangUtils, Editor, EDITOR_LAYOUT ) {

  return function( butter ) {

    var _parentElement = LangUtils.domFragment( EDITOR_LAYOUT, ".plugin-list-editor" ),
        _containerElement = _parentElement.querySelector( ".plugin-container" ),
        _targets = butter.targets,
        _iframeCovers = [],
        _iframeCover;

    for ( var i = 0, l = _targets.length; i < l; i++ ) {
      _iframeCover = document.createElement( "div" );
      _iframeCover.classList.add( "butter-iframe-fix" );
      _targets[ i ].element.appendChild( _iframeCover );
      _iframeCovers.push( _iframeCover );
    }

    var _pluginArchetype = _containerElement.querySelector( ".butter-plugin-tile" );
    _pluginArchetype.parentNode.removeChild( _pluginArchetype );

    Editor.register( "plugin-list", null, function( rootElement, butter ) {
      rootElement = _parentElement;

      Editor.BaseEditor.extend( this, butter, rootElement, {
        open: function( parentElement ) {
        },
        close: function() {
        }
      });
    }, true );

    butter.listen( "pluginadded", function( e ) {
      var element = _pluginArchetype.cloneNode( true ),
          iconImg = e.data.helper,
          icon = element.querySelector( ".butter-plugin-icon" ),
          text = element.querySelector( ".butter-plugin-label" ),
          pluginName = e.data.name;

      DragNDrop.helper( element, {
        start: function() {
          for ( var i = 0, l = _targets.length; i < l; ++i ) {
            _targets[ i ].view.blink();
            _iframeCovers[ i ].style.display = "block";
          }
        },
        stop: function() {
          butter.currentMedia.pause();
          for ( var i = 0, l = _targets.length; i < l; ++i ) {
            _iframeCovers[ i ].style.display = "none";
          }
        }
      });

      function onDoubleClick() {
        var trackEvent;

        if ( butter.currentMedia.ready ) {
          trackEvent = butter.generateSafeTrackEvent( e.data.type, butter.currentTime );
          butter.editor.editTrackEvent( trackEvent );
        }
      }

      element.addEventListener( "dblclick", onDoubleClick, false );

      if ( iconImg ) {
        icon.style.backgroundImage = "url('" + iconImg.src + "')";
      }

      text.innerHTML = pluginName;

      element.setAttribute( "data-popcorn-plugin-type", e.data.type );
      element.setAttribute( "data-butter-draggable-type", "plugin" );

      _containerElement.appendChild( element );
    });

    // Open the plugin-list editor right after butter is finished starting up
    butter.listen( "mediaready", function() {
      butter.editor.openEditor( "plugin-list" );
    });
  };
});
