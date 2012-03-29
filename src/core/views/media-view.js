define( [ "ui/page-element" ], function( PageElement ){
  
  return function( media, options ){
    var _media = media,
        _pageElement,
        _onDropped = options.onDropped || function(){},
        _propertiesElement = document.createElement( "div" ),
        _this = this;

    _propertiesElement.className = "butter-media-properties";

    _propertiesElement.addEventListener( "mouseover", function( e ){

    }, false );

    _propertiesElement.addEventListener( "mouseout", function( e ){

    }, false );

    var urlTextbox = document.createElement( "input" );
    urlTextbox.type = "text";
    urlTextbox.className = "url";
    var title = document.createElement( "h3" );
    title.innerHTML = "Timeline Media";
    var subtitle = document.createElement( "h5" );
    subtitle.innerHTML = "&#10003;HTML5 &#10003;Youtube &#10003;Vimeo"
    var container = document.createElement( "container" );
    container.className = "container";
    var changeButton = document.createElement( "button" );
    changeButton.innerHTML = "Change";
    container.appendChild( title );
    container.appendChild( subtitle );
    container.appendChild( urlTextbox );
    container.appendChild( changeButton );
    _propertiesElement.appendChild( container );

    changeButton.addEventListener( "click", function( e ){
      media.url = urlTextbox.value;
    }, false );

    media.listen( "mediacontentchanged", function( e ){
      urlTextbox.value = media.url;
      changeButton.setAttribute( "disabled", true );
    });

    media.listen( "mediaready", function( e ){
      changeButton.removeAttribute( "disabled", true );
    });

    this.update = function(){
      urlTextbox.value = media.url;

      var targetElement = document.getElementById( _media.target );

      if( _pageElement ){
        _pageElement.destroy();
      } //if
      _pageElement = new PageElement( _media.target, {
        over: function( event ){
          _draggingOver = true;
        },
        out: function( event ){
          _draggingOver = false;
        },
        drop: function( event ){
          if( event.currentTarget === _media ) {
            _onDropped( event );
          }//if
        }
      },
      {
        highlightClass: "butter-media-highlight"
      });

      if( targetElement ){
        if( !_propertiesElement.parentNode ){
          document.body.appendChild( _propertiesElement );
        }
        _propertiesElement.style.left = _pageElement.element.style.left;
        _propertiesElement.style.top = _pageElement.element.style.top;
      };
    };

  };

});