/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "util/lang", "editor/editor", "util/uri", "text!layouts/media-editor.html" ],
  function( LangUtils, Editor, Uri, EDITOR_LAYOUT ) {

  var MAX_MEDIA_INPUTS = 4;

  return function( butter ) {
    var _parentElement =  LangUtils.domFragment( EDITOR_LAYOUT,".media-editor" ),
        _primaryMediaWrapper = LangUtils.domFragment( EDITOR_LAYOUT, ".primary-media-wrapper" ),
        _altMediaWrapper = LangUtils.domFragment( EDITOR_LAYOUT, ".alt-media-wrapper" ),
        _containerElement = _parentElement.querySelector( ".butter-editor-body" ),
        _currentMediaWrapper = _containerElement.querySelector( ".current-media-wrapper" ),
        _addAlternateSourceBtn = _containerElement.querySelector( ".add-alternate-media-source-btn" ),
        _mediaErrorMessage = _containerElement.querySelector( ".media-error-message" ),
        _media = butter.currentMedia,
        _inputCount = 0,
        _emptyInputs = 0,
        _this;

    function updateButterMedia() {
      var urlInputs = _currentMediaWrapper.querySelectorAll( "textarea" ),
          newMediaArr = [],
          url;

      for ( var i = 0, l = urlInputs.length; i < l; i++ ) {
        url = urlInputs[ i ].value;
        if ( url ) {
          newMediaArr.push( urlInputs[ i ].value );
        }
      }
      showError( false );
      _media.url = newMediaArr;
    }

    function createInput( url, isPrimaryInput ) {
      var wrapper = isPrimaryInput ? _primaryMediaWrapper.cloneNode( true ) : _altMediaWrapper.cloneNode( true ),
          urlInput = wrapper.querySelector( ".current-media-input" ),
          saveBtn = wrapper.querySelector( ".butter-media-save" ),
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

        if ( isPrimaryInput ) {
          altMediaLabel = wrapper.querySelector( ".alternate-media-label" );
          altMediaLabel.addEventListener( "click", function() {
            _parentElement.classList.toggle( "alternates-hidden" );
          }, false );
        }

        if ( !isPrimaryInput ) {
          deleteBtn = wrapper.querySelector( ".delete-media-btn" ),
          deleteBtn.addEventListener( "click", function() {
            removeMediaWrapper( wrapper );
            updateButterMedia();
          }, false );
        }

        urlInput.addEventListener( "focus", function() {
          oldValue = urlInput.value;
        });

        urlInput.addEventListener( "blur", updateMediaOnChange );
        saveBtn.addEventListener( "click", updateMediaOnChange, false );
        urlInput.addEventListener( "input", function() {
          if ( oldValue !== urlInput.value ) {
            saveBtn.classList.remove( "butter-disabled" );
          } else {
            saveBtn.classList.add( "butter-disabled" );
          }
        }, false );
        _this.wrapTextInputElement( urlInput );
        _currentMediaWrapper.appendChild( wrapper );
        _inputCount++;
        checkInputMax();
    }

    function clearCurrentMediaList() {
      var input;

      while( _currentMediaWrapper.firstChild ) {
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
      var url = _media.url;

      if ( !Array.isArray( url ) ) {
        url = [ url ];
      }

      for ( var i = 0, l = url.length; i < l; i++ ) {
        createInput( url[ i ], i === 0 );
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

    _media.listen( "mediacontentchanged", function() {
      _media = butter.currentMedia;
      clearCurrentMediaList();
      setup();
    });

    _media.listen( "mediafailed", function() {
      showError( true );
    });

    _media.listen( "mediaready", function() {
      showError( false );
    });

    Editor.register( "media-editor", null, function( rootElement, butter ) {
      rootElement = _parentElement;

      _this = this;

      Editor.BaseEditor( _this, butter, rootElement, {
        open: function() {
          clearCurrentMediaList();
          setup();
          document.querySelector( ".butter-editor-header-media" ).classList.add( "butter-active" );
        },
        close: function() {
          document.querySelector( ".butter-editor-header-media" ).classList.remove( "butter-active" );
        }
      });
    });
  };
});
