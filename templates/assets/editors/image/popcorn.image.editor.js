/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function( Butter ) {

  var Editor = Butter.Editor;

  Editor.register( "image", "load!{{baseDir}}templates/assets/editors/image/popcorn.image.editor.html",
                   function( rootElement, butter, compiledLayout ) {

  var _this = this;

  var _rootElement = rootElement,
      _messageContainer = _rootElement.querySelector( "div.error-message" ),
      _inputIn = _rootElement.querySelector( "#editor-in-value" ),
      _inputOut = _rootElement.querySelector( "#editor-out-value" ),
      _dragDropRadio = _rootElement.querySelector( "#editor-dragdrop-radio" ),
      _urlRadio = _rootElement.querySelector( "#editor-url-radio" ),
      _flickrRadio = _rootElement.querySelector( "#editor-flickr-radio" ),
      _urlInput = _rootElement.querySelector( "#editor-url" ),
      _tagInput = _rootElement.querySelector( "#editor-flickr-tag" ),
      _galleryUrlInput = _rootElement.querySelector( "#editor-flickr-url" ),
      _numberInput = _rootElement.querySelector( "#editor-flickr-number" ),
      _transitionIn = _rootElement.querySelector( "#editor-in-select" ),
      _transitionOut = _rootElement.querySelector( "#editor-out-select" ),
      _urlActive = false,
      _flickrActive = false,
      _dragDropActive = false,
      _trackEvent;

  function onTrackEventUpdated( e ) {
    _trackEvent = e.target,
    update();
  }

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
    }
  }

  function toggleDragDrop() {
    _dragDropActive = false;
    updateTrackEvent( _trackEvent, {
      "src": ""
    });
  }

  function dragDropMode() {
    _dragDropActive = true;
    if ( _flickrActive ) {
      toggleFlickr( true );
    }
    if ( _urlActive ) {
      toggleUrl( true );
    }
    _dragDropRadio.checked = true;
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

  function update() {

    var popOpts = _trackEvent.popcornOptions,
        src = popOpts.src;

    _inputIn.value = popOpts.start;
    _inputOut.value = popOpts.end;

    if ( src ) {
      if ( /^data:/.test( src ) ) {
        dragDropMode();
      } else {
        urlMode();
        _urlInput.value = src;
      }
    } else if ( popOpts.tags ) {
      flickrMode();
      _tagInput.value = popOpts.tags;
    } else if ( popOpts.photosetId ) {
      flickrMode();
      _galleryUrlInput.value = popOpts.photosetId;
    }

    if ( popOpts.count && !_numberInput.disabled ) {
      _numberInput.value = popOpts.count;
    }

    _transitionIn.value = popOpts.transitionInClass;
    _transitionOut.value = popOpts.transitionOutClass;

  }

  function setupListeners() {

    _dragDropRadio.onchange = function() {
      dragDropMode();
    };

    _urlRadio.onchange = function() {
      urlMode();
    };

    _flickrRadio.onchange = function() {
      flickrMode();
    };

    _this.attachStartEndHandler( _inputIn, _trackEvent, "start", updateTrackEvent );
    _this.attachStartEndHandler( _inputOut, _trackEvent, "end", updateTrackEvent );

    _this.attachInputChangeHandler( _urlInput, _trackEvent, "src" );
    _this.attachInputChangeHandler( _tagInput, _trackEvent, "tags" );
    _this.attachInputChangeHandler( _numberInput, _trackEvent, "count" );

    _this.attachInputChangeHandler( _galleryUrlInput, _trackEvent, "photosetId", function( te, prop) {

      var id = /\d+$/.exec( prop.photosetId );

      if ( id ) {
        prop.photosetId = id[ 0 ];
        updateTrackEvent( te, prop );
      }
    });

    _this.attachSelectChangeHandler( _transitionIn, _trackEvent, "transitionInClass" );
    _this.attachSelectChangeHandler( _transitionOut, _trackEvent, "transitionOutClass" );

  }

  Editor.TrackEventEditor( _this, butter, rootElement, {
    open: function( parentElement, trackEvent ) {
      _this.applyExtraHeadTags( compiledLayout );
      _trackEvent = trackEvent;
      _trackEvent.listen( "trackeventupdated", onTrackEventUpdated );
      update();
      setupListeners();

    },
    close: function() {
      _this.removeExtraHeadTags();
      _trackEvent.unlisten( "trackeventupdated", onTrackEventUpdated );
    }
  });

  });

}( window.Butter ));