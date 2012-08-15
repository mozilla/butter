/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/logger", "util/dragndrop", "./trackevent-drag-manager" ],
  function( Logger, DragNDrop, TrackEventDragManager ) {

  return function( butter, media, mediaInstanceRootElement ) {

    var _media = media,
        _zoom = 1,
        _this = this;

    var _element = mediaInstanceRootElement.querySelector( ".tracks-container-wrapper" ),
        _container = mediaInstanceRootElement.querySelector( ".tracks-container" );

    var _vScrollbar;

    var _droppable;

    var _justDropped = [];

    _this.trackEventDragManager = new TrackEventDragManager( media, _container );

    butter.listen( "trackorderchanged", function( e ) {
      var orderedTracks = e.data;
      for ( var i = 0, l = orderedTracks.length; i < l; ++i ) {
        var trackElement = orderedTracks[ i ].view.element;
        if ( trackElement !== _container.childNodes[ i ] ) {
          _container.insertBefore( trackElement, _container.childNodes[ i + 1 ] );
        }
      }
    });

    _container.addEventListener( "mousedown", function( e ) {
      butter.deselectAllTrackEvents();
    }, false );

    _droppable = DragNDrop.droppable( _element, {
      drop: function( dropped, mousePosition ) {
        var tracks = butter.currentMedia.orderedTracks,
            lastTrackBottom = tracks[ tracks.length - 1 ].view.element.getBoundingClientRect().bottom;

        dropped = dropped.data ? dropped.data.element : dropped;
        // ensure its a plugin and that only the area under the last track is droppable
        if ( dropped.getAttribute( "data-butter-draggable-type" ) === "plugin" && mousePosition[ 1 ] > lastTrackBottom ) {
          var newTrack = butter.currentMedia.addTrack(),
              trackRect = newTrack.view.element.getBoundingClientRect(),
              left = mousePosition[ 0 ] - trackRect.left,
              start = left / trackRect.width * newTrack.view.duration;

          newTrack.view.dispatch( "plugindropped", {
            start: start,
            track: newTrack,
            type: dropped.getAttribute( "data-popcorn-plugin-type" )
          });
        }
      }
    });

    this.setScrollbars = function( hScrollbar, vScrollbar ) {
      _vScrollbar = vScrollbar;
      _vScrollbar.update();
    };

    function resetContainer() {
      _container.style.width = _element.clientWidth / _zoom + "px";
      _vScrollbar.update();
    }

    _media.listen( "mediaready", function(){
      resetContainer();
      var tracks = _media.tracks;
      for ( var i = 0, il = tracks.length; i < il; ++i ) {
        var trackView = tracks[ i ].view;
        _container.appendChild( trackView.element );
        trackView.duration = _media.duration;
        trackView.zoom = _zoom;
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
      trackView.zoom = _zoom;
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

    _this.update = function() {
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
      zoom: {
        enumerable: true,
        get: function() {
          return _zoom;
        },
        set: function( val ) {
          _zoom = val;
          resetContainer();
          var tracks = _media.tracks;
          for ( var i = 0, il = tracks.length; i < il; ++i ) {
            tracks[ i ].view.zoom = _zoom;
          }
        }
      },
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

