/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "util/lang", "util/xhr", "util/keys", "util/mediatypes", "editor/editor",
 "util/time", "util/dragndrop", "text!layouts/media-editor.html" ],
  function( LangUtils, XHR, KeysUtils, MediaUtils, Editor, Time, DragNDrop, EDITOR_LAYOUT ) {

  var _parentElement =  LangUtils.domFragment( EDITOR_LAYOUT,".media-editor" ),
      _addMediaTitle = _parentElement.querySelector( ".add-new-media" ),
      _addMediaPanel = _parentElement.querySelector( ".add-media-panel" ),

      _urlInput = _addMediaPanel.querySelector( ".add-media-input" ),
      _addBtn = _addMediaPanel.querySelector( ".add-media-btn" ),
      _cancelBtn = _addMediaPanel.querySelector( ".add-media-cancel-btn" ),
      _errorMessage = _parentElement.querySelector( ".media-error-message" ),
      _oldValue,
      _loadingSpinner = _parentElement.querySelector( ".media-loading-spinner" ),

      _galleryPanel = _parentElement.querySelector( ".media-gallery" ),
      _galleryList = _galleryPanel.querySelector( ".media-gallery-list" ),
      _GALLERYITEM = LangUtils.domFragment( EDITOR_LAYOUT, ".media-gallery-item" ),

      _durationInput = _parentElement.querySelector( ".media-base-duration" ),

      _butter,
      _media,
      _this,
      _guid = 0;

  function toggleAddNewMediaPanel() {
    _parentElement.classList.toggle( "add-media-collapsed" );
  }

  function resetInput() {
    _urlInput.value = "";

    _urlInput.classList.remove( "error" );
    _errorMessage.classList.add( "hidden" );
    _loadingSpinner.classList.add( "hidden" );

    _addBtn.classList.add( "hidden" );
    _cancelBtn.classList.add( "hidden" );
  }

  function setBaseDuration( duration ) {
    if ( duration === "" ) {
      _durationInput.value = Time.toTimecode( _media.duration );
      return;
    }
    duration = Time.toTimecode( duration );
    if ( _durationInput.value !== duration ) {
      _durationInput.value = Time.toTimecode( duration );
    }
    if ( duration !== _media.duration ) {
      duration = Time.toSeconds( duration );
    }
    if ( duration === _media.duration ) {
      return;
    }
    if ( /[0-9]{1,9}/.test( duration ) ) {
      _media.url = "#t=," + duration;
    } else {
      _media.url = duration;
    }
  }

  function onSuccess( data ) {
    var el = _GALLERYITEM.cloneNode( true ),
        deleteBtn = el.querySelector( ".mg-delete-btn" ),
        thumbnailBtn = el.querySelector( ".mg-thumbnail" ),
        thumbnailImg,
        idx = _guid++;

    DragNDrop.helper( thumbnailBtn, {
      pluginOptions: {
        source: data.source,
        denied: data.denied,
        end: data.duration,
        from: data.from,
        title: data.title,
        duration: data.duration,
        hidden: data.hidden
      }
    });

    if ( !_media.clipData[ idx ] ) {
      _media.clipData[ idx ] = data.source;
      _butter.dispatch( "mediaclipadded" );

      el.classList.add( "new" );

      setTimeout(function() {
        el.classList.remove( "new" );
      }, 2000 );
    }

    thumbnailBtn.setAttribute( "data-popcorn-plugin-type", "sequencer" );
    thumbnailBtn.setAttribute( "data-butter-draggable-type", "plugin" );
    deleteBtn.addEventListener( "click", function() {

      thumbnailBtn.removeEventListener( "click", addEvent, false );
      _galleryList.removeChild( el );

      delete _media.clipData[ idx ];
      _butter.dispatch( "mediaclipremoved" );
    }, false );

    _loadingSpinner.classList.add( "hidden" );

    el.querySelector( ".mg-title" ).innerHTML = data.title;
    el.querySelector( ".mg-type" ).innerHTML = data.type;
    el.querySelector( ".mg-duration" ).innerHTML = Time.toTimecode( data.duration, 0 );
    if ( data.type === "html5" ) {
      thumbnailImg = data.thumbnail;
    } else {
      thumbnailImg = document.createElement( "img" );
      thumbnailImg.src = data.thumbnail;
    }
    thumbnailBtn.appendChild( thumbnailImg );
    thumbnailBtn.src = data.thumbnail;

    el.classList.add( "mg-" + data.type );

    if ( data.denied ) {
      el.querySelector( ".mg-error" ).innerHTML = "Embedding disabled by request";
    }

    function addEvent() {
      var start = _butter.currentTime,
          end = start + data.duration,
          trackEvent;

      function addTrackEvent() {
        trackEvent = _butter.generateSafeTrackEvent( "sequencer", start, end );

        trackEvent.update({
          source: data.source,
          denied: data.denied,
          start: start,
          end: end,
          from: data.from,
          title: data.title,
          duration: data.duration,
          hidden: data.hidden
        });
      }

      if ( end > _media.duration ) {
        _butter.listen( "mediaready", function onMediaReady() {
          _butter.unlisten( "mediaready", onMediaReady );
          addTrackEvent();
        });

        setBaseDuration( end );
      } else {
        addTrackEvent();
      }
    }

    thumbnailBtn.addEventListener( "click", addEvent, false );

    _galleryList.insertBefore( el, _galleryList.firstChild );

    resetInput();
  }

  function addMediaToGallery() {
    var data = {},
        val = _urlInput.value;

    // Don't trigger with empty inputs
    if ( !val ) {
      return;
    }

    data.source = val;
    data.type = "sequencer";

    _loadingSpinner.classList.remove( "hidden" );
    MediaUtils.getMetaData( data.source, onSuccess );
  }

  function onFocus() {
    _oldValue = _urlInput.value;
  }

  function onInput() {
   if ( _oldValue !== _urlInput.value ) {
      _addBtn.classList.remove( "hidden" );
      _cancelBtn.classList.remove( "hidden" );
    } else {
      _addBtn.classList.add( "hidden" );
      _cancelBtn.classList.add( "hidden" );
    }
  }

  function onEnter( e ) {
    if ( e.keyCode === KeysUtils.ENTER ) {
      e.preventDefault();
      addMediaToGallery();
    }
  }

  function onBlur( e ) {
    e.preventDefault();
    setBaseDuration( _durationInput.value );
  }

  function setup() {
    _addMediaTitle.addEventListener( "click", toggleAddNewMediaPanel, false );

    _urlInput.addEventListener( "focus", onFocus, false );
    _urlInput.addEventListener( "input", onInput, false );
    _urlInput.addEventListener( "keydown", onEnter, false );

    _addBtn.addEventListener( "click", addMediaToGallery, false );
    _cancelBtn.addEventListener( "click", resetInput, false );

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
    var clips = _media.clipData;

    for ( var key in clips ) {
      if ( clips.hasOwnProperty( key ) ) {
        MediaUtils.getMetaData( clips[ key ], onSuccess );
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
