/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "util/lang", "util/xhr", "util/keys", "util/mediatypes", "editor/editor", "text!layouts/media-editor.html" ],
  function( LangUtils, XHR, KeysUtils, MediaUtils, Editor, EDITOR_LAYOUT ) {

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

      _butter,
      _this;

  function toggleAddNewMediaPanel() {
    _parentElement.classList.toggle( "add-media-collapsed" );
  }

  function resetInput() {
    _urlInput.value = "";

    _urlInput.classList.remove( "error" );
    _errorMessage.classList.add( "hidden" );
    _loadingSpinner.classList.add( "hidden" );

      // Don't bother with empty strings
      if ( url ) {
        newMediaArr.push( url );
      }
    }
    if ( newMediaArr.length ) {
      // Delete events before media updates, otherwise the project will be in a dirty state
      if ( _butter.project.deleteDefaultEventsOnMediaChange ) {
        _butter.currentMedia.clear();
        _butter.currentMedia.addTrack();
      }

      showError( false );
      setLoadSpinner( true );
      _media.url = newMediaArr;
    }

    _addBtn.classList.add( "hidden" );
    _cancelBtn.classList.add( "hidden" );
  }

  function onSuccess( data ) {
    var el = _GALLERYITEM.cloneNode( true ),
        deleteBtn = el.querySelector( ".mg-delete-btn" ),
        thumbnailEl;

    _loadingSpinner.classList.add( "hidden" );

    el.querySelector( ".mg-title" ).innerHTML = data.title;
    el.querySelector( ".mg-url" ).innerHTML = data.source;
    el.querySelector( ".mg-duration" ).innerHTML = data.duration;
    if ( data.type === "html5" ) {
      thumbnailEl = data.thumbnail;
    } else {
      thumbnailEl = document.createElement( "img" );
      thumbnailEl.src = data.thumbnail;
    }
    el.querySelector( ".mg-thumbnail" ).appendChild( thumbnailEl );
    el.querySelector( ".mg-thumbnail" ).src = data.thumbnail;

    el.classList.add( "mg-" + data.type );
    el.classList.add( "new" );

    setTimeout( function() {
      el.classList.remove( "new" );
    }, 2000 );

    function addEvent() {
      var trackEvent = _butter.generateSafeTrackEvent( "sequencer", _butter.currentTime );
      trackEvent.popcornOptions.source = data.source;
      trackEvent.popcornOptions.end = Math.min.apply( Math, [ _butter.currentTime + data.duration, _butter.media.duration ] );
      trackEvent.update( trackEvent.popcornOptions );
      trackEvent.selected = true;
    }

    el.addEventListener( "click", addEvent, false );

    deleteBtn.addEventListener( "click", function( e ) {
      el.removeEventListener( "click", addEvent, false );
      _galleryList.removeChild( el );
    }, false );

    if ( _galleryList.firstChild ) {
      _galleryList.insertBefore( el, _galleryList.firstChild );
    } else {
      _galleryList.appendChild( el );
    }

    resetInput();
  }

  function onError( data ) {
    console.log( "There was an error", data );
    _urlInput.classList.add( "error" );
    _errorMessage.classList.remove( "hidden" );
  }

 function addMediaToGallery() {
    var data = {};

    data.source = _urlInput.value;
    data.type = "sequencer";

    _loadingSpinner.classList.remove( "hidden" );
    MediaUtils.getMetaData( data.source, onSuccess );
  }

  function onFocus( e ) {
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
    if (  e.keyCode === KeysUtils.ENTER ) {
      e.preventDefault();
      addMediaToGallery();
    }
  }

  function setup() {
    _addMediaTitle.addEventListener( "click", toggleAddNewMediaPanel, false );

    _urlInput.addEventListener( "focus", onFocus, false );
    _urlInput.addEventListener( "input", onInput, false );
    _urlInput.addEventListener( "keydown", onEnter, false );

    _addBtn.addEventListener( "click", addMediaToGallery, false );
    _cancelBtn.addEventListener( "click", resetInput, false );
  }

  Editor.register( "media-editor", null, function( rootElement, butter ) {
    rootElement = _parentElement;
    _this = this;
    _butter = butter;

    setup();

    Editor.BaseEditor.extend( _this, butter, rootElement, {
      open: function() {
      },
      close: function() {
      }
    });
  });
});
