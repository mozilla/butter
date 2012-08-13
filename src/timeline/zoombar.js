/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */


define( [], function(){
  var ZOOM_LEVELS = 6;

  return function( zoomCallback, mediaRootElement ){

    var _element = mediaRootElement.querySelector( ".zoom-bar" ),
        _handle = _element.querySelector( ".butter-scroll-handle" ),
        _rect,
        _mousePos,
        _handleWidth,
        _elementWidth,
        _this = this;

    function onMouseUp(){
      window.removeEventListener( "mouseup", onMouseUp, false );
      window.removeEventListener( "mousemove", onMouseMove, false );
      _handle.addEventListener( "mousedown", onMouseDown, false );
      zoomCallback( _handle.offsetLeft / ( _rect.width - _handle.clientWidth ) );
    } //onMouseUp

    function onMouseMove( e ){
      var diff = e.pageX - _mousePos;
      diff = Math.max( 0, Math.min( diff, _elementWidth - _handleWidth ) );
      _handle.style.left = diff + "px";
      zoomCallback( _handle.offsetLeft / ( _rect.width - _handle.clientWidth ) );
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

    _handle.addEventListener( "mousedown", onMouseDown, false );

    this.update = function() {
      _rect = _element.getBoundingClientRect();
      _handleWidth = ( _rect.width / ZOOM_LEVELS );
      _handle.style.width = _handleWidth + "px";
      _elementWidth = _rect.width;
    };

    this.zoom = function( level ) {
      _this.update();
      _handle.style.left = ( _rect.width - _handle.clientWidth ) * level + "px";
      zoomCallback( _handle.offsetLeft / ( _rect.width - _handle.clientWidth ) );
    };

    _element.addEventListener( "click", function( e ) {
      // bail early if this event is coming from the handle
      if( e.srcElement === _handle ) {
        return;
      }

      var posX = e.pageX,
          handleRect = _handle.getBoundingClientRect(),
          elementRect = _element.getBoundingClientRect();

      if( posX > handleRect.right ) {
        _handle.style.left = ( ( posX - elementRect.left ) - _handleWidth ) + "px";
      } else {
        _handle.style.left = posX - elementRect.left + "px";
      }

      onMouseMove( e );
    }, false);

    _element.addEventListener( "resize", function( e ){
      _this.update();
    }, false );

    Object.defineProperties( this, {
      element: {
        enumerable: true,
        get: function(){
          return _element;
        }
      }
    });

  }; //ZoomBar
});
