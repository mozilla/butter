/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "util/lang", "editor/editor", "util/uri", "ui/widget/textbox", "text!layouts/media-editor.html" ],
  function( LangUtils, Editor, Uri, TextboxWrapper, EDITOR_LAYOUT ) {

  return function( butter ) {

    var __URL_INPUT_INNER_WRAPPER = LangUtils.domFragment( "<div class=\"media-editor-inner-wrapper\"></div>", "div" ),
        __URL_INPUT_FRAG = LangUtils.domFragment( "<textarea class=\"current-media-input\" placeholder=\"http://\"></textarea>", "textarea" ),
        __URL_INPUT_DEL_FRAG = LangUtils.domFragment( "<a class=\"delete-media-btn\"><i class=\"icon icon-trash\" ></i></a>", "a" ),
        __ALT_MEDIA_LABEL = LangUtils.domFragment( EDITOR_LAYOUT, ".alternate-media-label" ),
        _parentElement = LangUtils.domFragment( EDITOR_LAYOUT,".media-editor" ),
        _containerElement = _parentElement.querySelector( ".container" ),
        _confirmNewMedia = _containerElement.querySelector( "#update-media-source-btn" ),
        _cancelNewMedia = _containerElement.querySelector( "#cancel-media-source-btn" ),
        _currentMediaDiv = _containerElement.querySelector( "#current-media-div" ),
        _currentMediaWrapper = _containerElement.querySelector( "#current-media-wrapper" ),
        _alternateMediaWarning = _containerElement.querySelector( "#alternate-media-warning" ),
        _addAlternateSourceBtn = _containerElement.querySelector( "#add-alternate-media-source-btn" ),
        _mediaErrorMessage = _containerElement.querySelector( ".media-error-message" ),
        _media = butter.currentMedia,
        __MAX_MEDIA_INPUTS = 4,
        _inputCount = 0,
        _emptyInputs = 0;

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

    function altMediaHandler( el ) {
      el.addEventListener( "click", function() {
        _parentElement.classList.toggle( "alternates-hidden" );
      }, false );
    }

    function removeMediaWrapper( mediaUrlWrapper ) {
      var altMediaLabel;

      if ( _inputCount > 1 ) {

        if ( _currentMediaWrapper.firstChild === mediaUrlWrapper ) {
          altMediaLabel = __ALT_MEDIA_LABEL.cloneNode( true );
          mediaUrlWrapper.nextElementSibling.appendChild( altMediaLabel );
          altMediaHandler( altMediaLabel );
        }

        _currentMediaWrapper.removeChild( mediaUrlWrapper );
        _inputCount--;
      }
    }

    function removeBtnHandler( e ) {
      var targ = e.target.parentElement.parentElement;
      removeMediaWrapper( targ );
      updateButterMedia();
    }

    function createInput( url ) {
      var urlInput,
          deleteBtn,
          wrapper,
          altMediaLabel = __ALT_MEDIA_LABEL.cloneNode( true );

        urlInput = __URL_INPUT_FRAG.cloneNode( true );
        urlInput.value = url;

        (function() {
          var oldValue = "",
              input = urlInput;

          input.addEventListener( "blur", function() {
            if ( oldValue !== input.value ) {
              updateButterMedia();
            }
          });

          input.addEventListener( "focus", function() {
            oldValue = input.value;
          });

          TextboxWrapper( input );
        }());

        wrapper = __URL_INPUT_INNER_WRAPPER.cloneNode( true );
        wrapper.appendChild( urlInput );

        if ( !_currentMediaWrapper.firstChild ) {
          wrapper.appendChild( altMediaLabel );
          altMediaHandler( altMediaLabel );
        } else {
          deleteBtn = __URL_INPUT_DEL_FRAG.cloneNode( true );
          deleteBtn.addEventListener( "click", removeBtnHandler, false );
          wrapper.appendChild( deleteBtn );
        }

        _currentMediaWrapper.appendChild( wrapper );
        _inputCount++;
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
        createInput( url[ i ] );
      }
      while( _emptyInputs ) {
        createInput( "" );
        _emptyInputs--;
      }

      // Wrap existing input boxes for click-to-select
      TextboxWrapper( _newMediaInput );
      TextboxWrapper( _alternateNewMediaInputA );
      TextboxWrapper( _alternateNewMediaInputB );
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

    function toggleMediaInputs( state ) {
      var inputs = _currentMediaWrapper.querySelectorAll( "textarea" );

      for ( var i = 0, l = inputs.length; i < l; i++ ) {
        if ( state ) {
          inputs[ i ].removeAttribute( "disabled" );
          inputs[ i ].nextElementSibling.addEventListener( "click", removeBtnHandler, false );
        } else {
          inputs[ i ].setAttribute( "disabled", "" );
          inputs[ i ].nextElementSibling.removeEventListener( "click", removeBtnHandler, false );
        }
      }

      if ( state ) {
        _currentMediaDiv.classList.remove( "disabled" );
        _addAlternateSourceBtn.addEventListener( "click", addAlternateSourceBtnHandler, false );
      } else {
        _currentMediaDiv.classList.add( "disabled" );
        _addAlternateSourceBtn.removeEventListener( "click", addAlternateSourceBtnHandler, false );
      }
    }

    function addAlternateSourceBtnHandler() {
      if ( _inputCount < __MAX_MEDIA_INPUTS ) {
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

      Editor.BaseEditor( this, butter, rootElement, {
        open: function( parentElement ) {
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
