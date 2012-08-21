/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function( Butter ) {

  var Editor = Butter.Editor;

  Editor.register( "image", "load!{{baseDir}}templates/assets/editors/image/popcorn.image.editor.html",
                   function( rootElement, butter, compiledLayout ) {

  var _rootElement = rootElement,
      _messageContainer = _rootElement.querySelector( "div.error-message" ),
      _urlRadio = _rootElement.querySelector( "#editor-url-radio" ),
      _flickrRadio = _rootElement.querySelector( "#editor-flickr-radio" ),
      _urlInput = _rootElement.querySelector( "#editor-url" ),
      _tagInput = _rootElement.querySelector( "#editor-flickr-tag" ),
      _galleryUrlInput = _rootElement.querySelector( "#editor-flickr-url" ),
      _numberInput = _rootElement.querySelector( "#editor-flickr-number" ),
      _urlActive = false,
      _flickrActive = false,
      _dragDropActive = false,
      _trackEvent,
      _this = this;

  function toggleFlickr( state ) {
    _tagInput.disabled = _galleryUrlInput.disabled = _numberInput.disabled = state;
    _tagInput.value = _galleryUrlInput.value = _numberInput.value = "";
    _flickrActive = !state;
    if ( state ) {
      updateTrackEvent( _trackEvent, {
        "tags": "",
        "photosetId": "",
        "count": ""
      });
    } else {
      _tagInput.classList.remove( "butter-editor-disabled" );
      _galleryUrlInput.classList.remove( "butter-editor-disabled" );
      _numberInput.classList.remove( "butter-editor-disabled" );
      _urlInput.classList.add( "butter-editor-disabled" );
    }
  }

  function toggleUrl( state ) {
    _urlInput.disabled = state;
    _urlInput.value = "";
    _urlActive = !state;
    if ( state && !_dragDropActive ) {
      updateTrackEvent( _trackEvent, {
        "src": ""
      });
    } else if ( !state ) {
      _tagInput.classList.add( "butter-editor-disabled" );
      _galleryUrlInput.classList.add( "butter-editor-disabled" );
      _numberInput.classList.add( "butter-editor-disabled" );
      _urlInput.classList.remove( "butter-editor-disabled" );
    }
  }

  function toggleDragDrop() {
    _dragDropActive = false;
    updateTrackEvent( _trackEvent, {
      "src": ""
    });
  }

  function dragDropMode() {
    _tagInput.classList.add( "butter-editor-disabled" );
    _galleryUrlInput.classList.add( "butter-editor-disabled" );
    _numberInput.classList.add( "butter-editor-disabled" );
    _urlInput.classList.add( "butter-editor-disabled" );
    _dragDropActive = true;
    if ( _flickrActive ) {
      toggleFlickr( true );
    }
    if ( _urlActive ) {
      toggleUrl( true );
    }
  }

  function urlMode() {
    if ( _flickrActive ) {
      toggleFlickr( true );
    } else if ( _dragDropActive ) {
      toggleDragDrop();
    }
    toggleUrl( false );
    _urlRadio.checked = true;
  }

  function flickrMode() {
    if ( _urlActive ) {
      toggleUrl( true );
    } else if ( _dragDropActive ) {
      toggleDragDrop();
    }
    toggleFlickr( false );
    _flickrRadio.checked = true;
  }

  function setErrorState( message ) {
    if ( message ) {
      _messageContainer.innerHTML = message;
      _messageContainer.parentNode.style.height = _messageContainer.offsetHeight + "px";
      _messageContainer.parentNode.style.visibility = "visible";
      _messageContainer.parentNode.classList.add( "open" );
    }
    else {
      _messageContainer.innerHTML = "";
      _messageContainer.parentNode.style.height = "";
      _messageContainer.parentNode.style.visibility = "";
      _messageContainer.parentNode.classList.remove( "open" );
    }
  }

  function updateTrackEvent( te, props ) {
    setErrorState( false );
    try {
      te.update( props );
    }
    catch ( e ) {
      setErrorState( e.toString() );
    }
  }

  function setup( trackEvent ) {
    _trackEvent = trackEvent;

    var container = _rootElement.querySelector( ".editor-options" ),
        pluginOptions = {},
        ignoreKeys = [
          "src",
          "tags",
          "photosetId",
          "count",
          "username",
          "target"
        ];

    function callback( elementType, element, trackEvent, name ) {
      pluginOptions[ name ] = {
        element: element,
        trackEvent: trackEvent,
        elementType: elementType
      };
    }

    function attachHandlers() {
      var start = pluginOptions.start.element.parentNode.parentNode,
          end = pluginOptions.end.element.parentNode.parentNode,
          sourceWrapper = _rootElement.querySelector( ".editor-source" ),
          src = _trackEvent.popcornOptions.src;

      // Move start and end to first elements in editor
      container.insertBefore( start, sourceWrapper );
      container.insertBefore( end, sourceWrapper );

      // Determine initial state
      if ( src ) {
        if ( /^data:/.test( src ) ) {
          dragDropMode();
          toggleFlickr( true );
          toggleUrl( true );
        } else {
          urlMode();
          toggleFlickr( true );
        }
      } else {
        toggleUrl( true );
        flickrMode();
      }

      _urlRadio.onchange = function() {
        urlMode();
      };

      _flickrRadio.onchange = function() {
        flickrMode();
      };

      _this.attachInputChangeHandler( _urlInput, _trackEvent, "src", updateTrackEvent );
      _this.attachInputChangeHandler( _tagInput, _trackEvent, "tags", function( te, prop ) {
        te.update({
          tags: prop.tags,
          photosetId: ""
        });
      });
      _this.attachInputChangeHandler( _numberInput, _trackEvent, "count", updateTrackEvent );
      _this.attachInputChangeHandler( pluginOptions.start.element, _trackEvent, "start", updateTrackEvent );
      _this.attachInputChangeHandler( pluginOptions.end.element, _trackEvent, "end", updateTrackEvent );
      _this.attachSelectChangeHandler( pluginOptions.transition.element, _trackEvent, "transition", updateTrackEvent );

      _this.attachInputChangeHandler( _galleryUrlInput, _trackEvent, "photosetId", function( te, prop ) {

        var id = /\d+$/.exec( prop.photosetId );

        if ( id ) {
          prop.photosetId = id[ 0 ];
          updateTrackEvent( te, prop );
        }
      });
    }

    _this.createPropertiesFromManifest( trackEvent, callback, null, container, null, ignoreKeys );
    attachHandlers();

    _this.updatePropertiesFromManifest( trackEvent );
    _this.scrollbar.update();
  }

  Editor.TrackEventEditor( _this, butter, rootElement, {
    open: function( parentElement, trackEvent ) {
      _this.applyExtraHeadTags( compiledLayout );
      _trackEvent = trackEvent;
      _trackEvent.listen( "trackeventupdated", function( e ) {
        _trackEvent = e.target;
        _this.updatePropertiesFromManifest( _trackEvent );

        // Prevent dataURIs from appearing in the editor
        if ( !/^data:image/.test( _trackEvent.popcornOptions.src ) ) {
          _urlInput.value = _trackEvent.popcornOptions.src;
        } else if ( _trackEvent.popcornOptions.src ) {
          dragDropMode();
        }
        setErrorState( false );
      });
      
      setup( trackEvent );
    },
    close: function() {
      _this.removeExtraHeadTags();
      _trackEvent.unlisten( "trackeventupdated" );
    }
  });

  });

}( window.Butter ));
