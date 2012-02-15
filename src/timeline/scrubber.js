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

  const CHECK_MEDIA_INTERVAL = 50;

  return function( parentElement, media, tracksContainer ){
    var _container = document.createElement( "div" ),
        _node = document.createElement( "div" ),
        _line = document.createElement( "div" ),
        _tracksContainer = tracksContainer,
        _parent = parentElement,
        _media = media,
        _mousePos,
        _zoom = 1,
        _mediaCheckInterval,
        _width,
        _this = this;

    _container.className = "butter-timebar-scrubber-container";
    _node.className = "butter-timebar-scrubber-node";
    _line.className = "butter-timebar-scrubber-line";

    _node.appendChild( _line );
    _container.appendChild( _node );
    _parent.appendChild( _container );

    function setNodePosition(){
      var duration = _media.duration,
          currentTime = _media.currentTime,
          pos = currentTime / duration * _tracksContainer.scrollWidth;

      if( pos < _tracksContainer.scrollLeft || pos > _tracksContainer.offsetWidth + _tracksContainer.scrollLeft ){
        _node.style.display = "none";
      }
      else {
        _node.style.left = pos - _tracksContainer.scrollLeft + "px";
        _node.style.display = "block";
      } //if
    } //setNodePosition

    _tracksContainer.addEventListener( "scroll", function( e ){
      setNodePosition();
    }, false );

    function onMouseUp( e ){
      _node.addEventListener( "mousedown", onMouseDown, false );
      window.removeEventListener( "mouseup", onMouseUp, false );
      window.removeEventListener( "mousemove", onMouseMove, false );
    } //onMouseUp

    function onMouseMove( e ){
      var diff = e.pageX - _mousePos;
      diff = Math.max( 0, Math.min( diff, _width ) );
      _node.style.left = diff + "px";
      _media.currentTime = ( diff + _tracksContainer.scrollLeft ) / _tracksContainer.scrollWidth * _media.duration;
    } //onMouseMove

    function onMouseDown( e ){
      _mousePos = e.pageX - _node.offsetLeft;
      _node.removeEventListener( "mousedown", onMouseDown, false );
      window.addEventListener( "mousemove", onMouseMove, false );
      window.addEventListener( "mouseup", onMouseUp, false );
    } //onMouesDown

    _node.addEventListener( "mousedown", onMouseDown, false );

    this.update = function( zoom ){
      _zoom = zoom;
      _width = _parent.getBoundingClientRect().width;
      _container.style.width = _width + "px";
      setNodePosition();
    }; //update

    function checkMedia(){
      setNodePosition();
    } //checkMedia

    _media.listen( "mediaplaying", function( e ){
      _checkMediaInterval = setInterval( checkMedia, CHECK_MEDIA_INTERVAL );
    });

    _media.listen( "mediapause", function( e ){
      clearInterval( _checkMediaInterval );
    });
  };
});
