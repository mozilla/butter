/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/eventmanager" ], function( EventManagerWrapper ){

  var VERTICAL_SIZE_REDUCTION_FACTOR = 3,
      activeClass = "butter-scollbar-active";

  function Vertical( outerElement, innerElement ){
    var _element = document.createElement( "div" ),
        _handle = document.createElement( "div" ),
        _elementHeight,
        _parentHeight,
        _childHeight,
        _scrollHeight,
        _handleHeight,
        _mousePos = 0,
        _this = this;

    EventManagerWrapper( _this );

    _element.className = "butter-scroll-bar butter-scroll-bar-v butter-scrollbar-visible hidden";
    _handle.className = "butter-scroll-handle";

    _element.appendChild( _handle );

    this.update = function() {
      _parentHeight = outerElement.getBoundingClientRect().height;
      _childHeight = innerElement.getBoundingClientRect().height;
      _elementHeight = _element.getBoundingClientRect().height;
      _scrollHeight = outerElement.scrollHeight;
      _handleHeight = _elementHeight - ( innerElement.scrollHeight - _parentHeight ) / VERTICAL_SIZE_REDUCTION_FACTOR;
      _handleHeight = Math.max( 20, Math.min( _elementHeight, _handleHeight ) );
      _handle.style.height = _handleHeight + "px";
      setHandlePosition();
    };

    function setHandlePosition() {
      if ( innerElement.scrollHeight - _elementHeight > 0 ) {
        _handle.style.top = ( _elementHeight - _handleHeight ) *
          ( outerElement.scrollTop / ( _scrollHeight - _parentHeight ) ) + "px";
      }
      else {
        _handle.style.top = "0px";
      }
      
      // Toggles a fadding transition for our scrollbar
      if ( !_element.classList.contains( "hidden" ) ) {
        _element.classList.add( "hidden" );
      }
    }

    outerElement.addEventListener( "scroll", function( e ){
      _element.classList.remove( "hidden" );
      _element.classList.add( "butter-scrollbar-visible" );
      setHandlePosition();
    }, false );

    outerElement.addEventListener( "mousewheel", function( e ){
      if( e.wheelDeltaY ){
        _element.classList.remove( "butter-scrollbar-hidden" );
        _element.classList.add( "butter-scrollbar-visible" );
        outerElement.scrollTop -= e.wheelDeltaY;
        setHandlePosition();
        e.preventDefault();
      }
    }, false );

    // For Firefox
    outerElement.addEventListener( "DOMMouseScroll", function( e ){
      if( e.axis === e.VERTICAL_AXIS && !e.shiftKey ){
        _element.classList.remove( "hidden" );
        _element.classList.add( "butter-scrollbar-visible" );
        outerElement.scrollTop += e.detail * 2;
        setHandlePosition();
        e.preventDefault();
      }
    }, false );

    window.addEventListener( "resize", _this.update, false );

    _this.update();

    Object.defineProperties( this, {
      element: {
        enumerable: true,
        get: function(){
          return _element;
        }
      }
    });

  }

  function Horizontal( outerElement, innerElement ){
    var _element = document.createElement( "div" ),
        _handle = document.createElement( "div" ),
        _elementWidth,
        _parentWidth,
        _childWidth,
        _scrollWidth,
        _handleWidth,
        _mousePos = 0,
        _this = this;

    EventManagerWrapper( _this );

    _element.className = "butter-scroll-bar butter-scroll-bar-h butter-scrollbar-visible hidden";
    _handle.className = "butter-scroll-handle";

    _element.appendChild( _handle );

    this.update = function() {
      _parentWidth = outerElement.getBoundingClientRect().width;
      _childWidth = innerElement.getBoundingClientRect().width;
      _elementWidth = _element.getBoundingClientRect().width;
      _scrollWidth = innerElement.scrollWidth;
      _handleWidth = _elementWidth - ( _scrollWidth - _parentWidth );
      _handleWidth = Math.max( 20, Math.min( _elementWidth, _handleWidth ) );
      _handle.style.width = _handleWidth + "px";
      setHandlePosition();
    };

    function setHandlePosition() {
      if( _scrollWidth - _elementWidth > 0 ) {
        _handle.style.left = ( _elementWidth - _handleWidth ) *
          ( outerElement.scrollLeft / ( _scrollWidth - _elementWidth ) ) + "px";
      } else {
        _handle.style.left = "0px";
      }
      
      // Toggles a fadding transition for our scrollbar
      if ( !_element.classList.contains( "hidden" ) ) {
        _element.classList.add( "hidden" );
      }
    }

    outerElement.addEventListener( "scroll", function( e ){
      _element.classList.remove( "hidden" );
      _element.classList.add( "butter-scrollbar-visible" );
      setHandlePosition();
    }, false );

    outerElement.addEventListener( "mousewheel", function( e ){
      if( e.wheelDeltaX ){
        _element.classList.remove( "hidden" );
        _element.classList.add( "butter-scrollbar-visible" );
        outerElement.scrollLeft -= e.wheelDeltaX;
        setHandlePosition();
        e.preventDefault();
      }
    }, false );

    // For Firefox
    outerElement.addEventListener( "DOMMouseScroll", function( e ){
      if( e.axis === e.HORIZONTAL_AXIS || ( e.axis === e.VERTICAL_AXIS && e.shiftKey )){
        _element.classList.remove( "hidden" );
        _element.classList.add( "butter-scrollbar-visible" );
        outerElement.scrollLeft += e.detail * 2;
        setHandlePosition();
        e.preventDefault();
      }
    }, false );

    window.addEventListener( "resize", _this.update, false );

    _this.update();

    Object.defineProperties( this, {
      element: {
        enumerable: true,
        get: function(){
          return _element;
        }
      }
    });

  }

  return {
    Vertical: Vertical,
    Horizontal: Horizontal
  };

});

