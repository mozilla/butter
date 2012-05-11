/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/logger",
          "core/eventmanager",
          "util/dragndrop"
        ],
        function(
          Logger,
          EventManagerWrapper,
          DragNDrop
        ){

  var __guid = 0;

  return function( track ){

    var _id = "TrackView" + __guid++,
        _track = track,
        _this = this,
        _trackEvents = [],
        _trackEventElements = [],
        _element = document.createElement( "div" ),
        _duration = 1,
        _parent,
        _zoom = 1;

    EventManagerWrapper( _this );

    _element.className = "butter-track";
    _element.id = _id;

    DragNDrop.droppable( _element, {
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
            type: dropped.getAttribute( "data-butter-plugin-type" )
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
            _trackEvents[ i ].duration = _duration;
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
          for( var i=0, l=_trackEvents.length; i<l; ++i ){
            _trackEvents[ i ].parent = _this;
          } //for
        }
      }
    });

    this.addTrackEvent = function( trackEvent ){
      var trackEventElement = trackEvent.view.element;
      _element.appendChild( trackEventElement );
      _trackEvents.push( trackEvent.view );
      _trackEventElements.push( trackEvent.view.element );
      trackEvent.view.zoom = _zoom;
      trackEvent.view.duration = _duration;
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

  }; //TrackView

});
