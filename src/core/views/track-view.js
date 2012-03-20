/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/logger",
          "core/eventmanager"
        ],
        function(
          Logger,
          EventManager
        ){

  var __guid = 0;

  return function( track ){

    var _id = "TrackView" + __guid++,
        _track = track,
        _this = this,
        _trackEvents = [],
        _trackEventElements = [],
        _em = new EventManager( this ),
        _element = document.createElement( "div" ),
        _duration = 1,
        _zoom = 1;

    _element.className = "butter-track";
    _element.id = _id;

    $( _element ).droppable({ 
      greedy: true,
      // this is dropping an event on a track
      drop: function( event, ui ) {
        var dropped = ui.draggable[ 0 ],
            draggableType = $( ui.draggable ).data( "draggable-type" );

        var start,
            left,
            trackRect = _element.getBoundingClientRect();

        if( draggableType === "plugin" ){
          var type = dropped.getAttribute( "data-butter-plugin-type" );
          left = event.clientX - trackRect.left;
          start = left / trackRect.width * _duration;
          _em.dispatch( "plugindropped", {
            start: start,
            track: _track,
            type: ui.draggable[ 0 ].getAttribute( "data-butter-plugin-type" )
          });
        }
        else if( draggableType === "trackevent" ) {
          if( ui.draggable[ 0 ].parentNode !== _element ){
            left = dropped.offsetLeft;
            start = left / trackRect.width * _duration;
            _em.dispatch( "trackeventdropped", {
              start: start,
              track: _track,
              trackEvent: $( ui.draggable ).data( "trackevent-id" )
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
      }
    });

    this.addTrackEvent = function( trackEvent ){
      var trackEventElement = trackEvent.view.element;
      _element.appendChild( trackEventElement );
      _trackEvents.push( trackEvent.view );
      _trackEventElements.push( trackEvent.view.element );
      trackEvent.view.zoom = _zoom;
      trackEvent.view.duration = _duration;
      trackEvent.view.parent = this;
      _em.repeat( trackEvent, [
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
      trackEvent.view.parent = undefined;
      _em.unrepeat( trackEvent, [
        "trackeventmousedown",
        "trackeventmouseover",
        "trackeventmouseout"
      ]);
    }; //removeTrackEvent

  }; //TrackView

});
