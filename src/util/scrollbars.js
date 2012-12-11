/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "core/eventmanager" ], function( EventManager ) {

  var VERTICAL_SIZE_REDUCTION_FACTOR = 3,
      ACTIVE_CLASS = "butter-scollbar-active",
      SCROLL_MODIFIER = 10;

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

    EventManager.extend( _this );

    _element.className = "butter-scroll-bar butter-scroll-bar-v";
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

    function onMouseUp(){
      window.removeEventListener( "mouseup", onMouseUp, false );
      window.removeEventListener( "mousemove", onMouseMove, false );
      _handle.addEventListener( "mousedown", onMouseDown, false );
      _handle.classList.remove( ACTIVE_CLASS );
    }

    function onMouseMove( e ){
      var diff = e.pageY - _mousePos,
          maxDiff = _elementHeight - _handleHeight;
      diff = Math.max( 0, Math.min( diff, maxDiff ) );
      var p = diff / maxDiff;
      outerElement.scrollTop = ( _scrollHeight - _parentHeight ) * p;
      _this.dispatch( "scroll", outerElement.scrollTop );
    }

    function onMouseDown( e ){
      if( e.button === 0 ){
        var handleY = _handle.offsetTop;
        _mousePos = e.pageY - handleY;
        window.addEventListener( "mouseup", onMouseUp, false );
        window.addEventListener( "mousemove", onMouseMove, false );
        _handle.removeEventListener( "mousedown", onMouseDown, false );
        _handle.classList.add( ACTIVE_CLASS );
      }
    }

    function setHandlePosition() {
      if ( innerElement.scrollHeight - _elementHeight > 0 ) {
        _handle.style.top = ( _elementHeight - _handleHeight ) *
          ( outerElement.scrollTop / ( _scrollHeight - _parentHeight ) ) + "px";
      }
      else {
        _handle.style.top = "0px";
      }
    }

    outerElement.addEventListener( "scroll", function( e ){
      setHandlePosition();
    }, false );

    outerElement.addEventListener( "mousewheel", function( e ){
      var delta = e.wheelDeltaY || e.wheelDelta;

      outerElement.scrollTop -= delta / SCROLL_MODIFIER;
      setHandlePosition();
      e.preventDefault();
    }, false );

    // For Firefox
    outerElement.addEventListener( "DOMMouseScroll", function( e ){
      if( e.axis === e.VERTICAL_AXIS && !e.shiftKey ){
        outerElement.scrollTop += e.detail * 2;
        setHandlePosition();
        e.preventDefault();
      }
    }, false );

    _element.addEventListener( "click", function( e ) {
      // bail early if this event is coming from the handle
      if( e.srcElement === _handle || e.button > 0 ) {
        return;
      }

      var posY = e.pageY,
          handleRect = _handle.getBoundingClientRect(),
          elementRect = _element.getBoundingClientRect(),
          p;

      if( posY > handleRect.bottom ) {
        _handle.style.top = ( ( posY - elementRect.top ) - _handleHeight ) + "px";
      } else if( posY < handleRect.top ) {
        _handle.style.top = posY - elementRect.top + "px";
      }

      p = _handle.offsetTop / ( _elementHeight - _handleHeight );
      outerElement.scrollTop = ( _scrollHeight - _elementHeight ) * p;
    }, false);

    _handle.addEventListener( "mousedown", onMouseDown, false );

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

    EventManager.extend( _this );

    _element.className = "butter-scroll-bar butter-scroll-bar-h";
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

    function onMouseUp(){
      window.removeEventListener( "mouseup", onMouseUp, false );
      window.removeEventListener( "mousemove", onMouseMove, false );
      _handle.addEventListener( "mousedown", onMouseDown, false );
    }

    function onMouseMove( e ){
      e.preventDefault();
      var diff = e.pageX - _mousePos;
      diff = Math.max( 0, Math.min( diff, _elementWidth - _handleWidth ) );
      _handle.style.left = diff + "px";
      var p = _handle.offsetLeft / ( _elementWidth - _handleWidth );
      outerElement.scrollLeft = ( _scrollWidth - _elementWidth ) * p;
      _this.dispatch( "scroll", outerElement.scrollLeft );
    }

    function onMouseDown( e ){
      if( e.button === 0 ){
        var handleX = _handle.offsetLeft;
        _mousePos = e.pageX - handleX;
        window.addEventListener( "mouseup", onMouseUp, false );
        window.addEventListener( "mousemove", onMouseMove, false );
        _handle.removeEventListener( "mousedown", onMouseDown, false );
      }
    }

    function setHandlePosition(){
      if( _scrollWidth - _elementWidth > 0 ) {
        _handle.style.left = ( _elementWidth - _handleWidth ) *
          ( outerElement.scrollLeft / ( _scrollWidth - _elementWidth ) ) + "px";
      } else {
        _handle.style.left = "0px";
      }
    }

    outerElement.addEventListener( "scroll", function( e ){
      setHandlePosition();
    }, false );

    outerElement.addEventListener( "mousewheel", function( e ){
      if( e.wheelDeltaX ){
        outerElement.scrollLeft -= e.wheelDeltaX;
        setHandlePosition();
        e.preventDefault();
      }
    }, false );

    // For Firefox
    outerElement.addEventListener( "DOMMouseScroll", function( e ){
      if( e.axis === e.HORIZONTAL_AXIS || ( e.axis === e.VERTICAL_AXIS && e.shiftKey )){
        outerElement.scrollLeft += e.detail * 2;
        setHandlePosition();
        e.preventDefault();
      }
    }, false );

    _element.addEventListener( "click", function( e ) {
      // bail early if this event is coming from the handle
      if( e.srcElement === _handle || e.button > 0 ) {
        return;
      }

      var posX = e.pageX,
          handleRect = _handle.getBoundingClientRect(),
          elementRect = _element.getBoundingClientRect(),
          p;

      if( posX > handleRect.right ) {
        _handle.style.left = ( ( posX - elementRect.left ) - _handleWidth ) + "px";
      }
      else if( posX < handleRect.left ) {
        _handle.style.left = posX - elementRect.left + "px";
      }

      p = _handle.offsetLeft / ( _elementWidth - _handleWidth );
      outerElement.scrollLeft = ( _scrollWidth - _elementWidth ) * p;
    }, false);

    _handle.addEventListener( "mousedown", onMouseDown, false );

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

