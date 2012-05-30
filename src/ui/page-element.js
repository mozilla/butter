/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/logger", "core/eventmanager", "util/dragndrop", "ui/position-tracker" ],
        function( Logger, EventManagerWrapper, DragNDrop, PositionTracker ) {

  var __nullFunction = function(){};

  return function( element, events, options ){

    var _element = typeof( element ) === "string" ? document.getElementById( element ) : element,
        _highlightElement = document.createElement( "div" ),
        _events = events || {},
        _options = options || {},
        _blinkFunction,
        _positionTracker,
        _droppable,
        _highlighting = false,
        _draggingGlobal = false,
        _this = this;

    EventManagerWrapper( _this );

    _positionTracker = PositionTracker( _element, function( rect ){
      _highlightElement.style.left = rect.left + "px";
      _highlightElement.style.top = rect.top + "px";
      _highlightElement.style.width = rect.width + "px";
      _highlightElement.style.height = rect.height + "px";
      _this.dispatch( "moved", rect );
    });

    this.highlight = function( state ){
      if( state ){
        _this.blink = __nullFunction;
        _highlighting = true;
        _highlightElement.style.visibility = "visible";
        _highlightElement.classList.add( "on" );
        _highlightElement.classList.remove( "blink" );
        _highlightElement.removeEventListener( 'transitionend', onTransitionEnd, false );
        _highlightElement.removeEventListener( 'oTransitionEnd', onTransitionEnd, false );
        _highlightElement.removeEventListener( 'webkitTransitionEnd', onTransitionEnd, false );
      }
      else {
        _this.blink = _blinkFunction;
        _highlighting = false;
        _highlightElement.classList.remove( "on" );
        if ( !_draggingGlobal ) {
          _highlightElement.style.visibility = "hidden";
        }
      }
    };

    window.addEventListener( "dragstart", function( e ) {
      _highlightElement.style.visibility = "visible";
      _draggingGlobal = true;
    }, false );

    window.addEventListener( "dragend", function( e ) {
      if ( !_highlightElement.classList.contains( "blink" ) ) {
        _highlightElement.style.visibility = "hidden";
      }
      _draggingGlobal = false;
    }, false );

    this.destroy = function(){
      _positionTracker.destroy();
      if( _highlightElement.parentNode ){
        _highlightElement.parentNode.removeChild( _highlightElement );
      } //if

      if ( _droppable ) {
        _droppable.destroy();
      }
    }; //destroy

    _highlightElement.className = "butter-highlight ";
    _highlightElement.setAttribute( "data-butter-exclude", "true" );
    if( _options.highlightClass ){
      _highlightElement.className += _options.highlightClass;
    } //if
    _highlightElement.style.visibility = "hidden";

    function onTransitionEnd(){
      _highlightElement.classList.remove( "blink" );
      if ( !_draggingGlobal && !_highlighting ) {
        _highlightElement.style.visibility = "hidden";
      }
      if ( !_highlighting ) {
        _highlightElement.classList.remove( "on" );
        _this.blink = _blinkFunction;
      }
      _highlightElement.removeEventListener( 'transitionend', onTransitionEnd, false );
      _highlightElement.removeEventListener( 'oTransitionEnd', onTransitionEnd, false );
      _highlightElement.removeEventListener( 'webkitTransitionEnd', onTransitionEnd, false );
    }

    this.blink = _blinkFunction = function(){
      _this.blink = __nullFunction;
      _highlightElement.classList.add( "on" );
      setTimeout(function(){
        _highlightElement.classList.add( "blink", "true" );
      }, 0);
      _highlightElement.style.visibility = "visible";
      _highlightElement.addEventListener( 'transitionend', onTransitionEnd, false );
      _highlightElement.addEventListener( 'oTransitionEnd', onTransitionEnd, false );
      _highlightElement.addEventListener( 'webkitTransitionEnd', onTransitionEnd, false );
    }; //blink

    if( _element ){
      document.body.appendChild( _highlightElement );

      _element.setAttribute( "butter-clean", "true" );

      _droppable = DragNDrop.droppable( _highlightElement, {
        over: function( dragElement ){
          if( dragElement.getAttribute( "data-butter-draggable-type" ) !== "plugin" ){
            return;
          }
          _this.highlight( true );
          if( _events.over ){
            _events.over();
          } //if
        }, //over
        out: function( dragElement ){
          if( dragElement.getAttribute( "data-butter-draggable-type" ) !== "plugin" ){
            return;
          }
          _this.highlight( false );
          if( _events.out ){
            _events.out();
          } //if
        }, //out
        drop: function( dragElement ){
          if( dragElement.getAttribute( "data-butter-draggable-type" ) !== "plugin" ){
            return;
          }
          _this.highlight( false );
          if( _events.drop ){
            _events.drop( dragElement );
          } //if
        } //drop
      });

    } //if

    Object.defineProperties( this, {
      element: {
        enumerable: true,
        get: function(){
          return _element;
        }
      }
    });

  }; //Element

});

