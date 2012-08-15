/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/logger", "core/eventmanager", "util/dragndrop" ],
  function( Logger, EventManagerWrapper, DragNDrop ) {

  return function( id, track ) {

    var _id = id,
        _track = track,
        _this = this,
        _trackEvents = [],
        _element = document.createElement( "div" ),
        _duration = 1,
        _parent,
        _droppable,
        _zoom = 1;

    EventManagerWrapper( _this );

    _element.className = "butter-track";

    function setupDroppable(){
      _droppable = DragNDrop.droppable( _element, {
        hoverClass: "draggable-hover",
        data: _this,
        drop: function( dropped, mousePosition ) {
          var droppedElement = dropped.data ? dropped.data.element : dropped,
              trackEventView,
              track,
              draggableType = droppedElement.getAttribute( "data-butter-draggable-type" ),
              start,
              left,
              trackRect = _element.getBoundingClientRect();

          if ( draggableType === "plugin" ) {
            left = mousePosition[ 0 ] - trackRect.left;
            start = left / trackRect.width * _duration;
            _this.dispatch( "plugindropped", {
              start: start,
              track: _track,
              type: droppedElement.getAttribute( "data-popcorn-plugin-type" )
            });
          }
          else if ( draggableType === "trackevent" ) {
            trackEventView = dropped.data;
            track = trackEventView.trackEvent.track;

            // Only rearrange trackEvent if it was moved *onto* this track
            if ( track && track !== _track ) {
              left = droppedElement.offsetLeft;
              start = left / trackRect.width * _duration;
              _this.dispatch( "trackeventdropped", {
                start: start,
                track: _track,
                trackEvent: trackEventView.trackEvent
              });
            }
          }
        }
      });
    }

    _element.setAttribute( "data-butter-track-id", _id );

    function resetContainer(){
      _element.style.width = "100%";
    } //resetContainer

    Object.defineProperties( this, {
      id: {
        enumerable: true,
        get: function() {
          return _id;
        }
      },
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
      },
      track: {
        enumerable: true,
        get: function() {
          return _track;
        }
      }
    });

    this.addTrackEvent = function( trackEvent ) {
      var trackEventElement = trackEvent.view.element;
      _element.appendChild( trackEventElement );
      _trackEvents.push( trackEvent.view );
      trackEvent.view.zoom = _zoom;
      trackEvent.view.parent = _this;
      _this.chain( trackEvent, [
        "trackeventmousedown",
        "trackeventmouseover",
        "trackeventmouseout"
      ]);
    };

    this.removeTrackEvent = function( trackEvent ){
      var trackEventElement = trackEvent.view.element;
      _element.removeChild( trackEventElement );
      _trackEvents.splice( _trackEvents.indexOf( trackEvent.view ), 1 );
      trackEvent.view.parent = null;
      _this.unchain( trackEvent, [
        "trackeventmousedown",
        "trackeventmouseover",
        "trackeventmouseout"
      ]);
    };

    // Creates a ghost trackEvent on this track. This means a cloned representation of a currently overlapping trackEvent
    // is added to this track.
    this.addTrackEventGhost = function( ghost ) {
      ghost.track = _track;
      _element.appendChild( ghost.element );
    };

    // Removes a ghost trackEvent from this track
    this.removeTrackEventGhost = function( ghost ) {
      ghost.track = null;
      _element.removeChild( ghost.element );
    };

    // utility function to check if two trackevents are overlapping
    function isOverlapping( te1, te2 ) {
      return !( te1.left > te2.right || te1.right < te2.left );
    }

    this.findOverlappingTrackEvent = function( trackEventView, fromRect ) {
      var otherTrackEventView,
          rect1 = trackEventView.element.getBoundingClientRect(),
          rect2;

      function findOverlap( teView1, teView2 ) {
        if ( !fromRect ) {
          return !!( teView1 !== teView2 && !teView2.dragging );
        } else {
          return !teView2.dragging;
        }
      }

      // If the rect's width is 0 here, it's likely that we're not even attached to the DOM
      if ( rect1.width === 0 ) {
        return null;
      }

      // loop over all the trackevents for this track and see if we overlap
      for ( var i = 0, l = _trackEvents.length; i < l; i++ ) {
        otherTrackEventView = _trackEvents[ i ];
        // make sure that we don't check against the same trackEvent
        if ( findOverlap( trackEventView, otherTrackEventView ) ) {
          rect2 = otherTrackEventView.element.getBoundingClientRect();
          // if a trackevent overlaps and it's not a ghost...
          if ( !otherTrackEventView.isGhost && isOverlapping( rect1, rect2 ) ) {
            return otherTrackEventView.trackEvent;
          }
        }
      }
      return null;
    };
  }; //TrackView
});
