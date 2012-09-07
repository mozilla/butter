/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "util/time" ],
  function( TimeUtils ) {

  var CHECK_MEDIA_INTERVAL = 50,
      SCROLL_INTERVAL = 16,
      SCROLL_DISTANCE = 20,
      MOUSE_SCRUBBER_PIXEL_WINDOW = 3;

  return function( butter, parentElement, media, tracksContainer ){
    var _container = parentElement,
        _node = _container.querySelector( ".time-bar-scrubber-node" ),
        _timeTooltip = _container.querySelector( ".butter-time-tooltip" ),
        _line = _container.querySelector( ".time-bar-scrubber-line" ),
        _fill = _container.querySelector( ".fill-bar" ),
        _tracksContainer = tracksContainer,
        _tracksContainerWidth,
        _media = media,
        _mouseDownPos,
        _currentMousePos,
        _scrollInterval = -1,
        _rect,
        _width = 0,
        _isPlaying = false,
        _isScrubbing = false,
        _lastTime = -1,
        _lastScroll = _tracksContainer.element.scrollLeft,
        _lineWidth = 0,
        _seekCompleted = false,
        _seekMouseUp = false;

    function setNodePosition() {
      var duration = _media.duration,
          currentTime = _media.currentTime,
          tracksElement = _tracksContainer.element,
          scrollLeft = tracksElement.scrollLeft;
          _timeTooltip.innerHTML = TimeUtils.toTimecode( _media.currentTime );

      // If we can avoid re-setting position and visibility, then do so
      if( _lastTime !== currentTime || _lastScroll !== scrollLeft ){
        // To prevent some scrubber jittering (from viewport centering), pos is rounded before
        // being used in calculation to account for possible precision issues.
        var pos = Math.round( currentTime / duration * _tracksContainerWidth ),
            adjustedPos = pos - scrollLeft;

        // If the node position is outside of the viewing window, hide it.
        // Otherwise, show it and adjust its position.
        // Note the use of clientWidth here to account for padding/margin width fuzziness.
        if( pos < scrollLeft || pos - _lineWidth > _container.clientWidth + scrollLeft ){
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
    }

    function onMouseUp( e ){
      _seekMouseUp = true;

      _timeTooltip.classList.remove( "tooltip-on" );

      if( _isPlaying && _seekCompleted ){
        _media.play();
      }

      if( _isScrubbing ){
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

    function onSeeked( e ){
      _seekCompleted = true;

      _media.unlisten( "mediaseeked", onSeeked );

      if( _isPlaying && _seekMouseUp ) {
        _media.play();
      }
    }

    function onScrubberMouseDown( e ){
      _mouseDownPos = e.pageX - _node.offsetLeft;

      if( _isPlaying ){
        _media.pause();
        _isScrubbing = true;
      }

      if ( _media.currentTime ) {
        _timeTooltip.innerHTML = TimeUtils.toTimecode( _media.currentTime );
      }
      _timeTooltip.classList.add( "tooltip-on" );

      _seekCompleted = _seekMouseUp = false;
      _media.listen( "mediaseeked", onSeeked );

      _node.removeEventListener( "mousedown", onScrubberMouseDown, false );
      window.addEventListener( "mousemove", onMouseMove, false );
      window.addEventListener( "mouseup", onMouseUp, false );
    } //onMouseDown

    var onMouseDown = this.onMouseDown = function( e ){
      var pos = e.pageX - _container.getBoundingClientRect().left;
      _media.currentTime = ( pos + _tracksContainer.element.scrollLeft ) / _tracksContainerWidth * _media.duration;
      setNodePosition();
      onScrubberMouseDown( e );
    }; //onMouseDown

    _node.addEventListener( "mousedown", onScrubberMouseDown, false );
    _container.addEventListener( "mousedown", onMouseDown, false );

    this.update = function( containerWidth ) {
      _width = containerWidth || _width;
      _tracksContainerWidth = _tracksContainer.container.getBoundingClientRect().width;
      _rect = _container.getBoundingClientRect();
      _lineWidth = _line.clientWidth;
      setNodePosition();
    };

    function checkMedia() {
      setNodePosition();
    }

    _media.listen( "mediaplaying", function( e ){
      _isPlaying = true;
    });

    _media.listen( "mediapause", function( e ){
      if( !_isScrubbing ){
        _isPlaying = false;
      }
    });

    var _checkMediaInterval = setInterval( checkMedia, CHECK_MEDIA_INTERVAL );

    this.destroy = function(){
      clearInterval( _checkMediaInterval );
    };
  };
});
