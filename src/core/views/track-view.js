/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/logger", "core/eventmanager", "util/dragndrop" ],
  function( Logger, EventManagerWrapper, DragNDrop ) {

  return function( track ) {

    var _track = track,
        _this = this,
        _trackEvents = [],
        _trackEventElements = [],
        _element = document.createElement( "div" ),
        _duration = 1,
        _ghost,
        _isGhost = false,
        _parent,
        _droppable,
        _zoom = 1;

    EventManagerWrapper( _this );

    _element.className = "butter-track";

    function setupDroppable(){
      _droppable = DragNDrop.droppable( _element, {
        hoverClass: "draggable-hover",
        drop: function( dropped, mousePosition ) {

          var draggableType = dropped.getAttribute( "data-butter-draggable-type" );

          var start,
              left,
              trackRect = _element.getBoundingClientRect();

          if( draggableType === "plugin" ){
            left = mousePosition[ 0 ] - trackRect.left;
            start = left / trackRect.width * _duration;
            _this.dispatch( "plugindropped", {
              start: start,
              track: _track,
              type: dropped.getAttribute( "data-popcorn-plugin-type" )
            });
          }
          else if( draggableType === "trackevent" ) {
            if( dropped.parentNode !== _element ){
              left = dropped.offsetLeft;
              start = left / trackRect.width * _duration;
              _this.dispatch( "trackeventdropped", {
                start: start,
                track: _track,
                trackEvent: dropped.getAttribute( "data-butter-trackevent-id" )
              });
            }
          } //if
        }
      });
    }

    function resetContainer(){
      _element.style.width = ( _duration * _zoom ) + "px";
    } //resetContainer

    /**
     * Member: createGhost
     *
     * Creates a new track that is only being used to house a ghost event
     * Used to notify the user when a new track will be created to house a ghosted trackevent
     */
    this.createGhost = function( media ) {
      if ( media ) {
        _ghost = media.addTrack();
        _ghost.isGhost = true;
        return _ghost;
      }
    };

    /*
     * Member: cleanupGhost
     *
     * Removes this tracks ghost and makes sure isGhost is set to false
     */
    this.cleanupGhost = function() {
      var track;

      _ghost.isGhost = false;
      _ghost._media.removeTrack( _ghost );
      _ghost = null;
      return track;
    };

    Object.defineProperties( this, {
      element: {
        enumerable: true,
        configurable: false,
        get: function(){
          return _element;
        }
      },
      zoom: {
        enumerable: true,
        get: function(){
          return _zoom;
        },
        set: function( val ){
          _zoom = val;
          resetContainer();
          for( var i=0, l=_trackEvents.length; i<l; ++i ){
            _trackEvents[ i ].zoom = _zoom;
          } //for
        }
      },
      duration: {
        enumerable: true,
        get: function(){
          return _duration;
        },
        set: function( val ){
          _duration = val;
          resetContainer();
          for( var i=0, l=_trackEvents.length; i<l; ++i ){
            _trackEvents[ i ].update();
          } //for
        }
      },
      ghost: {
        enumerable: true,
        get: function() {
          return _ghost;
        }
      },
      parent: {
        enumerable: true,
        get: function(){
          return _parent;
        },
        set: function( val ){
          _parent = val;
          if ( _droppable ) {
            _droppable.destroy();
            _droppable = null;
          }
          if ( _parent ) {
            setupDroppable();
          }
          for( var i=0, l=_trackEvents.length; i<l; ++i ){
            _trackEvents[ i ].parent = _this;
          }
        }
      }
    });

    this.addTrackEvent = function( trackEvent ){
      var trackEventElement = trackEvent.view.element;
      _element.appendChild( trackEventElement );
      _trackEvents.push( trackEvent.view );
      _trackEventElements.push( trackEvent.view.element );
      trackEvent.view.zoom = _zoom;
      trackEvent.view.parent = _this;
      _this.chain( trackEvent, [
        "trackeventmousedown",
        "trackeventmouseover",
        "trackeventmouseout"
      ]);
    }; //addTrackEvent

    this.removeTrackEvent = function( trackEvent ){
      var trackEventElement = trackEvent.view.element;
      _element.removeChild( trackEventElement );
      _trackEvents.splice( _trackEvents.indexOf( trackEvent.view ), 1 );
      _trackEventElements.splice( _trackEvents.indexOf( trackEvent.view.element ), 1 );
      trackEvent.view.parent = null;
      _this.unchain( trackEvent, [
        "trackeventmousedown",
        "trackeventmouseover",
        "trackeventmouseout"
      ]);
    }; //removeTrackEvent

    // helper function to create ghosts when neccessary of the appropriate trackevents
    function handleOverlap( trackEvent, track ) {
      var tracks = track._media.tracks,
          trackEventView = trackEvent.view,
          ghost = trackEvent.view.ghost,
          currentTrack,
          nextTrack,
          ghostView,
          ghostTrack,
          foundTrack = false;

      if ( trackEvent.isGhost ) {
        return;
      }

      function checkGhostOverlay( track ) {
        // create a ghost track
        if ( track.view.checkOverlay( ghost ) ) {
          if ( !_ghost ) {
            _this.createGhost( _track._media );

            _track._media.dispatch( "changetrack", {
              order: _track.order + 1
            });
          } else {
            _track._media.addTrack( _ghost );
            _track._media.dispatch( "changetrack", {
              order: _track.order + 1
            });
          }
          track.removeTrackEvent( ghost );
          _ghost.addTrackEvent( ghost );
        }
      }
      // loop over the tracks to find the one under the current one (if it exists)
      for ( var i = 0, l = tracks.length; i < l; i++ ) {

        currentTrack = tracks[ i ];
        nextTrack = tracks[ i + 1 ];

        // search for the track under the current one and make sure there is space for a ghost
        if ( currentTrack.id === track.id ) {
          // if there is another track
          if ( nextTrack ) {
            // if a ghosted trackevent doesn't exist, create one!
            if ( !ghost ) {
              // create a new ghost on the track below the currentone
              ghost = trackEventView.createGhost( nextTrack );

              checkGhostOverlay( nextTrack );

              ghostView = ghost.view;
              // update zoom and position so it is the same as the current trackEvent
              ghostView.zoom = _track.view.zoom;
              ghostView.updatePosition( trackEventView.element );
              // make it look all ghosty and stuff
              ghostView.element.style.opacity = "0.3";
              //_ghost.addTrackEvent( ghost );
            // if we already have a ghost be sure to update it
            } else {
              checkGhostOverlay( nextTrack );
              // just to be safe make sure we have a reference to the ghosts view
              if ( ghost.view ) {
                ghostView = ghost.view;
                ghostView.zoom = tracks[ i ].view.zoom;
                ghostView.updatePosition( trackEvent.view.element );
              }
            }
            foundTrack = true;
            break;
          }
        }
      }

      // if we didn't find an overlapping trackevent
      if ( !foundTrack ) {
        // if we don't currently have a ghost and are not a ghost we need
        // to create a ghosted track below us to house the ghosted trackevent
        if ( !ghost && !trackEvent.isGhost && !_ghost ) {

          _this.createGhost( _track._media );
          ghost = trackEventView.createGhost( _ghost );

          // update everything for this ghost
          ghostView = ghost.view;
          ghostView.zoom = _track.view.zoom;
          ghostView.updatePosition( trackEventView.element );
          ghostView.element.style.opacity = "0.3";

          _ghost.addTrackEvent( ghost );
        // we already have a ghost track so just update it
        } else if ( _ghost ) {
          ghost = trackEventView.createGhost( _ghost );

          _track._media.addTrack( _ghost );
          _ghost.addTrackEvent( ghost );

          ghostView = ghost.view;
          ghostView.zoom = _track.view.zoom;
          ghostView.updatePosition( trackEventView.element );
          ghostView.element.style.opacity = "0.3";
        }
      }
    }

    this.checkOverlay = function( trackevent ) {
      var teData = trackevent.data || trackevent,
          currentTrackEvent,
          rect1 = teData.view.element.getBoundingClientRect(),
          rect2,
          track;

      if ( !teData.dragging && !teData.isGhost ) {
        return;
      }

      // utility function to check if two trackevents are overlapping
      function isOverlapping( te1, te2 ) {
        return ( !( ( te1.top > te2.bottom ) || ( te1.bottom < te2.top ) ) && !( ( te1.left > te2.right ) || ( te1.right < te2.left ) ) );
      }

      // loop over all the trackevents for this track and see if we overlap
      for ( var i = 0, l = _trackEvents.length; i < l; i++ ) {

        currentTrackEvent = _trackEvents[ i ].trackEvent;
        rect2 = currentTrackEvent.view.element.getBoundingClientRect();

        // make sure that we don't check against the same trackEvent
        if ( teData.id !== currentTrackEvent.id && !_track.isGhost ) {
          if ( isOverlapping( rect1, rect2 ) ) {
            if ( !currentTrackEvent.isGhost ) {
              handleOverlap( teData, currentTrackEvent._track );
            }
            return true;
          }
        }
      }

      return false;
    };
  }; //TrackView
});
