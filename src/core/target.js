/**********************************************************************************

Copyright (C) 2011 by Mozilla Foundation

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

(function() {
  define( [ "core/logger", "core/eventmanager" ], function( Logger, EventManager ) {

    var __guid = 0;

    var Target = function ( options ) {
      options = options || {};

      var _id = __guid++,
          _logger = new Logger( _id ),
          _em = new EventManager( this ),
          _name = options.name || "Target" + _id,
          _element = options.element,
          _blinkInterval = -1,
          _highlightElement = document.createElement( "div" ),
          _highlightDims = {},
          _highlightInterval = -1,
          _this = this;

      _highlightElement.className = "butter-target-highlight";
      _highlightElement.style.visibility = "hidden";
      document.body.appendChild( _highlightElement );

      function checkPosition(){
        var ePos = _element.getBoundingClientRect();
        if( ePos.left !== _highlightDims.left ){
          _highlightDims.left = ePos.left;
          _highlightElement.style.left = ePos.left + "px";
        } //if
        if( ePos.top !== _highlightDims.top ){
          _highlightDims.top = ePos.top;
          _highlightElement.style.top = ePos.top + "px";
        } //if
        if( ePos.width !== _highlightDims.width ){
          _highlightDims.width = ePos.width;
          _highlightElement.style.width = ePos.width + "px";
        } //if
        if( ePos.height !== _highlightDims.height ){
          _highlightDims.height = ePos.height;
          _highlightElement.style.height = ePos.height + "px";
        } //if
        _highlightDims = ePos;
      } //checkPosition

      if( typeof( _element ) === "string" ){
        _element = document.getElementById( _element );
      } //if

      if( !_element ){
        _logger.log( "Warning: Target element is null." );
      }
      else {
        $( _element ).droppable({
          greedy: true,
          over: function( event, ui ){
            highlight( true );
          },
          out: function( event, ui ){
            highlight( false );
          },
          drop: function( event, ui ){
            highlight( false );
            _em.dispatch( "trackeventrequested", {
              event: event,
              target: _this,
              ui: ui
            });
          }
        });
      } //if

      checkPosition();

      function highlight( state ){
        clearInterval( _blinkInterval );
        clearInterval( _highlightInterval );
        _blinkInterval = -1;
        if( state ){
          if( _highlightInterval === -1 ){
            _highlightInterval = setInterval( checkPosition, 10 );
          } //if
          _highlightElement.style.visibility = "visible";
          _highlightElement.removeAttribute( "blink" );
          checkPosition();
        }
        else {
          if( _highlightInterval !== -1 ){
            clearInterval( _highlightInterval );
          } //if
          _highlightInterval = -1;
          _highlightElement.style.visibility = "hidden";
        } //if
      } //highlight

      _this.blink = function(){
        if( _blinkInterval === -1 ){
          _blinkInterval = setInterval( checkPosition, 100 );
          _highlightElement.setAttribute( "blink", "true" );
          _highlightElement.style.visibility = "visible";
          setTimeout(function(){
            clearInterval( _blinkInterval );
            _blinkInterval = -1;
            _highlightElement.removeAttribute( "blink" );
            _highlightElement.style.visibility = "hidden";
          }, 1500 );
        } //if
      }; //blink

      Object.defineProperties( this, {
        name: {
          enumerable: true,
          get: function(){
            return _name;
          }
        },
        id: {
          enumerable: true,
          get: function(){
            return _id;
          }
        },
        elementID: {
          enumerable: true,
          get: function(){
            if( _element ){
              return _element.id;
            } //if
          }
        },
        element: {
          enumerable: true,
          get: function(){
            return _element;
          }
        },
        highlight: {
          enumerable: true,
          get: function(){
            return _hightlightInterval !== -1;
          },
          set: function( val ){
            highlight( val );
          }
        },
        json: {
          enumerable: true,
          get: function(){
            var elem = "";
            if( _element && _element.id ){
              elem = _element.id; 
            } //if
            return {
              id: _id,
              name: _name,
              element: elem 
            };
          },
          set: function( importData ){
            if( importData.name ){
              name = importData.name;
            } //if
            if( importData.element ){
              _element = document.getElementById( importData.element );
            } //if
          }
        }
      });

    }; //Target

    return Target;

  }); //define
})();
