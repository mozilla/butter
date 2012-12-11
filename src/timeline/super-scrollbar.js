/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

/* Super scrollbar is a scrollbar and a zoom bar in one.
 * It also doubles as a minimap of sorts.
 * Displaying a preview of all the tracks and track events */
define( [ "util/lang", "text!layouts/super-scrollbar.html" ],
  function( LangUtils, SUPER_SCROLLBAR_LAYOUT ) {

  var TRACK_PADDING = 1,          // This padding is pixels between track event visuals.
                                  // This is, in pixels, how close the left and right handles on the
                                  // viewport can get.
                                  // TODO: There is a bug I cannot find (yet), to keep this value from working on
                                  // right handle.
                                  // Right drag solves this with css min-width that is the same as MIN_WIDTH.
                                  // min-width only seems to work for right, and not left, so left uses MIN_WIDTH.
                                  // need one fix for both cases.

      MIN_WIDTH = 5,
      ARROW_MIN_WIDTH = 50,       // The arrows have to change position at this point.
      ARROW_MIN_WIDTH_CLASS = "super-scrollbar-small";

  return function( outerElement, innerElement, boundsChangedCallback, media ) {
    var _outer = LangUtils.domFragment( SUPER_SCROLLBAR_LAYOUT, "#butter-super-scrollbar-outer-container" ),
        _inner = _outer.querySelector( "#butter-super-scrollbar-inner-container" ),
        _rect, _duration,
        _media = media,
        // viewport is the draggable, resizable, representation of the viewable track container.
        _viewPort = _inner.querySelector( "#butter-super-scrollbar-viewport" ),
        _leftHandle = _viewPort.querySelector( "#butter-super-scrollbar-handle-left" ),
        _rightHandle = _viewPort.querySelector( "#butter-super-scrollbar-handle-right" ),
        // visuals is the container for the visual representations for track events.
        _visuals = _inner.querySelector( "#butter-super-scrollbar-visuals" ),
        _scrubber = _inner.querySelector( "#buter-super-scrollbar-scrubber" ),
        _zoomSlider = _outer.querySelector( ".butter-super-scrollbar-zoom-slider" ),
        _zoomSliderContainer = _outer.querySelector( ".butter-super-scrollbar-zoom-slider-container" ),
        _zoomSliderHandle = _outer.querySelector( ".butter-super-scrollbar-zoom-handle" ),
        _offset = 0,
        _trackEventVisuals = {},
        _boundsChangedCallback = function( left, width ) {
          if ( width !== -1 ) {
            _zoomSliderHandle.style.left = width * 100 + "%";
          }
          boundsChangedCallback( left, width );
        },
        _this = this;

    var checkMinSize, onViewMouseUp, onViewMouseDown, onViewMouseMove,
        onLeftMouseUp, onLeftMouseDown, onLeftMouseMove,
        onRightMouseUp, onRightMouseDown, onRightMouseMove,
        onElementMouseUp, onElementMouseDown, onElementMouseMove,
        updateView;

    checkMinSize = function() {
      if ( _viewPort.getBoundingClientRect().width < ARROW_MIN_WIDTH ) {
        _inner.classList.add( ARROW_MIN_WIDTH_CLASS );
      } else {
        _inner.classList.remove( ARROW_MIN_WIDTH_CLASS );
      }
    };

    _this.update = function() {
      _rect = _inner.getBoundingClientRect();
      checkMinSize();
    };

    onElementMouseUp = function( e ) {
      e.stopPropagation();
      window.removeEventListener( "mouseup", onElementMouseUp, false );
      window.removeEventListener( "mousemove", onElementMouseMove, false );
    };

    onViewMouseUp = function( e ) {
      e.stopPropagation();
      window.removeEventListener( "mouseup", onViewMouseUp, false );
      window.removeEventListener( "mousemove", onViewMouseMove, false );
    };

    onLeftMouseUp = function( e ) {
      e.stopPropagation();
      outerElement.addEventListener( "scroll", updateView, false );
      window.removeEventListener( "mouseup", onLeftMouseUp, false );
      window.removeEventListener( "mousemove", onLeftMouseMove, false );
    };

    onRightMouseUp = function( e ) {
      e.stopPropagation();
      outerElement.addEventListener( "scroll", updateView, false );
      window.removeEventListener( "mouseup", onRightMouseUp, false );
      window.removeEventListener( "mousemove", onRightMouseMove, false );
    };

    onElementMouseDown = function( e ) {
      e.stopPropagation();
      media.currentTime = ( e.clientX - _rect.left ) / _rect.width * _duration;
      _viewPort.classList.remove( "viewport-transition" );
      window.addEventListener( "mouseup", onElementMouseUp, false );
      window.addEventListener( "mousemove", onElementMouseMove, false );
    };

    onViewMouseDown = function( e ) {
      e.stopPropagation();
      _viewPort.classList.remove( "viewport-transition" );
      _offset = e.clientX - _rect.left - _viewPort.offsetLeft;
      _media.pause();  // pause the media here to diffuse confusion with scrolling & playing
      window.addEventListener( "mouseup", onViewMouseUp, false );
      window.addEventListener( "mousemove", onViewMouseMove, false );
    };

    onLeftMouseDown = function( e ) {
      e.stopPropagation();
      _media.pause();  // pause the media here to diffuse confusion with scrolling & playing
      _viewPort.classList.remove( "viewport-transition" );
      outerElement.removeEventListener( "scroll", updateView, false );
      window.addEventListener( "mouseup", onLeftMouseUp, false );
      window.addEventListener( "mousemove", onLeftMouseMove, false );
    };

    onRightMouseDown = function( e ) {
      e.stopPropagation();
      _media.pause();  // pause the media here to diffuse confusion with scrolling & playing
      outerElement.removeEventListener( "scroll", updateView, false );
      _viewPort.classList.remove( "viewport-transition" );
      window.addEventListener( "mouseup", onRightMouseUp, false );
      window.addEventListener( "mousemove", onRightMouseMove, false );
    };

    onElementMouseMove = function( e ) {
      e.preventDefault();
      e.stopPropagation();
      media.currentTime = ( e.clientX - _rect.left ) / _rect.width * _duration;
    };

    onViewMouseMove = function( e ) {
      e.preventDefault();
      e.stopPropagation();
      _boundsChangedCallback( Math.max( 0, ( e.clientX - _rect.left - _offset ) ) / _rect.width, -1 );
    };

    onLeftMouseMove = function( e ) {
      e.preventDefault();
      e.stopPropagation();

      // position is from the left of the container, to the left of the viewport.
      var position = e.clientX - _rect.left;

      // make sure we never go out of bounds.
      if ( position < 0 ) {
        position = 0;
      }

      // make sure left never goes over right.
      if ( position + MIN_WIDTH > _viewPort.offsetLeft + _viewPort.clientWidth ) {
        position = _viewPort.offsetLeft + _viewPort.clientWidth - MIN_WIDTH;
      }

      _viewPort.style.left = position / _rect.width * 100 + "%";
      _boundsChangedCallback( _viewPort.offsetLeft / _rect.width, _viewPort.offsetWidth / _rect.width );
    };

    onRightMouseMove = function( e ) {
      e.preventDefault();
      e.stopPropagation();

      // position is from the right of the container, to the right of the viewport.
      var position = _rect.width - ( e.clientX - _rect.left );

      // make sure we never go out of bounds.
      if ( position < 0 ) {
        position = 0;
      }

      _viewPort.style.right = position / _rect.width * 100 + "%";
      _boundsChangedCallback( _viewPort.offsetLeft / _rect.width, _viewPort.offsetWidth / _rect.width );
    };

    updateView = function() {
      _viewPort.style.left = outerElement.scrollLeft / innerElement.offsetWidth * 100 + "%";
      _viewPort.style.right = ( 1 - ( outerElement.scrollLeft + outerElement.offsetWidth ) / innerElement.offsetWidth ) * 100 + "%";
    };

    _inner.addEventListener( "mousedown", onElementMouseDown, false );
    outerElement.addEventListener( "scroll", updateView, false );
    _viewPort.addEventListener( "mousedown", onViewMouseDown, false );
    _leftHandle.addEventListener( "mousedown", onLeftMouseDown, false );
    _rightHandle.addEventListener( "mousedown", onRightMouseDown, false );

    /**
     * scaleViewPort
     *
     * Scales the viewport by a percentage value (0 - 1). The viewport grows or shrinks
     * to cover less or more area, and calls _boundsChangedCallback with the new (left, width) combination
     * as percentage values (0 - 1). This action has the consequence of zooming the
     * track container viewport in or out.
     *
     * A left and right position are calculated by moving them a set amount from their current
     * positions around the mid-point of the viewport. A new width value is also calculated
     * to provide _boundsChangedCallback with the necessary values: left & width.
     *
     * If the growth or shrink rate results in less than a pixel on both ends, nothing happens.
     *
     * @param {Number} scale: Percentage (0 - 1) to grow or shrink the viewport
     */
    function scaleViewPort( scale ) {

      var viewWidth = _viewPort.clientWidth,
          viewLeft = _viewPort.offsetLeft,
          rectWidth = _rect.width,
          oldScale = viewWidth / rectWidth,
          scaleDiff = oldScale - scale,
          halfScale = scaleDiff / 2,
          pixelGrowth = halfScale * rectWidth,
          rightPosition,
          leftPosition;

      // make sure our growth is at least a pixel on either side.
      if ( ( pixelGrowth > -1 && pixelGrowth < 1 ) ) {
        return;
      }

      rightPosition = ( 1 - ( ( viewLeft + viewWidth ) / rectWidth ) ) + halfScale;
      leftPosition = ( viewLeft / rectWidth ) + halfScale;

      if ( rightPosition < 0 ) {
        leftPosition += rightPosition;
        rightPosition = 0;
      }
      if ( leftPosition < 0 ) {
        rightPosition += leftPosition;
        leftPosition = 0;
      }

      _viewPort.style.right = rightPosition * 100 + "%";
      _viewPort.style.left = leftPosition * 100 + "%";

      _boundsChangedCallback( leftPosition, scale );
    }

    function zoomSliderMouseUp( e ) {
      _viewPort.classList.remove( "viewport-transition" );
      window.removeEventListener( "mouseup", zoomSliderMouseUp, false );
      window.removeEventListener( "mousemove", zoomSliderMouseMove, false );
      _zoomSliderContainer.addEventListener( "mousedown", zoomSliderContainerMouseDown, false );
      _zoomSliderHandle.addEventListener( "mousedown", zoomSliderHanldeMouseDown, false );
    }

    function zoomSliderMouseMove( e ) {
      e.preventDefault();
      updateZoomSlider( e );
    }

    function updateZoomSlider( e ) {
      var position = e.clientX - ( _zoomSliderContainer.offsetLeft + ( _zoomSliderHandle.offsetWidth / 2 ) ),
          scale;

      if ( position < 0 ) {
        position = 0;
      } else if ( position > _zoomSlider.offsetWidth ) {
        position = _zoomSlider.offsetWidth;
      }
      scale = position / _zoomSlider.offsetWidth;
      if ( scale * _rect.width < MIN_WIDTH ) {
        scale = MIN_WIDTH / _rect.width;
      }
      scaleViewPort( scale );
      _zoomSliderHandle.style.left = position / _zoomSlider.offsetWidth * 100 + "%";
    }

    function zoomSliderContainerMouseDown( e ) {
      _viewPort.classList.add( "viewport-transition" );
      updateZoomSlider( e );
      _zoomSliderHandle.removeEventListener( "mousedown", zoomSliderHanldeMouseDown, false );
      _zoomSliderContainer.removeEventListener( "mousedown", zoomSliderContainerMouseDown, false );
      window.addEventListener( "mousemove", zoomSliderMouseMove, false );
      window.addEventListener( "mouseup", zoomSliderMouseUp, false );
    }

    function zoomSliderHanldeMouseDown( e ) {
      _viewPort.classList.add( "viewport-transition" );
      _zoomSliderHandle.removeEventListener( "mousedown", zoomSliderHanldeMouseDown, false );
      _zoomSliderContainer.removeEventListener( "mousedown", zoomSliderContainerMouseDown, false );
      window.addEventListener( "mousemove", zoomSliderMouseMove, false );
      window.addEventListener( "mouseup", zoomSliderMouseUp, false );
    }

    _zoomSliderContainer.addEventListener( "mousedown", zoomSliderContainerMouseDown, false );
    _zoomSliderHandle.addEventListener( "mousedown", zoomSliderHanldeMouseDown, false );

    function updateTrackEventVisual( trackEvent, order ) {
      var trackEventVisual = document.createElement( "div" ),
          style = trackEvent.view.element.style;
      trackEventVisual.classList.add( "butter-super-scrollbar-trackevent" );
      _trackEventVisuals[ trackEvent.id ] = trackEventVisual;
      _visuals.appendChild( trackEventVisual );
      trackEventVisual.style.width = style.width;
      trackEventVisual.style.left = style.left;
      trackEventVisual.style.top = ( trackEventVisual.offsetHeight + TRACK_PADDING ) * order + "px";
    }

    _media.listen( "trackeventremoved", function( e ) {
      var trackEvent = _trackEventVisuals[ e.data.id ];
      if ( trackEvent ) {
        delete _trackEventVisuals[ e.data.id ];
        trackEvent.parentNode.removeChild( trackEvent );
      }
    });

    _media.listen( "trackeventupdated", function( e ) {
      var trackEvent = _trackEventVisuals[ e.data.id ],
          style = e.data.view.element.style;
      if ( trackEvent ) {
        trackEvent.style.width = style.width;
        trackEvent.style.left = style.left;
      }
    });

    _media.listen( "trackorderchanged", function( e ) {
      var data = e.data, i = 0,
          j, jl, trackEvent, track,
          il = data.length;
      for ( ; i < il; i++ ) {
        track = data[ i ];
        for ( j = 0, jl = track.trackEvents.length; j < jl; j++ ) {
          trackEvent = _trackEventVisuals[ track.trackEvents[ j ].id ];
          if ( trackEvent ) {
            trackEvent.style.top = ( trackEvent.offsetHeight + TRACK_PADDING ) * track.order + "px";
          }
        }
      }
    });

    _media.listen( "mediatimeupdate", function( e ) {
      _scrubber.style.left = e.data.currentTime / _duration * 100 + "%";
    });

    _this.initialize = function() {
      var i, j, tl, tel,
          trackEvents,
          order,
          track,
          tracks = _media.tracks;
      for ( i = 0, tl = tracks.length; i < tl; i++ ) {
        track = tracks[ i ];
        trackEvents = track.trackEvents;
        order = track.order;
        for ( j = 0, tel = trackEvents.length; j < tel; j++ ) {
          updateTrackEventVisual( trackEvents[ j ], order );
        }
      }
      _media.listen( "trackeventadded", function( e ) {
        updateTrackEventVisual( e.data, e.target.order );
      });
    };

    _media.listen( "mediaready", function( e ) {
      _duration = e.target.duration;
      updateView();
    });

    _this.resize = function() {
      _this.update();
      _boundsChangedCallback( _viewPort.offsetLeft / _rect.width, _viewPort.offsetWidth / _rect.width );
    };

    Object.defineProperties( this, {
      element: {
        enumerable: true,
        get: function(){
          return _outer;
        }
      }
    });
  };
});

