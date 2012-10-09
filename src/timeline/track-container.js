/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/logger", "util/dragndrop", "./ghost-manager" ],
  function( Logger, DragNDrop, GhostManager ) {

  var TWEEN_PERCENTAGE = 0.35,    // diminishing factor for tweening (see followCurrentTime)
      TWEEN_THRESHOLD = 10;       // threshold beyond which tweening occurs (see followCurrentTime)

  return function( butter, media, mediaInstanceRootElement ) {

    var _media = media,
        _this = this;

    var _element = mediaInstanceRootElement.querySelector( ".tracks-container-wrapper" ),
        _container = mediaInstanceRootElement.querySelector( ".tracks-container" );

    var _vScrollbar;

    var _droppable;

    var _leftViewportBoundary = 0,
        _viewportWidthRatio = 0.1;

    var _newTrackForDroppables;

    _this.ghostManager = new GhostManager( media, _container );

    butter.listen( "trackorderchanged", function( e ) {
      var orderedTracks = e.data;
      for ( var i = 0, l = orderedTracks.length; i < l; ++i ) {
        var trackElement = orderedTracks[ i ].view.element;
        if ( trackElement !== _container.childNodes[ i ] ) {
          _container.insertBefore( trackElement, _container.childNodes[ i ] );
        }
      }
    });

    DragNDrop.listen( "dropfinished", function() {
      _media.cleanUpEmptyTracks();
      _vScrollbar.update();
    });

    _container.addEventListener( "mousedown", function( e ) {
      butter.deselectAllTrackEvents();
    }, false );

    _droppable = DragNDrop.droppable( _element, {
      startDrop: function() {
        _newTrackForDroppables = null;
      },
      drop: function( dropped, mousePosition ) {
        // Used if drop spawns a new track
        var newTrack, draggableType,
            trackEvent, trackEventRect,
            droppedLeftValue, duration,
            start, end,
            containerRect = _container.getBoundingClientRect();

        // XXX secretrobotron: I chopped out an if statement from this section
        // which attempted to check whether or not trackevents were being dropped
        // below the last track on the timeline. It was interfering with dropping multiple
        // items, and we seem to have shaved off the space between tracks that was
        // causing the need for this check to begin with. Here's the commit which spawned
        // the check: https://github.com/mozilla/butter/commit/3952c02da32092433fb884cead0ba4e7e18ff988

        // Ensure its a plugin and that only the area under the last track is droppable
        draggableType = ( dropped.element || dropped ).getAttribute( "data-butter-draggable-type" );

        if ( draggableType === "plugin" ) {
          newTrack = butter.currentMedia.addTrack();
          newTrack.view.dispatch( "plugindropped", {
            start: ( mousePosition[ 0 ] - containerRect.left ) / _container.clientWidth * newTrack.view.duration,
            track: newTrack,
            type: dropped.getAttribute( "data-popcorn-plugin-type" )
          });
        }
        else if ( draggableType === "trackevent" ) {
          trackEvent = dropped.data.trackEvent;
          trackEventRect = dropped.getLastRect();
          droppedLeftValue = trackEventRect.left - containerRect.left;

          if ( !_newTrackForDroppables ) {
            _newTrackForDroppables = butter.currentMedia.addTrack();
          }

          // Avoid using trackevent view width values here to circumvent padding/border
          duration = trackEvent.popcornOptions.end - trackEvent.popcornOptions.start;
          start = droppedLeftValue / _container.clientWidth * _media.duration;
          end = start + duration;

          createTrackEventFromDrop( trackEvent, {
            start: start,
            end: end
          }, trackEvent.track, _newTrackForDroppables );
        }
      }
    });

    this.setVerticalScrollbar = function( vertical ) {
      _vScrollbar = vertical;
      _vScrollbar.update();
    };

    function resetContainer() {
      _element.scrollLeft = _container.scrollWidth * _leftViewportBoundary;
      _container.style.width = _element.clientWidth / _viewportWidthRatio + "px";
      _vScrollbar.update();
    }

    _media.listen( "mediaready", function(){
      resetContainer();
      var tracks = _media.tracks;
      for ( var i = 0, il = tracks.length; i < il; ++i ) {
        var trackView = tracks[ i ].view;
        _container.appendChild( trackView.element );
        trackView.duration = _media.duration;
        trackView.parent = _this;
      }
    });

    butter.listen( "mediaremoved", function ( e ) {
      if ( e.data === _media && _droppable ){
        _droppable.destroy();
      }
    });

    function onTrackAdded( e ) {
      var trackView = e.data.view;

      trackView.listen( "trackeventdropped", onTrackEventDropped );

      _container.appendChild( trackView.element );
      trackView.duration = _media.duration;
      trackView.parent = _this;
      if ( _vScrollbar ) {
        _vScrollbar.update();
      }
    }

    function onTrackEventResized( trackEvent, x, w, resizeEvent, direction ) {
      var trackView = trackEvent.track.view,
          overlappingTrackEvent,
          leftOffset = _container.getBoundingClientRect().left,
          trackEventView = trackEvent.view;

      overlappingTrackEvent = trackView.findOverlappingTrackEvent( trackEventView, x + leftOffset, w );

      if ( overlappingTrackEvent ) {
        if ( direction === 'right' ) {
          // Use clientLeft to compensate for border (https://developer.mozilla.org/en-US/docs/DOM/element.clientLeft)
          resizeEvent.blockIteration( overlappingTrackEvent.view.element.offsetLeft - overlappingTrackEvent.view.element.clientLeft * 2 );
        }
        else {
          resizeEvent.blockIteration( overlappingTrackEvent.view.element.offsetLeft + overlappingTrackEvent.view.element.offsetWidth );
        }
      }
    }

    function onTrackEventDragStarted( e ) {
      var trackEventView = e.target,
          element = trackEventView.element,
          trackView = trackEventView.trackEvent.track.view;

      trackView.element.removeChild( element );
      _container.appendChild( element );
      _vScrollbar.update();
    }

    function onTrackEventDragged( draggable, droppable ) {
      _this.ghostManager.trackEventDragged( draggable.data, droppable.data );
      _vScrollbar.update();
    }

    var existingTracks = _media.tracks;
    for ( var i = 0; i < existingTracks.length; ++i ) {
      onTrackAdded({
        data: existingTracks[ i ]
      });
    }

    function createTrackEventFromDrop( trackEvent, popcornOptions, oldTrack, desiredTrack ) {
      var newTrack = _media.forceEmptyTrackSpaceAtTime( desiredTrack, popcornOptions.start, popcornOptions.end, trackEvent );

      if ( oldTrack !== newTrack ) {
        if ( oldTrack ) {
          oldTrack.removeTrackEvent( trackEvent );
        }
        trackEvent.update( popcornOptions );
        newTrack.addTrackEvent( trackEvent );
        _this.ghostManager.removeGhostsAfterDrop( trackEvent, oldTrack );
      }
      else {
        trackEvent.update( popcornOptions );
        _this.ghostManager.removeGhostsAfterDrop( trackEvent, oldTrack );
      }
    }

    function onTrackEventDropped( e ) {
      var trackEvent = e.data.trackEvent,
          popcornOptions = e.data,
          desiredTrack = e.data.track,
          oldTrack = trackEvent.track;

      createTrackEventFromDrop( trackEvent, popcornOptions, oldTrack, desiredTrack );
    }

    function onTrackEventResizeStopped( e ) {
      var trackEventView = e.target,
          trackEvent = trackEventView.trackEvent,
          direction = e.data.direction,
          popcornOptions = {};

      if ( direction === "right" ) {
        popcornOptions.end = trackEvent.popcornOptions.start + trackEventView.element.clientWidth / _container.clientWidth * _media.duration;
      }
      else {
        popcornOptions.start = trackEventView.element.offsetLeft / _container.clientWidth * _media.duration;
      }

      trackEvent.update( popcornOptions );
    }

    _media.listen( "trackeventadded", function( e ) {
      var trackEventView = e.data.view;
      trackEventView.setDragHandler( onTrackEventDragged );
      trackEventView.setResizeHandler( onTrackEventResized );
      trackEventView.listen( "trackeventdragstarted", onTrackEventDragStarted );
      trackEventView.listen( "trackeventresizestopped", onTrackEventResizeStopped );
      _vScrollbar.update();
    });

    _media.listen( "trackeventremoved", function( e ) {
      var trackEventView = e.data.view;
      trackEventView.setDragHandler( null );
      trackEventView.setResizeHandler( null );
      trackEventView.unlisten( "trackeventdragstarted", onTrackEventDragStarted );
      trackEventView.unlisten( "trackeventresizestopped", onTrackEventResizeStopped );
      _vScrollbar.update();
    });

    _media.listen( "trackadded", onTrackAdded );

    _media.listen( "trackremoved", function( e ) {
      var trackView = e.data.view;

      trackView.listen( "trackeventdropped", onTrackEventDropped );

      _container.removeChild( trackView.element );
      if ( _vScrollbar ) {
        _vScrollbar.update();
      }
    });

    /**
     * Member: followCurrentTime
     *
     * Attempts to position the viewport around the media's currentTime (the scrubber)
     * such that the currentTime is centered in the viewport. If currentTime is situated
     * to the right of the mid-point of the track container, this code begins to affect
     * the scrollLeft property of _element by either setting the value to the mid-point
     * immediately (if currentTime is not beyond TWEEN_THRESHOLD from the mid-point), or
     * by incrementally stepping toward the mid-point by tweening to provide some
     * softening for proper user feedback.
     *
     * Note that the values assigned to scrollLeft are rounded to prevent jitter.
     */
    _this.followCurrentTime = function() {
      var p = _media.currentTime / _media.duration,
          currentTimePixel = p * _container.clientWidth,
          halfWidth = _element.clientWidth / 2,
          xOffset = currentTimePixel - _element.scrollLeft,
          target = p * _container.scrollWidth - halfWidth;

      // If the currentTime surpasses half of the width of the track container...
      if ( xOffset >= halfWidth ) {
        // ... by more than TWEEN_THRESHOLD...
        if ( xOffset - halfWidth > TWEEN_THRESHOLD ) {
          // then perform a simple tween on scrollLeft to slide the scrubber back into the middle.
          _element.scrollLeft = Math.round( _element.scrollLeft - ( _element.scrollLeft - target ) * TWEEN_PERCENTAGE );
        }
        else {
          // Otherwise, just nail scrollLeft at the center point.
          _element.scrollLeft = Math.round( target );
        }
      }
    };

    _this.update = function() {
      resetContainer();
    };

    /**
     * Member: setContainerBounds
     *
     * Adjusts the viewport boundaries. A left and width value can be specified
     * representing the left and width percentage of the viewport with respect to its
     * container. If either is -1, it is ignored, and the old value is preserved.
     *
     * @param {Number} left: Left side of the viewport as percent from 0 - 1
     * @param {Number} width: Ratio of viewport to tracks (0 - 1)
     */
    _this.setViewportBounds = function( left, width ) {
      _leftViewportBoundary = left >= 0 ? ( left > 1 ? 1 : left ) : _leftViewportBoundary;
      _viewportWidthRatio = width >= 0 ? ( width > 1 ? 1 : width ) : _viewportWidthRatio;
      resetContainer();
    };

    _this.snapTo = function( time ) {
      var p = time / _media.duration,
          newScroll = _container.clientWidth * p,
          maxLeft = _container.clientWidth - _element.clientWidth;
      if ( newScroll < _element.scrollLeft || newScroll > _element.scrollLeft + _element.clientWidth ) {
        if ( newScroll > maxLeft ) {
          _element.scrollLeft = maxLeft;
          return;
        }
        _element.scrollLeft = newScroll;
      }
    };

    Object.defineProperties( this, {
      element: {
        enumerable: true,
        get: function(){
          return _element;
        }
      },
      container: {
        enumerable: true,
        get: function(){
          return _container;
        }
      }
    });

  };

});

