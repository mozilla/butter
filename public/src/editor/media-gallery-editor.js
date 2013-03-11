/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "util/lang", "util/uri", "util/keys", "util/mediatypes", "editor/editor",
 "util/time", "util/dragndrop", "text!layouts/media-editor.html" ],
  function( LangUtils, URI, KeysUtils, MediaUtils, Editor, Time, DragNDrop, EDITOR_LAYOUT ) {

  var _parentElement =  LangUtils.domFragment( EDITOR_LAYOUT,".media-editor" ),
      _addMediaTitle = _parentElement.querySelector( ".add-new-media" ),
      _addMediaPanel = _parentElement.querySelector( ".add-media-panel" ),

      _urlInput = _addMediaPanel.querySelector( ".add-media-input" ),
      _addBtn = _addMediaPanel.querySelector( ".add-media-btn" ),
      _errorMessage = _parentElement.querySelector( ".media-error-message" ),
      _oldValue,
      _loadingSpinner = _parentElement.querySelector( ".media-loading-spinner" ),

      _galleryPanel = _parentElement.querySelector( ".media-gallery" ),
      _galleryList = _galleryPanel.querySelector( ".media-gallery-list" ),
      _GALLERYITEM = LangUtils.domFragment( EDITOR_LAYOUT, ".media-gallery-item" ),

      _durationInput = _parentElement.querySelector( ".media-base-duration" ),

      _butter,
      _media,
      _mediaLoadTimeout,
      _cancelSpinner,
      MEDIA_LOAD_TIMEOUT = 10000,
      TIMEOUT_ERROR = "Your media source is taking too long to load",
      _this,
      TRANSITION_TIME = 2000;

  function toggleAddNewMediaPanel() {
    _parentElement.classList.toggle( "add-media-collapsed" );
  }

  function resetInput() {
    _urlInput.value = "";

    clearTimeout( _mediaLoadTimeout );
    clearTimeout( _cancelSpinner );
    _urlInput.classList.remove( "error" );
    _addMediaPanel.classList.remove( "invalid-field" );
    _errorMessage.classList.add( "hidden" );
    _loadingSpinner.classList.add( "hidden" );

    _addBtn.classList.add( "hidden" );
  }

  function setBaseDuration( duration ) {
    var durationTimeCode = Time.toTimecode( duration ),
        durationSeconds = Time.toSeconds( duration );

    // Don't accept empty inputs or negative/zero values for duration.
    if ( duration === "" || durationSeconds <= 0 ) {
      _durationInput.value = Time.toTimecode( _media.duration );
      return;
    }

    // If the entered value wasn't in time code format.
    if ( _durationInput.value !== durationTimeCode ) {
      _durationInput.value = durationTimeCode;
    }

    // If the seconds version of the duration is already our current duration
    // bail early.
    if ( durationSeconds === _media.duration ) {
      return;
    }

    _media.url = "#t=," + durationSeconds;
  }

  function onDenied( error ) {
    clearTimeout( _cancelSpinner );
    clearTimeout( _mediaLoadTimeout );
    _errorMessage.innerHTML = error;
    _loadingSpinner.classList.add( "hidden" );
    _addMediaPanel.classList.add( "invalid-field" );
    setTimeout( function() {
      _errorMessage.classList.remove( "hidden" );
    }, 300 );
  }

  function addElements( data, el ) {
    el = el || _GALLERYITEM.cloneNode( true );

    var deleteBtn = el.querySelector( ".mg-delete-btn" ),
        thumbnailBtn = el.querySelector( ".mg-thumbnail" ),
        thumbnailImg,
        source = data.source;

    DragNDrop.helper( thumbnailBtn, {
      pluginOptions: {
        source: data.source,
        denied: data.denied,
        end: data.duration,
        from: data.from || 0,
        title: data.title,
        duration: data.duration,
        hidden: data.hidden
      },
      start: function() {
        for ( var i = 0, l = _butter.targets.length; i < l; ++i ) {
          _butter.targets[ i ].iframeDiv.style.display = "block";
        }
      },
      stop: function() {
        _butter.currentMedia.pause();
        for ( var i = 0, l = _butter.targets.length; i < l; ++i ) {
          _butter.targets[ i ].iframeDiv.style.display = "none";
        }
      }
    });

    thumbnailBtn.setAttribute( "data-popcorn-plugin-type", "sequencer" );
    thumbnailBtn.setAttribute( "data-butter-draggable-type", "plugin" );
    deleteBtn.addEventListener( "click", function() {

    thumbnailBtn.removeEventListener( "click", addEvent, false );
      _galleryList.removeChild( el );
      _this.scrollbar.update();
      delete _media.clipData[ source ];
      _butter.dispatch( "mediaclipremoved" );
    }, false );

    _loadingSpinner.classList.add( "hidden" );

    el.querySelector( ".mg-title" ).innerHTML = data.title;
    el.querySelector( ".mg-type" ).classList.add( data.type.toLowerCase() + "-icon" );
    el.querySelector( ".mg-type-text" ).innerHTML = data.type;
    el.querySelector( ".mg-duration" ).innerHTML = Time.toTimecode( data.duration, 0 );
    if ( data.type === "HTML5" ) {
      thumbnailImg = data.thumbnail;
    } else {
      thumbnailImg = document.createElement( "img" );
      thumbnailImg.src = data.thumbnail;
    }
    thumbnailBtn.appendChild( thumbnailImg );
    thumbnailBtn.src = data.thumbnail;

    el.classList.add( "mg-" + data.type.toLowerCase() );

    if ( data.denied ) {
      el.querySelector( ".mg-error" ).innerHTML = "Embedding disabled by request";
    }

    function addEvent() {
      var start = _butter.currentTime,
          end = start + data.duration,
          playWhenReady = false,
          trackEvent;

      function addTrackEvent() {
        var popcornOptions = {
          source: URI.makeUnique( data.source ).toString(),
          denied: data.denied,
          start: start,
          end: end,
          from: data.from || 0,
          title: data.title,
          duration: data.duration,
          hidden: data.hidden || false
        };

        trackEvent = _butter.generateSafeTrackEvent( "sequencer", popcornOptions );
      }

      if ( end > _media.duration ) {
        _butter.listen( "mediaready", function onMediaReady() {
          _butter.unlisten( "mediaready", onMediaReady );
          if ( playWhenReady ) {
            _media.play();
          }
          addTrackEvent();
        });

        playWhenReady = !_media.paused;
        setBaseDuration( end );
      } else {
        addTrackEvent();
      }
    }

    thumbnailBtn.addEventListener( "click", addEvent, false );

    _galleryList.insertBefore( el, _galleryList.firstChild );

    if ( _this.scrollbar ) {
      _this.scrollbar.update();
    }
    resetInput();
  }

  function onSuccess( data ) {
    var el = _GALLERYITEM.cloneNode( true ),
        source = data.source;

    if ( !_media.clipData[ source ] ) {
      _media.clipData[ source ] = data;
      _butter.dispatch( "mediaclipadded" );

      el.classList.add( "new" );

      setTimeout(function() {
        el.classList.remove( "new" );
      }, TRANSITION_TIME );

      addElements( data, el );
    } else {
      onDenied( "Your gallery already has that media added to it" );
    }
  }

  function addMediaToGallery( url, onDenied ) {
    var data = {};

    // Don't trigger with empty inputs
    if ( !url ) {
      return;
    }

    data.source = url;
    data.type = "sequencer";
    _mediaLoadTimeout = setTimeout( function() {
      _errorMessage.innerHTML = TIMEOUT_ERROR;
      _errorMessage.classList.remove( "hidden" );
      _addMediaPanel.classList.add( "invalid-field" );
    }, MEDIA_LOAD_TIMEOUT );
    MediaUtils.getMetaData( data.source, onSuccess, onDenied );
  }

  function onFocus() {
    _oldValue = _urlInput.value;
  }

  function onInput() {
    if ( _urlInput.value ) {
      _addBtn.classList.remove( "hidden" );
    } else {
      _addBtn.classList.add( "hidden" );
    }
    clearTimeout( _cancelSpinner );
    clearTimeout( _mediaLoadTimeout );
    _addMediaPanel.classList.remove( "invalid-field" );
    _loadingSpinner.classList.add( "hidden" );
    _errorMessage.classList.add( "hidden" );
  }

  function onEnter( e ) {
    if ( e.keyCode === KeysUtils.ENTER ) {
      e.preventDefault();
      onAddMediaClick();
    }
  }

  function onBlur( e ) {
    e.preventDefault();
    setBaseDuration( _durationInput.value );
  }

  function onAddMediaClick() {
    // transitionend event is not reliable and not cross browser supported.
    _cancelSpinner = setTimeout( function() {
      _loadingSpinner.classList.remove( "hidden" );
    }, 300 );
    _addBtn.classList.add( "hidden" );
    addMediaToGallery( _urlInput.value, onDenied );
  }

  function setup() {
    _addMediaTitle.addEventListener( "click", toggleAddNewMediaPanel, false );

    _urlInput.addEventListener( "focus", onFocus, false );
    _urlInput.addEventListener( "input", onInput, false );
    _urlInput.addEventListener( "keydown", onEnter, false );

    _addBtn.addEventListener( "click", onAddMediaClick, false );

    _durationInput.addEventListener( "keydown", onDurationChange, false );
    _durationInput.addEventListener( "blur", onBlur, false );
  }

  function onDurationChange( e ) {
    if ( e.keyCode === KeysUtils.ENTER ) {
      e.preventDefault();
      setBaseDuration( _durationInput.value );
    }
  }

  Editor.register( "media-editor", null, function( rootElement, butter ) {
    rootElement = _parentElement;
    _this = this;
    _butter = butter;
    _media = _butter.currentMedia;

    // We keep track of clips that are in the media gallery for a project once it is saved
    // and every time after it is saved.
    var clips = _media.clipData,
        clip;

    for ( var key in clips ) {
      if ( clips.hasOwnProperty( key ) ) {
        clip = clips[ key ];
        if ( typeof clip === "object" ) {
          addElements( clip );
        } else if ( typeof clip === "string" ) {
          // Load projects saved with just the url the old way.
          // Remove it too, so future saves don't come through here.
          delete clips[ key ];
          // Fire an onSuccess so a new, updated clip is added to clipData.
          MediaUtils.getMetaData( clip, onSuccess );
        }
      }
    }

    setup();

    Editor.BaseEditor.extend( _this, butter, rootElement, {
      open: function() {
        setBaseDuration( _media.duration );
      },
      close: function() {}
    });

  }, true );
});
