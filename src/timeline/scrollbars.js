/**********************************************************************************

Copyright (C) 2012 by Mozilla Foundation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

**********************************************************************************/

define( [], function(){

  function Vertical( parentElement, controlElement ){
    var _element = document.createElement( "div" ),
        _handle = document.createElement( "div" ),
        _parent = parentElement,
        _control = controlElement,
        _elementHeight,
        _controlHeight,
        _handleHeight,
        _mousePos = 0,
        _this = this;

    _element.className = "butter-timeline-scroll butter-timeline-scroll-v";
    _handle.className = "butter-timeline-scroll-handle";

    _element.appendChild( _handle );
    _parent.appendChild( _element );

    function setup(){
      _elementHeight = _element.getBoundingClientRect().height;
      _controlHeight = _control.getBoundingClientRect().height;
      _handleHeight = Math.min( _elementHeight, _elementHeight - ( _control.scrollHeight - _controlHeight ) );
      _handle.style.height = _handleHeight + "px";
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
      var p = 0;
      if( _elementHeight - _handleHeight > 0 ){
        p = _handle.offsetTop / ( _elementHeight - _handleHeight );
      } //if
      _control.scrollTop = ( _control.scrollHeight - _elementHeight ) * p;
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
    }; //update

    _element.addEventListener( "click", function( e ) {
      // bail early if this event is coming from the handle
      if( e.srcElement.className.search( "butter-timeline-scroll-handle" ) === 0 ) {
        return;
      }

      var posY = e.pageY,
          handleRect = _handle.getBoundingClientRect(),
          elementRect = _element.getBoundingClientRect(),
          p;

      if( posY > handleRect.top ) {
        _handle.style.top = ( ( posY - elementRect.top ) - _handleHeight ) + "px"; 
      } else {
        _handle.style.top = posY - elementRect.top + "px"; 
      }

      p = _handle.offsetTop / ( _elementHeight - _handleHeight );
      _control.scrollTop = ( _control.scrollHeight - _elementHeight ) * p;
    }, false);

    _control.addEventListener( "resize", setup, false );
    _handle.addEventListener( "mousedown", onMouseDown, false );

    setup();

  } //Vertical

  function Horizontal( parentElement, controlElement ){
    var _element = document.createElement( "div" ),
        _handle = document.createElement( "div" ),
        _parent = parentElement,
        _control = controlElement,
        _elementWidth,
        _controlWidth,
        _handleWidth,
        _mousePos = 0,
        _this = this;

    _element.className = "butter-timeline-scroll butter-timeline-scroll-h";
    _handle.className = "butter-timeline-scroll-handle";

    _element.appendChild( _handle );
    _parent.appendChild( _element );

    function setup(){
      _elementWidth = _element.getBoundingClientRect().width;
      _controlWidth = _control.getBoundingClientRect().width;
      _handleWidth = Math.max( 20, Math.min( _elementWidth, _elementWidth - ( _control.scrollWidth - _controlWidth ) ) );
      _handle.style.width = _handleWidth + "px";
      var p = 0;
      if( _control.scrollWidth - _elementWidth > 0 ){
        p = _control.scrollLeft / ( _control.scrollWidth - _elementWidth );
      } //if
      _handle.style.left = p * ( _elementWidth - _handleWidth ) + "px";
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
      _control.scrollLeft = ( _control.scrollWidth - _elementWidth ) * p;
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

    _element.addEventListener( "click", function( e ) {
      // bail early if this event is coming from the handle
      if( e.srcElement.className.search( "butter-timeline-scroll-handle" ) === 0 ) {
        return;
      }

      var posX = e.pageX,
          handleRect = _handle.getBoundingClientRect(),
          elementRect = _element.getBoundingClientRect(),
          p;

      if( posX > handleRect.right ) {
        _handle.style.left = ( ( posX - elementRect.left ) - _handleWidth ) + "px"; 
      } else {
        _handle.style.left = posX - elementRect.left + "px"; 
      }
      
      p = _handle.offsetLeft / ( _elementWidth - _handleWidth );
      _control.scrollLeft = ( _control.scrollWidth - _elementWidth ) * p;
    }, false);

    _control.addEventListener( "resize", setup, false );
    _handle.addEventListener( "mousedown", onMouseDown, false );

    this.update = function(){
      setup();
    }; //update

    setup();

  } //Horizontal

  return {
    Vertical: Vertical,
    Horizontal: Horizontal
  };

}); //define

