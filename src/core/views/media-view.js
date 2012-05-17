define( [ "ui/page-element", "ui/logo-spinner", "util/lang", "text!layouts/media-view.html" ],
  function( PageElement, LogoSpinner, LangUtils, HTML_TEMPLATE ){

  var DEFAULT_SUBTITLE = "Supports HTML5 video, YouTube, and Vimeo";

  return function( media, options ){
    var _media = media,
        _pageElement,
        _onDropped = options.onDropped || function(){},
        _logoSpinner;

    var _propertiesElement = LangUtils.domFragment( HTML_TEMPLATE ),
        urlTextbox = _propertiesElement.querySelector( "input" ),
        subtitle = _propertiesElement.querySelector( ".form-field-notes" ),
        changeButton = _propertiesElement.querySelector( "button" ),
        loadingContainer = _propertiesElement.querySelector( ".loading-container" );

    urlTextbox.addEventListener( "focus", function( e ) {
      _propertiesElement.classList.add( "hold" );
    }, false );

    urlTextbox.addEventListener( "blur", function( e ) {
      _propertiesElement.classList.remove( "hold" );
    }, false );

    _logoSpinner = LogoSpinner( loadingContainer );

    subtitle.innerHTML = DEFAULT_SUBTITLE;

    function showError( state, message ){
      if( state ){
        subtitle.innerHTML = message;
      }
      else{
        subtitle.innerHTML = DEFAULT_SUBTITLE;
      }
    }

    function changeUrl(){
      if(testUrl(urlTextbox.value)){
          subtitle.className = "form-field-notes form-ok";
        subtitle.innerHTML = "URL changed.";
        urlTextbox.className = "url form-ok";
        media.url = urlTextbox.value;
      }
      else{
        subtitle.className += " form-error";
        urlTextbox.className += " form-error";
        showError( true, "Not a valid URL. Use http://..." );
      }
    }

    function testUrl(url) {
      var test = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
      return url.match(test);
    }

    urlTextbox.addEventListener( "keypress", function( e ){
      if( e.which === 13 ){
        changeUrl();
      }
    }, false );
    changeButton.addEventListener( "click", changeUrl, false );

    _logoSpinner.start();
    changeButton.setAttribute( "disabled", true );

    media.listen( "mediacontentchanged", function( e ){
      urlTextbox.value = media.url;
      showError( false );
      changeButton.setAttribute( "disabled", true );
      _logoSpinner.start();
    });

    media.listen( "mediafailed", function( e ){
      showError( true, "Media failed to load. Check your URL:" );
      changeButton.removeAttribute( "disabled" );
      _logoSpinner.stop();
    });

    media.listen( "mediaready", function( e ){
      showError( false );
      changeButton.removeAttribute( "disabled" );
      _logoSpinner.stop();
    });

    this.blink = function(){
      _pageElement.blink();
    };

    function pageElementMoved( e ){
      var rect = e ? e.data : _pageElement.element.getBoundingClientRect();
      _propertiesElement.style.left = rect.left + "px";
      _propertiesElement.style.top = rect.top + "px";
    }

    this.update = function(){
      urlTextbox.value = media.url;

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
