/*! This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "util/lang", "util/uri", "util/keys", "editor/editor", "text!layouts/media-editor.html" ],
  function( LangUtils, URI, KeysUtils, Editor, EDITOR_LAYOUT ) {

  var MAX_MEDIA_INPUTS = 4;

  var _parentElement =  LangUtils.domFragment( EDITOR_LAYOUT,".media-editor" ),
      _loadingSpinner = _parentElement.querySelector( ".media-loading-spinner" ),
      _primaryMediaWrapper = LangUtils.domFragment( EDITOR_LAYOUT, ".primary-media-wrapper" ),
      _altMediaWrapper = LangUtils.domFragment( EDITOR_LAYOUT, ".alt-media-wrapper" ),
      _containerElement = _parentElement.querySelector( ".butter-editor-body" ),
      _currentMediaWrapper = _containerElement.querySelector( ".current-media-wrapper" ),
      _addAlternateSourceBtn = _containerElement.querySelector( ".add-alternate-media-source-btn" ),
      _mediaErrorMessage = _containerElement.querySelector( ".media-error-message" ),
      _media,
      _inputCount = 0,
      _emptyInputs = 0,
      _this;

  function updateButterMedia() {
    var urlInputs = _currentMediaWrapper.querySelectorAll( "textarea" ),
        newMediaArr = [],
        url;

    for ( var i = 0, l = urlInputs.length; i < l; i++ ) {
      url = urlInputs[ i ].value;
      url = url.trim();

      // Deal with https://soundcloud URLs, which should actually be http://soundcloud (#2631)
      url = url.replace( /^https\:\/\/soundcloud\.com/, "http://soundcloud.com" );

      // Don't bother with empty strings
      if ( url ) {
        newMediaArr.push( url );
      }
    }
    if ( newMediaArr.length ) {
      showError( false );
      setLoadSpinner( true );
      _media.url = newMediaArr;
    }
  }

  function createInput( url, isPrimaryInput ) {
    var wrapper = isPrimaryInput ? _primaryMediaWrapper.cloneNode( true ) : _altMediaWrapper.cloneNode( true ),
        urlInput = wrapper.querySelector( ".current-media-input" ),
        applyBtn = wrapper.querySelector( ".butter-media-apply" ),
        altMediaLabel,
        deleteBtn,
        oldValue = "";

      urlInput.value = url;

      function checkInputMax() {
        if ( _inputCount >= MAX_MEDIA_INPUTS ) {
          _addAlternateSourceBtn.classList.add( "butter-disabled" );
        } else {
          _addAlternateSourceBtn.classList.remove( "butter-disabled" );
        }
      }

      function updateMediaOnChange() {
        if ( oldValue !== urlInput.value ) {
          updateButterMedia();
        }
      }

      function removeMediaWrapper() {
        if ( _inputCount > 1 && !isPrimaryInput ) {
          _currentMediaWrapper.removeChild( wrapper );
          _inputCount--;
          checkInputMax();
        }
      }

      function onInput() {
       if ( oldValue !== urlInput.value ) {
          applyBtn.classList.remove( "butter-disabled" );
        } else {
          applyBtn.classList.add( "butter-disabled" );
        }
      }

      function onEnter( e ) {
        if (  e.keyCode === KeysUtils.ENTER ) {
          e.preventDefault();
          updateMediaOnChange();
        }
      }

      if ( isPrimaryInput ) {
        altMediaLabel = wrapper.querySelector( ".alternate-media-label" );
        altMediaLabel.addEventListener( "click", function() {
          _parentElement.classList.toggle( "alternates-hidden" );
        }, false );
      }

      if ( !isPrimaryInput ) {
        deleteBtn = wrapper.querySelector( ".delete-media-btn" );
        deleteBtn.addEventListener( "click", function() {
          removeMediaWrapper( wrapper );
          updateButterMedia();
        }, false );
      }

      urlInput.addEventListener( "focus", function() {
        oldValue = urlInput.value;
      });

      applyBtn.addEventListener( "click", updateMediaOnChange, false );
      urlInput.addEventListener( "keydown", onEnter, false );
      urlInput.addEventListener( "input",  onInput, false );

      _this.wrapTextInputElement( urlInput );
      _currentMediaWrapper.appendChild( wrapper );
      _inputCount++;
      checkInputMax();
  }


  function setLoadSpinner( on ) {
    if ( on ) {
      _loadingSpinner.classList.remove( "hidden" );
    } else {
      _loadingSpinner.classList.add( "hidden" );
    }
  }

  function clearCurrentMediaList() {
    var input;

    while ( _currentMediaWrapper.firstChild ) {
      input = _currentMediaWrapper.querySelector( "textarea" );

      // count empty ones, so they can be added again
      if ( !input.value ) {
        _emptyInputs++;
      }

      _currentMediaWrapper.removeChild( _currentMediaWrapper.firstChild );
    }
    _inputCount = 0;
  }

  function setup() {
    var urls = _media.url,
        url;

    clearCurrentMediaList();

    if ( !Array.isArray( urls ) ) {
      urls = [ urls ];
    }

    for ( var i = 0, l = urls.length; i < l; i++ ) {
      url = urls[ i ];
      createInput( URI.stripUnique( url ).toString(), i === 0 );
    }
    while ( _emptyInputs ) {
      createInput( "" );
      _emptyInputs--;
    }
  }

  function showError( state ) {
    var inputs = _currentMediaWrapper.querySelectorAll( "textarea" );

    for ( var i = 0, l = inputs.length; i < l; i++ ) {
      if ( state ) {
        inputs[ i ].classList.add( "error" );
      } else {
        inputs[ i ].classList.remove( "error" );
      }
    }
    if ( state ) {
      _mediaErrorMessage.classList.remove( "hidden" );
    } else {
      _mediaErrorMessage.classList.add( "hidden" );
    }
  }

  function addAlternateSourceBtnHandler() {
    if ( _inputCount < MAX_MEDIA_INPUTS ) {
      createInput( "" );
    }
  }

  _addAlternateSourceBtn.addEventListener( "click", addAlternateSourceBtnHandler, false );

  function onMediaTimeout() {
    showError( true );
  }

  function onMediaReady() {
    showError( false );
    setLoadSpinner( false );
  }

  Editor.register( "media-editor", null, function( rootElement, butter ) {
    rootElement = _parentElement;
    _this = this;

    function onMediaContentChanged() {
      _media = butter.currentMedia;
      setup();
    }

    Editor.BaseEditor.extend( _this, butter, rootElement, {
      open: function() {
        _media = butter.currentMedia;

        _media.listen( "mediaready", onMediaReady );
        _media.listen( "mediacontentchanged", onMediaContentChanged );
        _media.listen( "mediatimeout", onMediaTimeout );

        // Ensure the loading spinner is off when the media is ready. Otherwise, keep it spinning.
        if ( _media.ready ) {
          setLoadSpinner( false );
        } else {
          setLoadSpinner( true );
        }

        setup();
      },
      close: function() {
        _media.unlisten( "mediaready", onMediaReady );
        _media.unlisten( "mediacontentchanged", onMediaContentChanged );
        _media.unlisten( "mediatimeout", onMediaTimeout );
        document.querySelector( ".butter-editor-header-media" ).classList.remove( "butter-active" );
      }
    });
  });
});
