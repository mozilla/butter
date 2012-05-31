define( [ "ui/page-element", "ui/logo-spinner", "util/lang", "ui/widget/textbox", "text!layouts/media-view.html" ],
  function( PageElement, LogoSpinner, LangUtils, TextboxWrapper, HTML_TEMPLATE ){

  var DEFAULT_SUBTITLE = "Supports HTML5 video, YouTube, and Vimeo",
      MOUSE_OUT_DURATION = 300,
      MAX_URLS = 4;

  return function( media, options ){
    var _media = media,
        _pageElement,
        _onDropped = options.onDropped || function(){},
        _closeSignal = false,
        _logoSpinner;

    var _propertiesElement = LangUtils.domFragment( HTML_TEMPLATE ),
        _container = _propertiesElement.querySelector( "div.container" ),
        _urlContainer = _propertiesElement.querySelector( "div.url" ),
        _urlTextbox = _propertiesElement.querySelector( "input[type='text']" ),
        _subtitle = _propertiesElement.querySelector( ".form-field-notes" ),
        _changeButton = _propertiesElement.querySelector( "button.save" ),
        _addUrlButton = _propertiesElement.querySelector( "button.add-url" ),
        _urlList = _propertiesElement.querySelector( "div.url-group" ),
        _loadingContainer = _propertiesElement.querySelector( ".loading-container" );

    var _containerDims;

    function setDimensions( state ){
      if( state ){
        _closeSignal = false;
        _propertiesElement.style.width = _containerDims.width + "px";
        _propertiesElement.style.height = _containerDims.height + "px";
      }
      else {
        _propertiesElement.style.width = "";
        _propertiesElement.style.height = "";
      }
    }

    function prepareTextbox( textbox ){
      TextboxWrapper( textbox );
    }

    function addUrl() {
      var newContainer = _urlContainer.cloneNode( true );
      newContainer.classList.remove( "fade-in" );
      _urlList.appendChild( newContainer );

      // force the browser to wait a tick before applying this class
      // so fade-in effect occurs
      setTimeout(function(){
        newContainer.classList.add( "fade-in" );
      }, 0);

      _containerDims.width = _container.clientWidth;
      _containerDims.height = _container.clientHeight;
      setDimensions( true );

      newContainer.querySelector( "button.remove" ).addEventListener( "click", function ( e ) {
        removeUrl( newContainer );
      }, false );

      prepareTextbox( newContainer.querySelector( "input[type='text']" ) );

      if ( _urlList.querySelectorAll( "input[type='text']" ).length >= MAX_URLS ) {
        _addUrlButton.style.visibility = "hidden";
      }
    }

    function removeUrl( container ){
      _urlList.removeChild( container );
      _containerDims.width = _container.clientWidth;
      _containerDims.height = _container.clientHeight;
      setDimensions( true );
      if ( _urlList.querySelectorAll( "input[type='text']" ).length < MAX_URLS ) {
        _addUrlButton.style.visibility = "visible";
      }
    }

    _addUrlButton.addEventListener( "click", function( e ) {
      addUrl();
    }, false );

    prepareTextbox( _urlTextbox );

    _propertiesElement.addEventListener( "mouseover", function( e ) {
      e.stopPropagation();
      _propertiesElement.classList.add( "open" );
      // silly hack to stop jittering of width/height
      if ( !_containerDims ) {
        _containerDims = {
          width: _container.clientWidth,
          height: _container.clientHeight
        };
      }
      setDimensions( true );
    }, true );

    _propertiesElement.addEventListener( "mouseout", function( e ) {
      setTimeout(function(){
        if ( _closeSignal ) {
          setDimensions( false );
          _propertiesElement.classList.remove( "open" );
        }
      }, MOUSE_OUT_DURATION );
      _closeSignal = true;
    }, false );

    _logoSpinner = LogoSpinner( _loadingContainer );

    _subtitle.innerHTML = DEFAULT_SUBTITLE;

    function showError( state, message ){
      if( state ){
        _subtitle.innerHTML = message;
      }
      else{
        _subtitle.innerHTML = DEFAULT_SUBTITLE;
      }
    }

    function changeUrl(){
      var validTextboxes = [],
          textboxes = _container.querySelectorAll( "input[type='text']" ),
          errorTextboxes = [];

      _subtitle.classList.add( "form-ok" );
      _subtitle.classList.remove( "form-error" );

      for ( var i = 0, len = textboxes.length; i < len; i++ ) {
        textboxes[ i ].classList.add( "form-ok" );
        textboxes[ i ].classList.remove( "form-error" );
        if ( testUrl( textboxes[ i ].value ) ) {
          validTextboxes.push( textboxes[ i ].value );
        }
        else {
          _subtitle.classList.remove( "form-ok" );
          _subtitle.classList.add( "form-error" );
          errorTextboxes.push( textboxes[ i ] );
          textboxes[ i ].classList.remove( "form-ok" );
          textboxes[ i ].classList.add( "form-error" );
        }
      }

      if ( errorTextboxes.length ) {
        showError( true, "URL(s) not valid. Please use http://..." );
      }
      else if ( validTextboxes.length ) {
        _subtitle.innerHTML = "URL changed.";
        media.url = validTextboxes;
      }

    }

    function testUrl(url) {
      var test = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
      return url.match(test);
    }

    _urlTextbox.addEventListener( "keypress", function( e ){
      if( e.which === 13 ){
        changeUrl();
      }
    }, false );
    _changeButton.addEventListener( "click", changeUrl, false );

    _logoSpinner.start();
    _changeButton.setAttribute( "disabled", true );

    function updateURLS(){
      if( typeof( media.url ) === "string" ) {
        _urlTextbox.value = media.url;
      }
      else if ( media.url.length ) {
        var urls = media.url,
            currentUrls = _urlList.querySelectorAll( "input[type='text']" );
        while ( currentUrls.length < urls.length ) {
          addUrl();
          currentUrls = _urlList.querySelectorAll( "input[type='text']" );
        }
        while ( currentUrls.length > urls.length ) {
          removeUrl( currentUrls[ currentUrls.length - 1 ] );
          currentUrls = _urlList.querySelectorAll( "input[type='text']" );
        }
        for ( var i = 0; i < urls.length; ++i ) {
          currentUrls[ i ].value = urls[ i ];
        }
      }
      else {
        throw "Media url is expected value (not string or array): " + media.url;
      }
    }

    media.listen( "mediacontentchanged", function( e ){
      updateURLS();
      showError( false );
      _changeButton.setAttribute( "disabled", true );
      _logoSpinner.start();
    });

    media.listen( "mediafailed", function( e ){
      showError( true, "Media failed to load. Check your URL." );
      _changeButton.removeAttribute( "disabled" );
      _urlTextbox.className += " form-error";
      _subtitle.className += " form-error";
      _logoSpinner.stop();
    });

    media.listen( "mediaready", function( e ){
      showError( false );
      _changeButton.removeAttribute( "disabled" );
      _logoSpinner.stop();
    });

    this.blink = function(){
      _pageElement.blink();
    };

    this.destroy = function() {
      _pageElement.destroy();
      _pageElement = null;
    };

    function pageElementMoved( e ){
      var rect = e ? e.data : _pageElement.element.getBoundingClientRect();
      _propertiesElement.style.left = rect.left + "px";
      _propertiesElement.style.top = rect.top + "px";
    }

    this.update = function(){
      updateURLS();

      var targetElement = document.getElementById( _media.target );

      if( _pageElement ){
        _pageElement.destroy();
      } //if
      _pageElement = new PageElement( _media.target, {
        drop: function( element ){
          _onDropped( element );
        }
      },
      {
        highlightClass: "butter-media-highlight"
      });

      if( targetElement ){
        if( !_propertiesElement.parentNode ){
          document.body.appendChild( _propertiesElement );
        }
        _pageElement.listen( "moved", pageElementMoved );
      }
    };

  };

});
