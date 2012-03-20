/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [], function(){

  var CHECK_MEDIA_INTERVAL = 50;

  return function( parentElement, media, tracksContainer ){
    var _container = document.createElement( "div" ),
        _node = document.createElement( "div" ),
        _line = document.createElement( "div" ),
        _fill = document.createElement( "div" ),
        _tracksContainer = tracksContainer,
        _tracksContainerWidth,
        _element = parentElement,
        _media = media,
        _mousePos,
        _zoom = 1,
        _mediaCheckInterval,
        _width,
        _isPlaying = false,
        _isScrubbing = false,
        _lastTime = -1,
        _lastScroll = _tracksContainer.element.scrollLeft,
        _this = this;

    _container.className = "time-bar-scrubber-container";
    _node.className = "time-bar-scrubber-node";
    _line.className = "time-bar-scrubber-line";
    _fill.className = "fill-bar";

    _node.appendChild( _line );
    _container.appendChild( _fill );
    _container.appendChild( _node );
    _element.appendChild( _container );

    function setNodePosition(){
      var duration = _media.duration,
          currentTime = _media.currentTime,
          scrollLeft = _tracksContainer.element.scrollLeft;

      // if we can avoid re-setting position and visibility, then do so
      if( _lastTime !== currentTime || _lastScroll !== scrollLeft ){
        var pos = currentTime / duration * _tracksContainerWidth,
            adjustedPos = pos - scrollLeft;

        _lastTime = currentTime;

        if( pos <  scrollLeft || pos > _width + scrollLeft ){
          _node.style.display = "none";
        }
        else {
          _node.style.left = adjustedPos + "px";
          _node.style.display = "block";
        } //if

        if( pos < scrollLeft ){
          _fill.style.display = "none";
        }
        else {
          if( pos > _width + scrollLeft ){
            _fill.style.width = ( _width - 2 ) + "px";
          }
          else {
            _fill.style.width = adjustedPos + "px";
          } //if
          _fill.style.display = "block";
        } //if

      } //if

    } //setNodePosition

    _tracksContainer.container.addEventListener( "scroll", function( e ){
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
      _media.currentTime = ( diff + _tracksContainer.element.scrollLeft ) / _tracksContainerWidth * _media.duration;
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
      _media.currentTime = ( pos + _tracksContainer.element.scrollLeft ) / _tracksContainerWidth * _media.duration;
      setNodePosition();
      onScrubberMouseDown( e );
    }; //onMouseDown

    _node.addEventListener( "mousedown", onScrubberMouseDown, false );
    _container.addEventListener( "mousedown", onMouseDown, false );

    this.update = function( zoom ){
      _zoom = zoom || _zoom;
      _tracksContainerWidth = _tracksContainer.container.getBoundingClientRect().width;
      _width = _element.getBoundingClientRect().width;
      _width = Math.min( _width, _tracksContainerWidth );
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
