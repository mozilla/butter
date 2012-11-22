/*! This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "core/logger", "util/dragndrop" ],
        function( Logger, DragNDrop ) {

  var BLINK_DURATION = 1500;
  var FADE_WAIT = 200;

  return function( element, events ) {

    var _element = typeof( element ) === "string" ? document.getElementById( element ) : element,
        _events = events || {},
        _droppable,
        _highlighting = false,
        _blinking = false,
        _this = this;

    function toggleElementState( state ) {
      if ( state ) {
        _element.classList.add( "butter-highlight-on" );
      }
      else {
        _element.classList.remove( "butter-highlight-on" );
      }
    }

    this.highlight = function( state ) {
      toggleElementState( state );
      _highlighting = state;
      _blinking = false;
      _element.classList.remove( "butter-highlight-fade" );
    };

    this.destroy = function() {
      if ( _droppable ) {
        _droppable.destroy();
      }
    };

    function onBlinkEnd() {
      _blinking = false;
      _element.classList.remove( "butter-highlight-fade" );
      if ( !_highlighting ) {
        toggleElementState( false );
      }
    }

    this.blink = function() {
      if ( !_highlighting && !_blinking ) {
        _blinking = true;
        setTimeout( function(){
          // Check if we're still blinking (could have been interrupted by a zealous dragger)
          if ( _blinking ) {
            _element.classList.add( "butter-highlight-fade" );
          }
        }, FADE_WAIT );
        toggleElementState( true );
        setTimeout( onBlinkEnd, BLINK_DURATION );
      }
    };

    if ( _element ) {
      _element.setAttribute( "butter-clean", "true" );

      _droppable = DragNDrop.droppable( _element, {
        over: function( dragElement ) {
          if ( dragElement.getAttribute( "data-butter-draggable-type" ) !== "plugin" ) {
            return;
          }
          _this.highlight( true );
          if ( _events.over ) {
            _events.over();
          }
        },
        out: function( dragElement ) {
          if ( dragElement.getAttribute( "data-butter-draggable-type" ) !== "plugin" ) {
            return;
          }
          _this.highlight( false );
          if ( _events.out ) {
            _events.out();
          }
        },
        drop: function( dragElement ) {
          if ( !dragElement.getAttribute || dragElement.getAttribute( "data-butter-draggable-type" ) !== "plugin" ) {
            return;
          }
          _this.highlight( false );
          if ( _events.drop ) {
            _events.drop( dragElement );
          }
        }
      });

    }

    // Expose element
    this.element = _element;

  };

});

