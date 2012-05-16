/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/eventmanager" ], function( EventManagerWrapper ){

  var VERTICAL_SIZE_REDUCTION_FACTOR = 3;

  function Vertical( tracksContainer ){
    var _element = document.createElement( "div" ),
        _handle = document.createElement( "div" ),
        _containerParent = tracksContainer.element,
        _containerChild = tracksContainer.container,
        _elementHeight,
        _parentHeight,
        _childHeight,
        _scrollHeight,
        _handleHeight,
        _mousePos = 0,
        _this = this;

    EventManagerWrapper( _this );

    _element.className = "scroll-bar scroll-bar-v";
    _handle.className = "scroll-handle";

    _element.appendChild( _handle );

    function setup(){
      _parentHeight = _containerParent.getBoundingClientRect().height;
      _childHeight = _containerChild.getBoundingClientRect().height;
      _elementHeight = _element.getBoundingClientRect().height;
      _scrollHeight = _containerChild.scrollHeight;
      _handleHeight = _elementHeight - ( _scrollHeight - _parentHeight ) / VERTICAL_SIZE_REDUCTION_FACTOR;
      _handleHeight = Math.max( 20, Math.min( _elementHeight, _handleHeight ) );
      _handle.style.height = _handleHeight + "px";
      setHandlePosition();
    } //setup

    function onMouseUp(){
      window.removeEventListener( "mouseup", onMouseUp, false );
      window.removeEventListener( "mousemove", onMouseMove, false );
      _handle.addEventListener( "mousedown", onMouseDown, false );
    } //onMouseUp

    function onMouseMove( e ){
      var diff = e.pageY - _mousePos;
      diff = Math.max( 0, Math.min( diff, _elementHeight - _handleHeight ) );
      _handle.style.top = diff + "px";
      var p = _handle.offsetTop / ( _elementHeight - _handleHeight );
      _containerParent.scrollTop = ( _scrollHeight - _elementHeight ) * p;
      _this.dispatch( "scroll", _containerParent.scrollTop );
    } //onMouseMove

    function onMouseDown( e ){
      if( e.button === 0 ){
        var handleY = _handle.offsetTop;
        _mousePos = e.pageY - handleY;
        window.addEventListener( "mouseup", onMouseUp, false );
        window.addEventListener( "mousemove", onMouseMove, false );
        _handle.removeEventListener( "mousedown", onMouseDown, false );
      } //if
    } //onMouseDown

    this.update = function(){
      setup();
    }; //update

    function setHandlePosition(){
      if( _containerChild.scrollHeight - _elementHeight > 0 ) {
        _handle.style.top = ( _elementHeight - _handleHeight ) *
          ( _containerParent.scrollTop / ( _containerChild.scrollHeight - _elementHeight ) ) + "px";
      }else{
        _handle.style.top = "0px";
      }
    }

    _containerParent.addEventListener( "scroll", function( e ){
      setHandlePosition();
    }, false );

    _containerParent.addEventListener( "mousewheel", function( e ){
      if( e.wheelDeltaY ){
        _containerParent.scrollTop -= e.wheelDeltaY;
        setHandlePosition();
        e.preventDefault();
      }
    }, false );

    // For Firefox
    _containerParent.addEventListener( "DOMMouseScroll", function( e ){
      if( e.axis === e.VERTICAL_AXIS && !e.shiftKey ){
        _containerParent.scrollTop += e.detail * 2;
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
      _containerParent.scrollTop = ( _scrollHeight - _elementHeight ) * p;
    }, false);

    window.addEventListener( "resize", setup, false );
    _handle.addEventListener( "mousedown", onMouseDown, false );

    setup();

    Object.defineProperties( this, {
      element: {
        enumerable: true,
        get: function(){
          return _element;
        }
      }
    });

  } //Vertical

  function Horizontal( tracksContainer ){
    var _element = document.createElement( "div" ),
        _handle = document.createElement( "div" ),
        _containerParent = tracksContainer.element,
        _containerChild = tracksContainer.container,
        _elementWidth,
        _parentWidth,
        _childWidth,
        _scrollWidth,
        _handleWidth,
        _mousePos = 0,
        _this = this;

    EventManagerWrapper( _this );

    _element.className = "scroll-bar scroll-bar-h";
    _handle.className = "scroll-handle";

    _element.appendChild( _handle );

    function setup(){
      _parentWidth = _containerParent.getBoundingClientRect().width;
      _childWidth = _containerChild.getBoundingClientRect().width;
      _elementWidth = _element.getBoundingClientRect().width;
      _scrollWidth = _containerChild.scrollWidth;
      _handleWidth = _elementWidth - ( _scrollWidth - _parentWidth );
      _handleWidth = Math.max( 20, Math.min( _elementWidth, _handleWidth ) );
      _handle.style.width = _handleWidth + "px";
      setHandlePosition();
    } //setup

    function onMouseUp(){
      window.removeEventListener( "mouseup", onMouseUp, false );
      window.removeEventListener( "mousemove", onMouseMove, false );
      _handle.addEventListener( "mousedown", onMouseDown, false );
    } //onMouseUp

    function onMouseMove( e ){
      var diff = e.pageX - _mousePos;
      diff = Math.max( 0, Math.min( diff, _elementWidth - _handleWidth ) );
      _handle.style.left = diff + "px";
      var p = _handle.offsetLeft / ( _elementWidth - _handleWidth );
      _containerParent.scrollLeft = ( _scrollWidth - _elementWidth ) * p;
      _this.dispatch( "scroll", _containerParent.scrollLeft );
    } //onMouseMove

    function onMouseDown( e ){
      if( e.button === 0 ){
        var handleX = _handle.offsetLeft;
        _mousePos = e.pageX - handleX;
        window.addEventListener( "mouseup", onMouseUp, false );
        window.addEventListener( "mousemove", onMouseMove, false );
        _handle.removeEventListener( "mousedown", onMouseDown, false );
      } //if
    } //onMouseDown

    function setHandlePosition(){
      if( _scrollWidth - _elementWidth > 0 ) {
        _handle.style.left = ( _elementWidth - _handleWidth ) *
          ( _containerParent.scrollLeft / ( _scrollWidth - _elementWidth )) + "px";
      }else{
        _handle.style.left = "0px";
      }
    }

    _containerParent.addEventListener( "scroll", function( e ){
      setHandlePosition();
    }, false );

    _containerChild.addEventListener( "mousewheel", function( e ){
      if( e.wheelDeltaX ){
        _containerParent.scrollLeft -= e.wheelDeltaX;
        setHandlePosition();
        e.preventDefault();
      }
    }, false );

    // For Firefox
    _containerChild.addEventListener( "DOMMouseScroll", function( e ){
      if( e.axis === e.HORIZONTAL_AXIS || ( e.axis === e.VERTICAL_AXIS && e.shiftKey )){
        _containerParent.scrollLeft += e.detail * 2;
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
      _containerParent.scrollLeft = ( _scrollWidth - _elementWidth ) * p;
    }, false);

    window.addEventListener( "resize", setup, false );
    _handle.addEventListener( "mousedown", onMouseDown, false );

    this.update = function(){
      setup();
    }; //update

    setup();

    Object.defineProperties( this, {
      element: {
        enumerable: true,
        get: function(){
          return _element;
        }
      }
    });

  } //Horizontal

  return {
    Vertical: Vertical,
    Horizontal: Horizontal
  };

}); //define

