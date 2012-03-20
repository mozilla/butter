/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/logger", "core/eventmanager" ], function( Logger, EventManager ){
  
  var __guid = 0;

  return function( trackEvent, type, inputOptions ){

    var _id = "TrackEventView" + __guid++,
        _eventManager = new EventManager( this ),
        _element,
        _zoom = 1,
        _duration = 1,
        _type = type,
        _start = inputOptions.start || 0,
        _end = inputOptions.end || _start + 1,
        _selected = false,
        _parent,
        _handles,
        _this = this;

    function resetContainer(){
      _element.style.left = ( _start / _duration * _zoom ) + "px";
      _element.style.width = ( ( _end - _start ) / _duration * _zoom ) + "px";
    } //resetContainer

    this.update = function( options ){
      options = options || {};
      _element.style.top = "0px";
      _start = options.start || _start;
      _end = options.end || _end;
      resetContainer();
    }; //update

    Object.defineProperties( this, {
      trackEvent: {
        enumerable: true,
        get: function(){
          return trackEvent;
        }
      },
      element: {
        enumerable: true,
        get: function(){ return _element; }
      },
      duration: {
        enumerable: true,
        get: function(){ return _duration; },
        set: function( val ){
          _duration = val;
          resetContainer();
        }
      },
      start: {
        enumerable: true,
        get: function(){ return _start; },
        set: function( val ){
          _start = val;
          resetContainer();
        }
      },
      end: {
        enumerable: true,
        get: function(){ return _end; },
        set: function( val ){
          _end = val;
          resetContainer();
        }
      },
      text: {
        enumerable: true,
        get: function(){ return _element.innerHTML; },
        set: function( val ){
          _element.innerHTML = text;
        }
      },
      selected: {
        enumerable: true,
        get: function(){ return _selected; },
        set: function( val ){
          if( val ){
            select();
          }
          else {
            deselect();
          } //if
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
        }
      },
      duration: {
        enumerable: true,
        get: function(){
          return _element.getBoundingClientRect().width / _zoom;
        },
        set: function( val ){
          resetContainer();
        }
      },
      id: {
        enumerable: true,
        configurable: false,
        get: function(){
          return _id;
        }
      },
      parent: {
        enumerabled: true,
        get: function(){
          return _parent;
        },
        set: function( val ){
          _parent = val;
          if( _parent && !_handles ){

            $( _element ).draggable({
              containment: _parent.element.parentNode,
              // highest possible zIndex inside of 32 bits
              zIndex: 2147483647,
              scroll: true,
              // this is when an event stops being dragged
              start: function ( event, ui ) {
              },
              stop: movedCallback
            }).resizable({ 
              autoHide: false, 
              containment: "parent", 
              handles: "e, w", 
              scroll: false,
              stop: movedCallback
            })
            .data( "draggable-type", "trackevent" )
            .data( "trackevent-id", trackEvent.id );

            _handles = _element.querySelectorAll( ".ui-resizable-handle" );
            function toggleHandles( state ){
              _handles[ 0 ].style.visibility = state ? "visible" : "hidden";
              _handles[ 1 ].style.visibility = state ? "visible" : "hidden";
            } //toggleHandles
            _element.addEventListener( "mouseover", function( e ){
              toggleHandles( true );
            }, false );
            _element.addEventListener( "mouseout", function( e ){
              toggleHandles( false );
            }, false );
            toggleHandles( false );

            resetContainer();
          } //if
        } //set
      }
    });

    function movedCallback( event, ui ) {
      _element.style.top = "0px";
      var rect = _element.getClientRects()[ 0 ];
      _start = _element.offsetLeft / _zoom;
      _end = _start + rect.width / _zoom;
      _eventManager.dispatch( "trackeventviewupdated", ui );
    } //movedCallback

    _element = document.createElement( "div" );
    _element.className = "butter-track-event";
    _element.appendChild( document.createTextNode( _type ) );
    _element.setAttribute( "data-butter-trackevent-type", _type );

    _element.id = _id;
    _this.update( inputOptions );

    _element.addEventListener( "mousedown", function ( e ) {
      _eventManager.dispatch( "trackeventmousedown", { originalEvent: e, trackEvent: trackEvent } );
    }, false);
    _element.addEventListener( "mouseover", function ( e ) {
      _eventManager.dispatch( "trackeventmouseover", { originalEvent: e, trackEvent: trackEvent } );
    }, false );
    _element.addEventListener( "mouseout", function ( e ) {
      _eventManager.dispatch( "trackeventmouseout", { originalEvent: e, trackEvent: trackEvent } );
    }, false );

    _element.addEventListener( "dblclick", function ( e ) {
      _eventManager.dispatch( "trackeventdoubleclicked", { originalEvent: e, trackEvent: trackEvent } );
    }, false);

    function select( e ){
      _selected = true;
      _element.setAttribute( "selected", true );
    } //select

    function deselect( e ) {
      _selected = false;
      _element.removeAttribute( "selected" );
    } //deselect

  };

});
