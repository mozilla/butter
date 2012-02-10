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

define( [], function(){
  const ZOOM_LEVELS = 6;

  return function( rootElement, zoomCallback ){

    var _element = document.createElement( "div" ),
        _handle = document.createElement( "div" ),
        _rect,
        _this = this;

    $( _handle ).draggable({
      axis: "x",
      containment: "parent",
      drag: function( e, ui ){
        zoomCallback( _handle.offsetLeft / _rect.width  );
      },
      stop: function( e, ui ){
        zoomCallback( _handle.offsetLeft / _rect.width  );
      }
    });

    _element.className = "butter-timeline-zoombar butter-timeline-scroll";
    _handle.className = "butter-timeline-scroll-handle";

    _handle.setAttribute( "draggable", true );
    
    _element.appendChild( _handle );
    rootElement.appendChild( _element );

    this.update = function( level ) {
      _rect = _element.getBoundingClientRect();
      _handle.style.width = ( _rect.width / ZOOM_LEVELS ) + "px";
      $( _handle ).draggable( "option", "grid", [ Math.floor( _rect.width/ZOOM_LEVELS ), 0 ] );
      if( level !== undefined ){
        _handle.style.left = ( level * _rect.width / ZOOM_LEVELS ) + "px";
      } //if
    }; //setup

    _element.addEventListener( "resize", function( e ){
      _this.update();
    }, false );

  };
});
