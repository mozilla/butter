/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

/* Super scrollbar is a scrollbar and a zoom bar in one.
 * It also doubles as a minimap of sorts.
 * Displaying a preview of all the tracks and track events */
define( [ "util/lang", "text!layouts/super-scrollbar.html" ],
  function( LangUtils, SUPER_SCROLLBAR_LAYOUT ) {

  var TRACK_PADDING = 1, // this padding is pixels between track event visuals.
      // this is, in pixels, how close the left and right handles on the viewport can get.
      // TODO: there is a bug I cannot find (yet), to keep this value from working on right handle.
      // right drag solves this with css min-width that is the same as MIN_WIDTH.
      // min-width only seems to work for right, and not left, so left uses MIN_WIDTH.
      // need one fix for both cases.
      MIN_WIDTH = 5;

  return function( outerElement, innerElement, setContainerWidth, media ) {
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
        _position = 0,
        _offset = 0,
        _trackEventVisuals = {};

    var onViewMouseUp, onViewMouseDown, onViewMouseMove,
        onLeftMouseUp, onLeftMouseDown, onLeftMouseMove,
        onRightMouseUp, onRightMouseDown, onRightMouseMove,
        onElementMouseUp, onElementMouseDown, onElementMouseMove,
        updateView;

    this.update = function() {
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

      window.addEventListener( "mouseup", onElementMouseUp, false );
      window.addEventListener( "mousemove", onElementMouseMove, false );
    };

    onViewMouseDown = function( e ) {
      e.preventDefault();
      e.stopPropagation();
      _offset = e.clientX - _rect.left - _viewPort.offsetLeft;
      window.addEventListener( "mouseup", onViewMouseUp, false );
      window.addEventListener( "mousemove", onViewMouseMove, false );
    };

    onLeftMouseDown = function( e ) {
      e.preventDefault();
      e.stopPropagation();
      outerElement.removeEventListener( "scroll", updateView, false );
      window.addEventListener( "mouseup", onLeftMouseUp, false );
      window.addEventListener( "mousemove", onLeftMouseMove, false );
    };

    onRightMouseDown = function( e ) {
      e.preventDefault();
      e.stopPropagation();
      outerElement.removeEventListener( "scroll", updateView, false );
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
      outerElement.scrollLeft = ( e.clientX - _rect.left - _offset ) / _rect.width * innerElement.scrollWidth;
    };

    onLeftMouseMove = function( e ) {

      e.preventDefault();
      e.stopPropagation();

      // position is from the left of the container, to the left of the viewport.
      _position = e.clientX - _rect.left;

      // make sure we never go out of bounds.
      if ( _position < 0 ) {
        _position = 0;
      }

      // make sure left never goes over right.
      if ( _position + MIN_WIDTH > _viewPort.offsetLeft + _viewPort.clientWidth ) {
        _position = _viewPort.offsetLeft + _viewPort.clientWidth - MIN_WIDTH;
      }

      _viewPort.style.left = _position / _rect.width * 100 + "%";
      setContainerWidth( _viewPort.clientWidth / _rect.width * 100 );
      outerElement.scrollLeft = _viewPort.offsetLeft / _rect.width * innerElement.scrollWidth;
    };

    onRightMouseMove = function( e ) {

      e.preventDefault();
      e.stopPropagation();

      // position is from the right of the container, to the right of the viewport.
      _position = _rect.width - ( e.clientX - _rect.left );

      // make sure we never go out of bounds.
      if ( _position < 0 ) {
        _position = 0;
      }

      _viewPort.style.right = _position / _rect.width * 100 + "%";
      setContainerWidth( _viewPort.offsetWidth / _rect.width * 100 );
      outerElement.scrollLeft = _viewPort.offsetLeft / _rect.width * innerElement.scrollWidth;
    };

    updateView = function() {
      _viewPort.style.left = outerElement.scrollLeft / innerElement.offsetWidth * 100 + "%";
      _viewPort.style.right = ( 1 - ( outerElement.scrollLeft + _element.offsetWidth ) / innerElement.offsetWidth ) * 100 + "%";
    };

    _element.addEventListener( "mousedown", onElementMouseDown, false );
    outerElement.addEventListener( "scroll", updateView, false );
    _viewPort.addEventListener( "mousedown", onViewMouseDown, false );
    _leftHandle.addEventListener( "mousedown", onLeftMouseDown, false );
    _rightHandle.addEventListener( "mousedown", onRightMouseDown, false );

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

