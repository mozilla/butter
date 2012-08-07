/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/logger", "core/eventmanager", "util/dragndrop",
          "util/lang", "text!layouts/trackevent.html" ],
  function( Logger, EventManagerWrapper, DragNDrop,
            LangUtils, TRACKEVENT_LAYOUT ) {

  return function( trackEvent, type, inputOptions ){

    var _element = LangUtils.domFragment( TRACKEVENT_LAYOUT, ".butter-track-event" ),
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
        _this = this;

    EventManagerWrapper( _this );

    function toggleHandles( state ) {
      if ( _parent ) {
        _handles[ 0 ].style.visibility = state ? "visible" : "hidden";
        _handles[ 1 ].style.visibility = state ? "visible" : "hidden";
      }
    }

    function resetContainer(){
      _element.style.left = _start * _zoom + "px";
      _element.style.width = ( _end - _start ) * _zoom + "px";
    } //resetContainer

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

    Object.defineProperties( this, {
      trackEvent: {
        enumerable: true,
        get: function(){
          return _trackEvent;
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
                  _dragging = false;
                  _this.dispatch( "trackeventdragstopped" );
                  movedCallback();
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
