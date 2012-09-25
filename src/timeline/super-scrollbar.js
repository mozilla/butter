/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

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
      ZOOM_EXPAND_AMOUNT = 1.05,  // Fraction representing the amount of zoom to use when zoom-in/out
                                  // buttons are clicked. Keeping this value near 1 is a good idea since
                                  // width = width * ZOOM_EXPAND_AMOUNT.

      TRANSITION_TIMEOUT = 100,   // Length of timeout for viewport-transition to stay alive.
      ZOOM_PULSE_DURATION = 250;  // Length of time between zoom pulses.

  return function( outerElement, innerElement, boundsChangedCallback, media ) {
    var _element = LangUtils.domFragment( SUPER_SCROLLBAR_LAYOUT ).querySelector( "#butter-super-scrollbar-container" ),
        _rect, _duration,
        _media = media,
        // viewport is the draggable, resizable, representation of the viewable track container.
        _viewPort = _element.querySelector( "#butter-super-scrollbar-viewport" ),
        _leftHandle = _viewPort.querySelector( "#butter-super-scrollbar-handle-left" ),
        _rightHandle = _viewPort.querySelector( "#butter-super-scrollbar-handle-right" ),
        // visuals is the container for the visual representations for track events.
        _visuals = _element.querySelector( "#butter-super-scrollbar-visuals" ),
        _scrubber = _element.querySelector( "#buter-super-scrollbar-scrubber" ),
        _zoomInButton = _element.querySelector( ".butter-super-scrollbar-zoom-in" ),
        _zoomOutButton = _element.querySelector( ".butter-super-scrollbar-zoom-out" ),
        _offset = 0,
        _trackEventVisuals = {},
        _boundsChangedCallback = boundsChangedCallback,
        _transitionLock,
        _zoomInterval,
        _this = this;

    /**
     * isScrubberInViewport
     *
     * Based on values in bounding box (Rect) objects, this function will report whether or
     * not the scrubber lies within the viewport.
     *
     * @param {Rect} viewportRect: Rect object representing bounding box of viewport
     * @param {Rect} scrubberRect: Rect object representing bounding box of scrubber
     */
    function isScrubberInViewport( viewportRect, scrubberRect ) {
      return scrubberRect.left > viewportRect.left && scrubberRect.right < viewportRect.right;
    }

    var onViewMouseUp, onViewMouseDown, onViewMouseMove,
        onLeftMouseUp, onLeftMouseDown, onLeftMouseMove,
        onRightMouseUp, onRightMouseDown, onRightMouseMove,
        onElementMouseUp, onElementMouseDown, onElementMouseMove,
        updateView;

    _this.update = function() {
      _rect = _element.getBoundingClientRect();
    };

    onElementMouseUp = function( e ) {
      e.preventDefault();
      e.stopPropagation();
      window.removeEventListener( "mouseup", onElementMouseUp, false );
      window.removeEventListener( "mousemove", onElementMouseMove, false );
    };

    onViewMouseUp = function( e ) {
      e.preventDefault();
      e.stopPropagation();
      window.removeEventListener( "mouseup", onViewMouseUp, false );
      window.removeEventListener( "mousemove", onViewMouseMove, false );
    };

    onLeftMouseUp = function( e ) {
      e.preventDefault();
      e.stopPropagation();
      outerElement.addEventListener( "scroll", updateView, false );
      window.removeEventListener( "mouseup", onLeftMouseUp, false );
      window.removeEventListener( "mousemove", onLeftMouseMove, false );
    };

    onRightMouseUp = function( e ) {
      e.preventDefault();
      e.stopPropagation();
      outerElement.addEventListener( "scroll", updateView, false );
      window.removeEventListener( "mouseup", onRightMouseUp, false );
      window.removeEventListener( "mousemove", onRightMouseMove, false );
    };

    onElementMouseDown = function( e ) {
      e.preventDefault();
      e.stopPropagation();
      media.currentTime = ( e.clientX - _rect.left ) / _rect.width * _duration;
      _viewPort.classList.remove( "viewport-transition" );
      window.addEventListener( "mouseup", onElementMouseUp, false );
      window.addEventListener( "mousemove", onElementMouseMove, false );
    };

    onViewMouseDown = function( e ) {
      e.preventDefault();
      e.stopPropagation();
      _viewPort.classList.remove( "viewport-transition" );
      _offset = e.clientX - _rect.left - _viewPort.offsetLeft;
      _media.pause();  // pause the media here to diffuse confusion with scrolling & playing
      window.addEventListener( "mouseup", onViewMouseUp, false );
      window.addEventListener( "mousemove", onViewMouseMove, false );
    };

    onLeftMouseDown = function( e ) {
      e.preventDefault();
      e.stopPropagation();
      _media.pause();  // pause the media here to diffuse confusion with scrolling & playing
      _viewPort.classList.remove( "viewport-transition" );
      outerElement.removeEventListener( "scroll", updateView, false );
      window.addEventListener( "mouseup", onLeftMouseUp, false );
      window.addEventListener( "mousemove", onLeftMouseMove, false );
    };

    onRightMouseDown = function( e ) {
      e.preventDefault();
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
      _boundsChangedCallback( -1, _viewPort.offsetWidth / _rect.width );
    };

    updateView = function() {
      _viewPort.style.left = outerElement.scrollLeft / innerElement.offsetWidth * 100 + "%";
      _viewPort.style.right = ( 1 - ( outerElement.scrollLeft + outerElement.offsetWidth ) / innerElement.offsetWidth ) * 100 + "%";
    };

    _element.addEventListener( "mousedown", onElementMouseDown, false );
    outerElement.addEventListener( "scroll", updateView, false );
    _viewPort.addEventListener( "mousedown", onViewMouseDown, false );
    _leftHandle.addEventListener( "mousedown", onLeftMouseDown, false );
    _rightHandle.addEventListener( "mousedown", onRightMouseDown, false );

    // Prevent _element from receiving mousedown events, since _zoomInButton and
    // _zoomOutButton are contained by _element.
    _zoomInButton.addEventListener( "mousedown", function( e ) {
      e.preventDefault();
      e.stopPropagation();
    }, false );
    _zoomOutButton.addEventListener( "mousedown", function( e ) {
      e.preventDefault();
      e.stopPropagation();
    }, false );

    /**
     * refreshTransitionLock
     *
     * Ensures that only the most recent addition of the viewport-transition is removed
     * after TRANSITION_TIMEOUT milliseconds. If _transitionLock is not null, the old object
     * is "destroyed" and replaced with a new one. If the object persists for the lifetime
     * the setTimeout (i.e. TRANSITION_TIMEOUT milliseconds), it will remove the
     * viewport-transition class and delete itself.
     */
    function refreshTransitionLock() {
      if ( _transitionLock ) {
        _transitionLock.destroy();
      }

      _transitionLock = (function(){
        var active = true;

        _viewPort.classList.add( "viewport-transition" );

        setTimeout( function() {
          if ( active ) {
            _viewPort.classList.remove( "viewport-transition" );
            _transitionLock = null;
          }
        }, TRANSITION_TIMEOUT );

        return {
          destroy: function() {
            active = false;
          }
        };
      }());
    }

    /**
     * zoomOut
     *
     * Expands the viewport by a maximum of ZOOM_EXPAND_AMOUNT. The viewport is expanded
     * to cover more area, and calls _boundsChangedCallback with the new (left, width) combination
     * as percentage values (0 - 1). This action has the consequence of zooming out the
     * track container viewport, since more viewable area is desired.
     *
     * A left and right position are calculated by moving them a set amount from their current
     * positions away from the mid-point of the viewport. A new width value is also calculated
     * to provide _boundsChangedCallback with the necessary values: left & width.
     *
     * The distance the left and right bounds of the viewport move is a weighted value dictated
     * by the ratio of the scrubber's distance across the viewport with respect to the viewport's
     * width.
     */
    function zoomOut() {
      var viewportRect = _viewPort.getBoundingClientRect(),
          scrubberRect = _scrubber.getBoundingClientRect(),
          widthGrowth = ( _viewPort.clientWidth * ZOOM_EXPAND_AMOUNT - _viewPort.clientWidth ),
          leftGrowth,
          rightGrowth,
          leftPosition,
          rightPosition,
          newWidth,
          p;

      if ( !isScrubberInViewport( viewportRect, scrubberRect ) ) {
        // If the scrubber does not lie within the viewport, just assign half the total width growth
        // for left and right growth variables respectively.
        leftGrowth = rightGrowth = widthGrowth / 2;
      }
      else {
        // Otherwise, derive a ratio representing the distance from the viewport's left side to the
        // scrubber's position with respect to the width of the viewport.
        p = ( scrubberRect.left - viewportRect.left ) / viewportRect.width;

        // Assign oppositely-weighted values to left and right growth variables.
        leftGrowth = widthGrowth * p;
        rightGrowth = widthGrowth * ( 1 - p );
      }

      // Come up with new pixel values for left, right and width of viewport.
      leftPosition = _viewPort.offsetLeft - leftGrowth;
      rightPosition = _rect.right - viewportRect.right - rightGrowth;
      newWidth = viewportRect.width + widthGrowth;

      // Find the ratio of left and right position width respect to the super-scrollbar's width.
      leftPosition = ( leftPosition < 0 ? 0 : leftPosition ) / _element.clientWidth;
      rightPosition = ( rightPosition < 0 ? 0 : rightPosition ) / _element.clientWidth;

      // Proxy for applying viewport-transition so it happens safely and gets removed properly.
      refreshTransitionLock();

      // Assign percentage values to viewport style (for most accuracy).
      _viewPort.style.right = rightPosition * 100 + "%";
      _viewPort.style.left = leftPosition * 100 + "%";

      // newWidth is used here because the transition will tween the real width value,
      // causing _boundsChangedCallback to receive an incorrect width ratio.
      _boundsChangedCallback( leftPosition, newWidth / _rect.width );
    }

    /**
     * zoomIn
     *
     * Shrinks the viewport by a maximum of ZOOM_EXPAND_AMOUNT. The viewport is diminished
     * to cover less area, and calls _boundsChangedCallback with the new (left, width) combination
     * as percentage values (0 - 1). This action has the consequence of zooming in the
     * track container viewport, since less viewable area is desired.
     *
     * A left and right position are calculated by moving them a set amount from their current
     * positions toward the mid-point of the viewport. A new width value is also calculated
     * to provide _boundsChangedCallback with the necessary values: left & width.
     *
     * The distance the left and right bounds of the viewport move is a weighted value dictated
     * by the ratio of the scrubber's distance across the viewport with respect to the viewport's
     * width.
     */
    function zoomIn() {
      var viewportRect = _viewPort.getBoundingClientRect(),
          scrubberRect = _scrubber.getBoundingClientRect(),
          widthGrowth = ( _viewPort.clientWidth * ZOOM_EXPAND_AMOUNT - _viewPort.clientWidth ),
          leftGrowth,
          rightGrowth,
          leftPosition,
          rightPosition,
          newWidth,
          p;

      if ( !isScrubberInViewport( viewportRect, scrubberRect ) ) {
        // If the scrubber does not lie within the viewport, just assign half the total width growth
        // for left and right growth variables respectively.
        leftGrowth = rightGrowth = widthGrowth / 2;
      }
      else {
        // Otherwise, derive a ratio representing the distance from the viewport's left side to the
        // scrubber's position with respect to the width of the viewport.
        p = ( scrubberRect.left - viewportRect.left ) / viewportRect.width;

        // Assign oppositely-weighted values to left and right growth variables.
        leftGrowth = widthGrowth * p;
        rightGrowth = widthGrowth * ( 1 - p );
      }

      leftPosition = _viewPort.offsetLeft + leftGrowth;
      rightPosition = _rect.right - viewportRect.right + rightGrowth;
      newWidth = viewportRect.width - widthGrowth;

      leftPosition = ( leftPosition < 0 ? 0 : leftPosition ) / _element.clientWidth;
      rightPosition = ( rightPosition < 0 ? 0 : rightPosition) / _element.clientWidth;

      // Proxy for applying viewport-transition so it happens safely and gets removed properly.
      refreshTransitionLock();

      _viewPort.style.right = rightPosition * 100 + "%";
      _viewPort.style.left = leftPosition * 100 + "%";

      // newWidth is used here because the transition will tween the real width value,
      // causing _boundsChangedCallback to receive an incorrect width ratio.
      _boundsChangedCallback( leftPosition, newWidth / _rect.width );
    }

    _zoomOutButton.addEventListener( "mousedown", function( e ) {
      zoomOut();
      _zoomInterval = setInterval( zoomOut, ZOOM_PULSE_DURATION );
      window.addEventListener( "mouseup", function( e ) {
        clearInterval( _zoomInterval );
      }, false );
    }, false );

    _zoomInButton.addEventListener( "mousedown", function( e ) {
      zoomIn();
      _zoomInterval = setInterval( zoomIn, ZOOM_PULSE_DURATION );
      window.addEventListener( "mouseup", function( e ) {
        clearInterval( _zoomInterval );
      }, false );
    }, false );

    _media.listen( "trackeventadded", function( e ) {
      var trackEvent = document.createElement( "div" ),
          style = e.data.view.element.style;
      trackEvent.classList.add( "butter-super-scrollbar-trackevent" );
      _trackEventVisuals[ e.data.id ] = trackEvent;
      _visuals.appendChild( trackEvent );
      trackEvent.style.width = style.width;
      trackEvent.style.left = style.left;
      trackEvent.style.top = ( trackEvent.offsetHeight + TRACK_PADDING ) * e.target.order + "px";
    });

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

    _media.listen( "mediaready", function( e ) {
      _duration = e.target.duration;
      updateView();
    });

    window.addEventListener( "resize", function() {
      _this.update();
      _boundsChangedCallback( -1, _viewPort.offsetWidth / _rect.width );
    });

    Object.defineProperties( this, {
      element: {
        enumerable: true,
        get: function(){
          return _element;
        }
      }
    });
  };
});

