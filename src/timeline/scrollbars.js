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

  const SCROLL_FACTOR = 5;

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
      _handleHeight = Math.min( _elementHeight, _controlHeight / SCROLL_FACTOR );
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
      var p = _handle.offsetTop / ( _elementHeight - _handleHeight );
      _control.scrollTop = ( _control.scrollHeight - _elementHeight ) * p;
    } //onMouseMove

    function onMouseDown( e ){
      var handleY = _handle.offsetTop;
      _mousePos = e.pageY - handleY;
      window.addEventListener( "mouseup", onMouseUp, false );
      window.addEventListener( "mousemove", onMouseMove, false );
      _handle.removeEventListener( "mousedown", onMouseDown, false );
    } //onMouseDown

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
      _handleWidth = Math.min( _elementWidth, _controlWidth / SCROLL_FACTOR );
      _handle.style.width = _handleWidth + "px";
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
      var handleX = _handle.offsetLeft;
      _mousePos = e.pageX - handleX;
      window.addEventListener( "mouseup", onMouseUp, false );
      window.addEventListener( "mousemove", onMouseMove, false );
      _handle.removeEventListener( "mousedown", onMouseDown, false );
    } //onMouseDown

    _control.addEventListener( "resize", setup, false );
    _handle.addEventListener( "mousedown", onMouseDown, false );
    setup();

  } //Horizontal

  return {
    Vertical: Vertical,
    Horizontal: Horizontal
  };

}); //define

