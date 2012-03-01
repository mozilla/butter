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

define( [ "core/logger", "core/eventmanager" ], function( Logger, EventManager ) {
  
  return function( element, events, options ){

    var _element = typeof( element ) === "string" ? document.getElementById( element ) : element,
        _highlightElement = document.createElement( "div" ),
        _blinkInterval = -1,
        _highlightElement = document.createElement( "div" ),
        _highlightDims = {},
        _highlightInterval = -1,
        _events = events || {},
        _options = options || {},
        _this = this;

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

    this.destroy = function(){
      if( _highlightElement.parentNode ){
        _highlightElement.parentNode.removeChild( _highlightElement );
      } //if
    }; //destroy

    _highlightElement.className = "butter-highlight ";
    _highlightElement.setAttribute( "data-butter-exclude", "true" );
    if( _options.highlightClass ){
      _highlightElement.className += _options.highlightClass;
    } //if
    _highlightElement.style.visibility = "hidden";

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

    if( _element ){
      document.body.appendChild( _highlightElement );

      _element.setAttribute( "butter-clean", "true" );

      $( _element ).droppable({
        greedy: true,
        over: function( event, ui ){
          highlight( true );
          if( _events.over ){
            _events.over( event, ui );
          } //if
        }, //over
        out: function( event, ui ){
          highlight( false );
          if( _events.out ){
            _events.out( event, ui );
          } //if
        }, //out
        drop: function( event, ui ){
          highlight( false );
          if( _events.drop ){
            _events.drop( event, ui );
          } //if
        } //drop
      });

    } //if

    Object.defineProperties( this, {
      highlight: {
        enumerable: true,
        get: function(){
          return _hightlightInterval !== -1;
        },
        set: function( val ){
          highlight( val );
        }
      }
    });

  }; //Element

});

