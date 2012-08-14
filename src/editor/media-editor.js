/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "util/lang", "editor/editor", "util/uri", "text!layouts/media-editor.html" ],
  function( LangUtils, Editor, Uri, EDITOR_LAYOUT ) {

  return function( butter ) {

    var _parentElement = LangUtils.domFragment( EDITOR_LAYOUT,".media-editor" ),
        _containerElement = _parentElement.querySelector( ".container" ),
        _addNewMediaBtn = _containerElement.querySelector( "#new-media-source-btn" ),
        _addNewMediaDiv = _containerElement.querySelector( "#add-new-media-source" ),
        _newMediaInput = _containerElement.querySelector( "#new-media-input" ),
        _confirmNewMedia = _containerElement.querySelector( "#update-media-source-btn" ),
        _cancelNewMedia = _containerElement.querySelector( "#cancel-media-source-btn" ),
        _currentMediaWrapper = _containerElement.querySelector( "#current-media-wrapper" ),
        _alternateNewMediaGroup = _containerElement.querySelector( "div.alternate-new-media-group" ),
        _alternateMediaWarning = _containerElement.querySelector( "#alternate-media-warning" ),
        _alternateNewMediaInputA = _containerElement.querySelector( "#alternate-media-input-a" ),
        _alternateNewMediaInputB = _containerElement.querySelector( "#alternate-media-input-b" ),
        _addAlternateSourceBtn = _containerElement.querySelector( "#add-alternate-media-source-btn" ),
        _confirmMediaChange = _containerElement.querySelector( "#confirm-media-source-change-btn"),
        _mediaErrorMessage = _containerElement.querySelector( "label.media-error-message" ),
        _media = butter.currentMedia,
        __URL_INPUT_INNER_WRAPPER = LangUtils.domFragment( "<div class=\"media-editor-inner-wrapper\"></div>", "div" ),
        __URL_INPUT_FRAG = LangUtils.domFragment( "<input type=\"text\" class=\"current-media-input\" placeholder=\"http://\"/>", "input" ),
        __URL_INPUT_DEL_FRAG = LangUtils.domFragment( "<a class=\"delete-media-btn\"><i class=\"icon icon-minus-sign\" ></i></a>", "a" ),
        __MAX_MEDIA_INPUTS = 4,
        _inputCount = 0;

    function updateButterMedia() {
      var urlInputs = _currentMediaWrapper.querySelectorAll( "input" ),
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

    function removeMediaWrapper( mediaUrlWrapper ) {
      _currentMediaWrapper.removeChild( mediaUrlWrapper );
      _inputCount--;
    }

    function createInput( url ) {
      var urlInput,
          deleteBtn,
          wrapper;

        urlInput = __URL_INPUT_FRAG.cloneNode( true );
        urlInput.value = url;

        deleteBtn = __URL_INPUT_DEL_FRAG.cloneNode( true );
        deleteBtn.addEventListener( "click", function( e ) {
          var targ = e.target.parentElement.parentElement;
          removeMediaWrapper( targ );
        });

        wrapper = __URL_INPUT_INNER_WRAPPER.cloneNode( true );
        wrapper.appendChild( urlInput );
        wrapper.appendChild( deleteBtn );

        _currentMediaWrapper.appendChild( wrapper );
        _inputCount++;
    }

    function clearCurrentMediaList() {
      while( _currentMediaWrapper.firstChild ) {
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
    }

    _addNewMediaBtn.addEventListener( "click", function() {
      _addNewMediaBtn.classList.add( "hidden" );
      _addNewMediaDiv.classList.remove( "hidden" );

      _newMediaInput.addEventListener( "keyup", function() {

        var url = _newMediaInput.value,
            pUri = Uri.parse( url ),
            ext,
            message = "Note: You need {{replace}} versions for your media to work in all browsers " +
                      "<a href=\"http://diveintohtml5.info/video.html\" target=\"_blank\">Learn more</a>";

        if ( /(ogv|webm|mp4)/.test( pUri.file ) ) {
          if ( pUri.file ) {
              ext = pUri.file.split( "." )[ 1 ];
            if ( ext === "ogv" ) {
              message = message.replace( "{{replace}}", "webm and mp4" );
            } else if ( ext === "webm" ) {
              message = message.replace( "{{replace}}", "ogv and mp4" );
            } else {
              message = message.replace( "{{replace}}", "webm and ogv" );
            }
            _alternateMediaWarning.innerHTML = message;
            _alternateMediaWarning.classList.remove( "hidden" );
            _alternateNewMediaGroup.classList.remove( "hidden" );
          }
        } else {
          _alternateMediaWarning.classList.add( "hidden" );
        }
      });
    });

    function clearNewMediaInputs() {
      _newMediaInput.value = "";
      _alternateNewMediaInputA.value = "";
      _alternateNewMediaInputB.value = "";
    }

    function showError( state ) {
      var urlInputs = _currentMediaWrapper.querySelectorAll( "input" );

      for ( var i = 0, l = urlInputs.length; i < l; i++ ) {
        if ( state ) {
          urlInputs[ i ].classList.add( "error" );
        } else {
          urlInputs[ i ].classList.remove( "error" );
        }
      }
      if ( state ) {
        _mediaErrorMessage.classList.remove( "hidden" );
      } else {
        _mediaErrorMessage.classList.add( "hidden" );
      }
    }

    _cancelNewMedia.addEventListener( "click", function() {
      _addNewMediaBtn.classList.remove( "hidden" );
      _addNewMediaDiv.classList.add( "hidden" );
      _alternateNewMediaGroup.classList.add( "hidden" );
      clearNewMediaInputs();
    });

    _confirmNewMedia.addEventListener( "click", function() {
      if ( _newMediaInput.value ) {
        clearCurrentMediaList();
        createInput( _newMediaInput.value );

        if ( _alternateNewMediaInputA.value ) {
          createInput( _alternateNewMediaInputA.value );
        }

        if ( _alternateNewMediaInputB.value ) {
          createInput( _alternateNewMediaInputB.value );
        }

        _addNewMediaBtn.classList.remove( "hidden" );
        _addNewMediaDiv.classList.add( "hidden" );
        _alternateNewMediaGroup.classList.add( "hidden" );
        _newMediaInput.value = "";
        updateButterMedia();
        clearNewMediaInputs();
      }
    });

    _confirmMediaChange.addEventListener( "click", function() {
      updateButterMedia();
    });

    _addAlternateSourceBtn.addEventListener( "click", function() {
      if ( _inputCount < __MAX_MEDIA_INPUTS ) {
        createInput( "" );
      }
    });

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
    })

    Editor.register( "media-editor", null, function( rootElement, butter ) {
      rootElement = _parentElement;

      Editor.BaseEditor( this, butter, rootElement, {
        open: function( parentElement ) {
          clearCurrentMediaList();
          setup();
        },
        close: function() {
        }
      });
    });
  };
});
