/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/logger", "core/eventmanager", "util/dragndrop" ], function( Logger, EventManager, DragNDrop ) {
  
  return function( element, events, options ){

    var _element = typeof( element ) === "string" ? document.getElementById( element ) : element,
        _highlightElement = document.createElement( "div" ),
        _blinkInterval = -1,
        _highlightElement = document.createElement( "div" ),
        _highlightDims = {},
        _highlightInterval = -1,
        _events = events || {},
        _options = options || {},
        _this = this;

    function checkPosition(){
      var ePos = _element.getBoundingClientRect();
      if( ePos.left !== _highlightDims.left ){
        _highlightDims.left = ePos.left;
        _highlightElement.style.left = ePos.left + "px";
      } //if
      if( ePos.top !== _highlightDims.top ){
        _highlightDims.top = ePos.top;
        _highlightElement.style.top = ePos.top + "px";
      } //if
      if( ePos.width !== _highlightDims.width ){
        _highlightDims.width = ePos.width;
        _highlightElement.style.width = ePos.width + "px";
      } //if
      if( ePos.height !== _highlightDims.height ){
        _highlightDims.height = ePos.height;
        _highlightElement.style.height = ePos.height + "px";
      } //if
      _highlightDims = ePos;
    } //checkPosition

    function highlight( state ){
      clearInterval( _blinkInterval );
      clearInterval( _highlightInterval );
      _blinkInterval = -1;
      if( state ){
        if( _highlightInterval === -1 ){
          _highlightInterval = setInterval( checkPosition, 10 );
        } //if
        _highlightElement.style.visibility = "visible";
        _highlightElement.removeAttribute( "blink" );
        checkPosition();
      }
      else {
        if( _highlightInterval !== -1 ){
          clearInterval( _highlightInterval );
        } //if
        _highlightInterval = -1;
        _highlightElement.style.visibility = "hidden";
      } //if
    } //highlight

    this.destroy = function(){
      if( _highlightElement.parentNode ){
        _highlightElement.parentNode.removeChild( _highlightElement );
      } //if
    }; //destroy

    _highlightElement.className = "butter-highlight ";
    _highlightElement.setAttribute( "data-butter-exclude", "true" );
    if( _options.highlightClass ){
      _highlightElement.className += _options.highlightClass;
    } //if
    _highlightElement.style.visibility = "hidden";

    _this.blink = function(){
      if( _blinkInterval === -1 ){
        _blinkInterval = setInterval( checkPosition, 100 );
        _highlightElement.setAttribute( "blink", "true" );
        _highlightElement.style.visibility = "visible";
        setTimeout(function(){
          clearInterval( _blinkInterval );
          _blinkInterval = -1;
          _highlightElement.removeAttribute( "blink" );
          _highlightElement.style.visibility = "hidden";
        }, 1500 );
      } //if
    }; //blink

    if( _element ){
      document.body.appendChild( _highlightElement );

      _element.setAttribute( "butter-clean", "true" );

      DragNDrop.droppable( _element, {
        over: function( dragElement ){
          if( dragElement.getAttribute( "data-butter-draggable-type" ) !== "plugin" ){
            return;
          }
          highlight( true );
          if( _events.over ){
            _events.over();
          } //if
        }, //over
        out: function( dragElement ){
          if( dragElement.getAttribute( "data-butter-draggable-type" ) !== "plugin" ){
            return;
          }
          highlight( false );
          if( _events.out ){
            _events.out();
          } //if
        }, //out
        drop: function( dragElement ){
          if( dragElement.getAttribute( "data-butter-draggable-type" ) !== "plugin" ){
            return;
          }
          highlight( false );
          if( _events.drop ){
            _events.drop( dragElement );
          } //if
        } //drop
      });

    } //if

    Object.defineProperties( this, {
      highlight: {
        enumerable: true,
        get: function(){
          return _hightlightInterval !== -1;
        },
        set: function( val ){
          highlight( val );
        }
      }
    });

  }; //Element

});

