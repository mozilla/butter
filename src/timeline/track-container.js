/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/logger", "util/dragndrop", "./trackevent-drag-manager" ],
  function( Logger, DragNDrop, TrackEventDragManager ) {

  var TWEEN_PERCENTAGE = 0.35,    // diminishing factor for tweening (see followCurrentTime)
      TWEEN_THRESHOLD = 10;       // threshold beyond which tweening occurs (see followCurrentTime)

  return function( butter, media, mediaInstanceRootElement ) {

    var _media = media,
        _this = this;

    var _element = mediaInstanceRootElement.querySelector( ".tracks-container-wrapper" ),
        _container = mediaInstanceRootElement.querySelector( ".tracks-container" );

    var _vScrollbar;

    var _droppable,
        _justDropped = [];

    var _leftViewportBoundary = 0,
        _viewportWidthRatio = 0.1;

    _this.trackEventDragManager = new TrackEventDragManager( media, _container );

    butter.listen( "trackorderchanged", function( e ) {
      var orderedTracks = e.data;
      for ( var i = 0, l = orderedTracks.length; i < l; ++i ) {
        var trackElement = orderedTracks[ i ].view.element;
        if ( trackElement !== _container.childNodes[ i ] ) {
          _container.insertBefore( trackElement, _container.childNodes[ i ] );
        }
      }
    });

    _container.addEventListener( "mousedown", function( e ) {
      butter.deselectAllTrackEvents();
    }, false );

    _droppable = DragNDrop.droppable( _element, {
      drop: function( dropped, mousePosition ) {
        var tracks = butter.currentMedia.orderedTracks,
            lastTrack = tracks[ tracks.length - 1 ],
            // Set lastTrackBottom to 0 initially so that if there are no tracks, we can still add a TrackEvent to the track-container.
            lastTrackBottom = 0;

        // Otherwise, lastTrackBottom will be set to the bottom value of the rectangle of the bottom-most track.
        if ( lastTrack ) {
          lastTrackBottom = lastTrack.view.element.getBoundingClientRect().bottom;
        }

        // ensure its a plugin and that only the area under the last track is droppable
        if ( mousePosition[ 1 ] > lastTrackBottom ) {
          var newTrack = butter.currentMedia.addTrack(),
              trackRect = newTrack.view.element.getBoundingClientRect(),
              left = mousePosition[ 0 ] - trackRect.left,
              start = left / trackRect.width * newTrack.view.duration,
              draggableType = ( dropped.element ? dropped.element : dropped ).getAttribute( "data-butter-draggable-type" );

          if ( draggableType === "plugin" ) {
            newTrack.view.dispatch( "plugindropped", {
              start: start,
              track: newTrack,
              type: dropped.getAttribute( "data-popcorn-plugin-type" )
            });
          } else if ( draggableType === "trackevent" ) {
            newTrack.view.dispatch( "trackeventdropped", {
              start: dropped.data.start,
              track: newTrack,
              trackEvent: dropped.data.trackEvent
            });
          }
        }
      }
    });

    this.setScrollbars = function( hScrollbar, vScrollbar ) {
      _vScrollbar = vScrollbar;
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
      _container.appendChild( trackView.element );
      trackView.duration = _media.duration;
      trackView.parent = _this;
      if ( _vScrollbar ) {
        _vScrollbar.update();
      }
    }

    function onTrackEventDragged( draggable, droppable ) {
      _this.trackEventDragManager.trackEventDragged( draggable.data, droppable.data );
      _vScrollbar.update();
    }

    function onTrackEventDragStarted( e ) {
      var trackEventView = e.target,
          element = trackEventView.element,
          trackView = trackEventView.trackEvent.track.view;

      trackView.element.removeChild( element );
      _container.appendChild( element );
      _vScrollbar.update();
    }

    function onTrackEventDragStopped( e ) {
      var trackEventView = e.target,
          element = trackEventView.element,
          trackView = trackEventView.trackEvent.track.view;
      _container.removeChild( element );
      trackView.element.appendChild( element );
      _vScrollbar.update();
      _justDropped.push( trackEventView.trackEvent );
    }

    var existingTracks = _media.tracks;
    for ( var i = 0; i < existingTracks.length; ++i ) {
      onTrackAdded({
        data: existingTracks[ i ]
      });
    }

    _media.listen( "trackeventupdated", function( e ) {
      var trackEvent = e.target,
          idx = _justDropped.indexOf( trackEvent );

      // Make sure not every trackevent update comes through here. Only care about
      // the ones that were just dragging.
      if ( idx > -1 ) {
        _justDropped.splice( idx, 1 );
        var newEventOccurred = _this.trackEventDragManager.trackEventUpdated( trackEvent );

        // If a new event was created through updating, the old one should be forgotten about, and more updates
        // for it should not occur.
        if ( newEventOccurred ) {
          e.stopPropagation();
        }

        _vScrollbar.update();
      }
    });

    _media.listen( "trackeventadded", function( e ) {
      var trackEventView = e.data.view;
      trackEventView.setDragHandler( onTrackEventDragged );
      trackEventView.listen( "trackeventdragstarted", onTrackEventDragStarted );
      trackEventView.listen( "trackeventdragstopped", onTrackEventDragStopped );
      _vScrollbar.update();
    });

    _media.listen( "trackeventremoved", function( e ) {
      var trackEventView = e.data.view;
      trackEventView.setDragHandler( null );
      trackEventView.unlisten( "trackeventdragstarted", onTrackEventDragStarted );
      trackEventView.unlisten( "trackeventdragstopped", onTrackEventDragStopped );
      _vScrollbar.update();
    });

    _media.listen( "trackadded", onTrackAdded );

    _media.listen( "trackremoved", function( e ) {
      var trackView = e.data.view;
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

