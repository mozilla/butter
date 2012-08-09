/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/logger", "core/eventmanager", "util/dragndrop",
          "util/lang", "text!layouts/trackevent.html" ],
  function( Logger, EventManagerWrapper, DragNDrop,
            LangUtils, TRACKEVENT_LAYOUT ) {

  return function( trackEvent, type, inputOptions ){

    var _element = LangUtils.domFragment( TRACKEVENT_LAYOUT ),
        _zoom = 1,
        _type = type,
        _start = inputOptions.start || 0,
        _end = inputOptions.end || _start + 1,
        _parent,
        _handles,
        _typeElement = _element.querySelector( ".title" ),
        _draggable,
        _resizable,
        _trackEvent = trackEvent,
        _dragging = false,
        _resizing = false,
        _padding = 0,
        _elementText,
        _overlapping = false,
        _ghost,
        _this = this;

    EventManagerWrapper( _this );

    function toggleHandles( state ) {
      if ( _parent ) {
        _handles[ 0 ].style.visibility = state ? "visible" : "hidden";
        _handles[ 1 ].style.visibility = state ? "visible" : "hidden";
      }
    }

    function resetContainer( ){
      _element.style.left = _start * _zoom + "px";
      _element.style.width = ( _end - _start ) * _zoom + "px";
    } //resetContainer

    this.updatePosition = function( element ) {
      _element.style.left = element.style.left;
      _element.style.width = element.style.width;
      movedCallback()
    };

    this.setToolTip = function( title ){
      _element.title = title;
    };

    this.update = function( options ){
      options = options || {};
      _element.style.top = "0px";
      if ( !isNaN( options.start ) ) {
        _start = options.start;
      }
      if ( !isNaN( options.end ) ) {
        _end = options.end;
      }
      resetContainer();
    }; //update

    /**
     * Member: createGhost
     *
     * Creates a clone of the current trackEvent that does not have an associated Popcorn trackevent.
     * Used to notify the user when a trackevent overlaps and where the new location will be
     * when the trackevent is dropped
     */
    this.createGhost = function( track ) {
      var options = JSON.parse( JSON.stringify( _trackEvent.popcornOptions ) );
      options.type = _type;
      _ghost = track.addTrackEvent( options, true );
      _ghost.update();
      return _ghost;
    };

    /*
     * Member: cleanupGhost
     *
     * Removes this trackEvents ghost and makes sure isGhost is set to false
     */
    this.cleanupGhost = function() {
      _ghost.isGhost = false;
      _ghost.track.removeTrackEvent( _ghost );
      _ghost = null;
    };

    Object.defineProperties( this, {
      trackEvent: {
        enumerable: true,
        get: function(){
          return _trackEvent;
        }
      },
      ghost: {
        enumerable: true,
        get: function() {
          return _ghost;
        }
      },
      element: {
        enumerable: true,
        get: function(){ return _element; }
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
      type: {
        enumerable: true,
        get: function(){ return _type; },
        set: function( val ){
          _type = val;
          _element.setAttribute( "data-butter-trackevent-type", _type );
        }
      },
      elementText: {
        enumerable: true,
        get: function() {
          return _elementText;
        },
        set: function( val ) {
          _elementText = val;
          _typeElement.innerHTML = _elementText;
        }
      },
      selected: {
        enumerable: true,
        get: function(){ return _draggable.selected; },
        set: function( val ){
          if( val ){
            select();
          }
          else {
            deselect();
          } //if
        }
      },
      dragging: {
        enumerable: true,
        get: function(){
          return _dragging;
        }
      },
      resizing: {
        enumerable: true,
        get: function() {
          return _resizing;
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
      parent: {
        enumerabled: true,
        get: function(){
          return _parent;
        },
        set: function( val ){
          _parent = val;

          if( _draggable ){
            _draggable.destroy();
            _draggable = null;
          }

          if( _resizable ){
            toggleHandles( false );
            _resizable.destroy();
            _resizable = null;
            _handles = null;
          }

          if( _parent ){

            if( _parent.element && _parent.element.parentNode && _parent.element.parentNode.parentNode ){

              // Capture the element's computed style on initialization
              var elementStyle = getComputedStyle( _element ),
                  paddingLeft = elementStyle.paddingLeft ? +elementStyle.paddingLeft.substring( 0, elementStyle.paddingLeft.length - 2 ) : 0,
                  paddingRight = elementStyle.paddingRight ? +elementStyle.paddingRight.substring( 0, elementStyle.paddingRight.length - 2 ) : 0;

              // Store padding values to negate from width calculations
              _padding = paddingLeft + paddingRight;

              _draggable = DragNDrop.draggable( _element, {
                containment: _parent.element.parentNode,
                scroll: _parent.element.parentNode.parentNode,
                start: function(){
                  _dragging = true;
                  _this.dispatch( "trackeventdragstarted" );
                },
                stop: function(){
                  var te,
                      _dragging = false;

                  _this.dispatch( "trackeventdragstopped" );
                  movedCallback();

                  if ( _trackEvent.view.ghost && ( _trackEvent.track.order - _trackEvent.view.ghost.track.order === -1 ) ) {
                    ghost = _trackEvent.view.ghost;
                    te = _trackEvent.track.removeTrackEvent( _trackEvent );
                    ghost.track.addTrackEvent( te );
                    te.view.cleanupGhost();
                  }
                },
                drag: function( element, droppable ) {
                  var tracks = _trackEvent.track._media.tracks,
                      track,
                      droppableId = droppable.getAttribute( "data-butter-track-id" );

                  for ( var i = 0, l = tracks.length; i < l; i++ ) {
                    if ( tracks[ i ].view.id == droppableId ) {
                      if ( !tracks[ i ].isGhost ) {
                        _overlapping = tracks[ i ].view.checkOverlay( _trackEvent );
                      } else {
                        tracks[ i ].view.checkOverlay( _trackEvent );
                      }
                      break;
                    }
                  }

                  // if we didn't find an overlapping trackevent and a ghost exists for this trackevent
                  // this should be called when dragging an overlapping trackevent into an open space
                  if ( !_overlapping && _ghost && _ghost.track ) {

                    track = _ghost.track;

                    // if we had a ghosted track, get rid of the ghost and clean up after ourself
                    if ( track && track.view && track.view.ghost && track.view.ghost.isGhost ) {
                      track.view.cleanupGhost();
                    }

                    // make sure that we remove the ghost after we drag off the current trackEvent
                    if ( track.isGhost ) {
                      for( var j = 0, jl = tracks.length; j < jl; j++ ) {
                        if ( tracks[ j ] && tracks[ j ].view && tracks[ j ].view.ghost && tracks[ j ].view.ghost.id === track.id ) {
                          track._media.removeTrack( tracks[ j ].view.ghost );
                        }
                      }
                    }
                    _overlapping = false;
                    // if we found an overlap meaning we are currently dragging over a trackevent
                    _this.cleanupGhost();
                  }
                },
                revert: true
              });

              _draggable.selected = _trackEvent.selected;

              _resizable = DragNDrop.resizable( _element, {
                containment: _parent.element.parentNode,
                scroll: _parent.element.parentNode.parentNode,
                padding: _padding,
                start: function() {
                  _resizing = true;
                },
                stop: function() {
                  _resizing = false;
                  movedCallback();
                }
              });

              _element.setAttribute( "data-butter-draggable-type", "trackevent" );
              _element.setAttribute( "data-butter-trackevent-id", _trackEvent.id );

              if( !_handles ){
                _handles = _element.querySelectorAll( ".handle" );
                if( _handles && _handles.length === 2 ){
                  _element.addEventListener( "mouseover", function( e ){
                    toggleHandles( true );
                  }, false );
                  _element.addEventListener( "mouseout", function( e ){
                    toggleHandles( false );
                  }, false );
                  toggleHandles( false );
                }
              }

            }

            resetContainer();
          } //if
        } //set
      }
    });

    function movedCallback() {
      _element.style.top = "0px";
      _start = _element.offsetLeft / _zoom;
      _end = _start + ( _element.offsetWidth - _padding ) / _zoom;
      _trackEvent.update({
        start: _start,
        end: _end
      });
    }

    _element.className = "butter-track-event";
    _this.type = _type;

    _this.update( inputOptions );

    _element.addEventListener( "mousedown", function ( e ) {
      _this.dispatch( "trackeventmousedown", { originalEvent: e, trackEvent: _trackEvent } );
    }, true);
    _element.addEventListener( "mouseup", function ( e ) {
      _this.dispatch( "trackeventmouseup", { originalEvent: e, trackEvent: _trackEvent } );
    }, false);
    _element.addEventListener( "mouseover", function ( e ) {
      _this.dispatch( "trackeventmouseover", { originalEvent: e, trackEvent: _trackEvent } );
    }, false );
    _element.addEventListener( "mouseout", function ( e ) {
      _this.dispatch( "trackeventmouseout", { originalEvent: e, trackEvent: _trackEvent } );
    }, false );

    function select() {
      _draggable.selected = true;
      _element.setAttribute( "selected", true );
    } //select

    function deselect() {
      _draggable.selected = false;
      _element.removeAttribute( "selected" );
    } //deselect

  };

});
