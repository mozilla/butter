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
        _fill = document.createElement( "div" ),
        _tracksContainer = tracksContainer,
        _tracklinerContainer = _tracksContainer.firstChild,
        _tracklinerWidth,
        _parent = parentElement,
        _media = media,
        _mousePos,
        _zoom = 1,
        _mediaCheckInterval,
        _width,
        _isPlaying = false,
        _isScrubbing = false,
        _lastTime = -1,
        _lastScroll = -1,
        _this = this;

    _container.className = "time-bar-scrubber-container";
    _node.className = "time-bar-scrubber-node";
    _line.className = "time-bar-scrubber-line";
    _fill.className = "fill-bar";

    _node.appendChild( _line );
    _container.appendChild( _fill );
    _container.appendChild( _node );
    _parent.appendChild( _container );

    function setNodePosition(){
      var duration = _media.duration,
          currentTime = _media.currentTime;

      // if we can avoid re-setting position and visibility, then do so
      if( _lastTime !== currentTime || _lastScroll !== _tracksContainer.scrollLeft ){
        var pos = currentTime / duration * _tracklinerWidth,
            adjustedPos = pos - _tracksContainer.scrollLeft;

        _lastTime = currentTime;

        if( pos < _tracksContainer.scrollLeft || pos > _width + _tracksContainer.scrollLeft ){
          _node.style.display = "none";
        }
        else {
          _node.style.left = adjustedPos + "px";
          _node.style.display = "block";
        } //if

        if( pos < _tracksContainer.scrollLeft ){
          _fill.style.display = "none";
        }
        else {
          if( pos > _width + _tracksContainer.scrollLeft ){
            _fill.style.width = ( _width - 2 ) + "px";
          }
          else {
            _fill.style.width = adjustedPos + "px";
          } //if
          _fill.style.display = "block";
        } //if

      } //if

    } //setNodePosition

    _tracksContainer.addEventListener( "scroll", function( e ){
      setNodePosition();
    }, false );

    function onMouseUp( e ){
      if( _isPlaying ){
        _media.play();
        _isScrubbing = false;  
      }

      window.removeEventListener( "mouseup", onMouseUp, false );
      window.removeEventListener( "mousemove", onMouseMove, false );
    } //onMouseUp

    function onMouseMove( e ){
      var diff = e.pageX - _mousePos;
      diff = Math.max( 0, Math.min( diff, _width ) );
      _media.currentTime = ( diff + _tracksContainer.scrollLeft ) / _tracklinerWidth * _media.duration;
      setNodePosition();
    } //onMouseMove

    function onScrubberMouseDown( e ){
      _mousePos = e.pageX - _node.offsetLeft;

      if( _isPlaying ){
        _media.pause();
        _isScrubbing = true;
      }

      _node.removeEventListener( "mousedown", onScrubberMouseDown, false );
      window.addEventListener( "mousemove", onMouseMove, false );
      window.addEventListener( "mouseup", onMouseUp, false );
    } //onMouesDown

    var onMouseDown = this.onMouseDown = function( e ){
      var pos = e.pageX - _container.getBoundingClientRect().left;
      _media.currentTime = ( pos + _tracksContainer.scrollLeft ) / _tracklinerWidth * _media.duration;
      setNodePosition();
      onScrubberMouseDown( e );
    }; //onMouseDown

    _node.addEventListener( "mousedown", onScrubberMouseDown, false );
    _container.addEventListener( "mousedown", onMouseDown, false );

    this.update = function( zoom ){
      _zoom = zoom || _zoom;
      _tracklinerContainer = _tracksContainer.firstChild;
      _tracklinerWidth = _tracklinerContainer.getBoundingClientRect().width;
      _width = _parent.getBoundingClientRect().width;
      _width = Math.min( _width, _tracklinerWidth );
      _container.style.width = _width + "px";
      setNodePosition();
    }; //update

    window.addEventListener( "resize", _this.update, false );

    function checkMedia(){
      setNodePosition();
    } //checkMedia

    _media.listen( "mediaplaying", function( e ){
      _isPlaying = true;
    });

    _media.listen( "mediapause", function( e ){
      if( !_isScrubbing ){
        _isPlaying = false;
      }
    });

    _checkMediaInterval = setInterval( checkMedia, CHECK_MEDIA_INTERVAL );

    this.destroy = function(){
      clearInterval( _checkMediaInterval );
    }; //destroy
  };
});
