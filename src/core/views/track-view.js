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

    this.checkOverlay = function( trackevent ) {
      var teData = trackevent.data || trackevent,
          currentTrackEvent,
          rect1 = teData.view.element.getBoundingClientRect(),
          rect2,
          overlapFound = false;

      if ( !teData.dragging ) {
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
        if ( teData.id !== currentTrackEvent.id  && !teData.isGhost ) {
          if ( isOverlapping( rect1, rect2 ) ) {
            overlapFound = true;
            _track._media.dispatch( "trackeventoverlap", {
              trackevent: teData,
              track: _track
            });
            break;
          }
        }
      }
      if ( !overlapFound && teData.ghost ) {
        teData.ghost._track.removeTrackEvent( teData.ghost );
        teData.ghost = null;
        teData.ghost.view = null;
        teData.isGhost = false;
      }
    };
  }; //TrackView
});
