/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [], function(){

  var CHECK_MEDIA_INTERVAL = 50,
      SCROLL_INTERVAL = 16,
      SCROLL_DISTANCE = 20,
      MOUSE_SCRUBBER_PIXEL_WINDOW = 3;

  return function( butter, parentElement, media, tracksContainer, hScrollbar ){
    var _container = document.createElement( "div" ),
        _node = document.createElement( "div" ),
        _line = document.createElement( "div" ),
        _fill = document.createElement( "div" ),
        _tracksContainer = tracksContainer,
        _tracksContainerWidth,
        _element = parentElement,
        _media = media,
        _mouseDownPos,
        _currentMousePos,
        _zoom = 1,
        _scrollInterval = -1,
        _rect,
        _mediaCheckInterval,
        _width,
        _isPlaying = false,
        _isScrubbing = false,
        _lastTime = -1,
        _lastScroll = _tracksContainer.element.scrollLeft,
        _lastZoom = -1,
        _lineWidth = 0,
        _this = this;

    _container.className = "time-bar-scrubber-container";
    _node.className = "time-bar-scrubber-node";
    _line.className = "time-bar-scrubber-line";
    _fill.className = "fill-bar";

    _node.appendChild( _line );
    _container.appendChild( _fill );
    _container.appendChild( _node );
    _element.appendChild( _container );

    butter.ui.registerStateToggleFunctions( "timeline", {
      transitionIn: function(){
        _line.removeAttribute( "data-butter-shortened" );
      },
      transitionOut: function(){
        _line.setAttribute( "data-butter-shortened", true );
      }
    });

    function setNodePosition(){
      var duration = _media.duration,
          currentTime = _media.currentTime,
          scrollLeft = _tracksContainer.element.scrollLeft;

      // if we can avoid re-setting position and visibility, then do so
      if( _lastTime !== currentTime || _lastScroll !== scrollLeft || _lastZoom !== _zoom ){

        var pos = currentTime / duration * _tracksContainerWidth,
            adjustedPos = pos - scrollLeft;

        if( pos <  scrollLeft || Math.floor( pos ) - _lineWidth > _width + scrollLeft ){
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

      _lastTime = currentTime;
      _lastScroll = scrollLeft;
      _lastZoom = _zoom;

    } //setNodePosition

    hScrollbar.listen( "scroll", setNodePosition );

    function onMouseUp( e ){
      if( _isPlaying ){
        _media.play();
        _isScrubbing = false;
      }

      clearInterval( _scrollInterval );
      _scrollInterval = -1;

      window.removeEventListener( "mouseup", onMouseUp, false );
      window.removeEventListener( "mousemove", onMouseMove, false );
    } //onMouseUp

    function scrollTracksContainer( direction ){
      if( direction === "right" ){
        _scrollInterval = setInterval(function(){
          if( _currentMousePos < _rect.right - MOUSE_SCRUBBER_PIXEL_WINDOW ){
            clearInterval( _scrollInterval );
            _scrollInterval = -1;
          }
          else{
            _currentMousePos += SCROLL_DISTANCE;
            _tracksContainer.element.scrollLeft += SCROLL_DISTANCE;
            evalMousePosition();
            setNodePosition();
          }
        }, SCROLL_INTERVAL );
      }
      else{
        _scrollInterval = setInterval(function(){
          if( _currentMousePos > _rect.left + MOUSE_SCRUBBER_PIXEL_WINDOW ){
            clearInterval( _scrollInterval );
            _scrollInterval = -1;
          }
          else{
            _currentMousePos -= SCROLL_DISTANCE;
            _tracksContainer.element.scrollLeft -= SCROLL_DISTANCE;
            evalMousePosition();
            setNodePosition();
          }
        }, SCROLL_INTERVAL );
      }
    } //scrollTracksContainer

    function evalMousePosition(){
      var diff = _currentMousePos - _mouseDownPos;
      diff = Math.max( 0, Math.min( diff, _width ) );
      _media.currentTime = ( diff + _tracksContainer.element.scrollLeft ) / _tracksContainerWidth * _media.duration;
    } //evalMousePosition

    function onMouseMove( e ){
      _currentMousePos = e.pageX;

      if( _scrollInterval === -1 ){
        if( _currentMousePos > _rect.right - MOUSE_SCRUBBER_PIXEL_WINDOW ){
          scrollTracksContainer( "right" );
        }
        else if( _currentMousePos < _rect.left + MOUSE_SCRUBBER_PIXEL_WINDOW ){
          scrollTracksContainer( "left" );
        } //if
      } //if

      evalMousePosition();
      setNodePosition();
    } //onMouseMove

    function onScrubberMouseDown( e ){
      _mouseDownPos = e.pageX - _node.offsetLeft;

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

    this.update = function( containerWidth, zoom ){
      _zoom = zoom || _zoom;
      _width = containerWidth;
      _tracksContainerWidth = _tracksContainer.container.getBoundingClientRect().width;
      _container.style.width = _width + "px";
      _rect = _container.getBoundingClientRect();
      _lineWidth = _line.clientWidth;
      setNodePosition();
    }; //update

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
