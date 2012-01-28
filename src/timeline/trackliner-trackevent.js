/**********************************************************************************

Copyright (C) 2012 by Mozilla Foundation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

**********************************************************************************/

define( [ "core/logger", "core/eventmanager" ], function( Logger, EventManager ){
  
  var __guid = 0;

  function TrackEvent( inputOptions, ui ){
    var _id = "trackEvent" + __guid++,
        _eventManager = new EventManager( this ),
        _element,
        _zoom = 1,
        _length = 1,
        _start,
        _end,
        _type = inputOptions.type,
        _selected = false,
        _this = this;

    this.update = function( options, silent ){
      options = options || {};
      _element.style.top = "0px";
      _this.start = options.start || _start;
      _this.end = options.end || _end;
      if( !silent ){
        _eventManager.dispatch( "trackeventupdated", false );
      } //if
    }; //update

    Object.defineProperties( this, {
      element: {
        get: function(){ return _element; }
      },
      length: {
        get: function(){ return _length; },
        set: function( val ){
          _length = val;
          _this.start = _start;
          _this.end = _end;
        }
      },
      start: {
        get: function(){ return _start; },
        set: function( val ){
          _start = val;
          _element.style.left = ( _start / _length * _zoom ) + "px";
        }
      },
      end: {
        get: function(){ return _end; },
        set: function( val ){
          _end = val;
          _element.style.width = ( ( _end - _start ) / _length * _zoom ) + "px";
        }
      },
      text: {
        get: function(){ return _element.innerHTML; },
        set: function( val ){
          _element.innerHTML = text;
        }
      },
      selected: {
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
          _element.style.left = _start * _zoom + "px";
          _element.style.width = ( _end - _start ) * _zoom + "px";
        }
      },
      length: {
        enumerable: true,
        get: function(){
          return _element.getBoundingClientRect().width / _zoom;
        },
        set: function( val ){
          _end = _start + val;
          _element.style.width = ( val * _zoom ) + "px";
        }
      }
    });

    function movedCallback( event, ui ) {
      _element.style.top = "0px";
      var rect = _element.getClientRects()[ 0 ];
      _start = _element.offsetLeft / _zoom;
      _end = _start + rect.width / _zoom;
      _eventManager.dispatch( "trackeventupdated", true );
    } //movedCallback

    function createEventElement( options ){
      var element = document.createElement( "div" );
      // set options if they exist
      options.height && (element.style.height = options.height);
      options.top && (element.style.top = options.top);
      options.innerHTML && (element.innerHTML = options.text);
      element.style.position = options.position ? options.position : "absolute";

      // add css options if they exist
      if ( options.css ) {
        $( element ).css( options.css );
      } //if

      element.className = "trackliner-event";

      return element;
    } //createEventElement

    _element = inputOptions.element || createEventElement( inputOptions );
    _element.id = _id;
    _this.update( inputOptions, true );
    _element.addEventListener( "click", function ( e ) {
      _eventManager.dispatch( "trackeventclicked", e );
    }, false);

    _element.addEventListener( "dblclick", function ( e ) {
      _eventManager.dispatch( "trackeventdoubleclicked", e );
    }, false);

    function select( e ){
      _this.deselectOthers();
      _selected = true;
      eventManager.dispatch( "trackeventselecteded", _this );
    } //select

    function deselect( e ) {
      _selected = false;
      eventManager.dispatch( "trackeventdeselecteded", _this );
    } //deselect

    $( _element ).draggable({
      containment: "parent",
      zIndex: 9001,
      scroll: true,
      // this is when an event stops being dragged
      start: function ( event, ui ) {},
      stop: movedCallback
    }).resizable({ 
      autoHide: true, 
      containment: "parent", 
      handles: "e, w", 
      scroll: false,
      stop: movedCallback
    });

    _this.start = inputOptions.start;
    _this.end = inputOptions.end;

  } //TrackEvent

  return TrackEvent;

});
