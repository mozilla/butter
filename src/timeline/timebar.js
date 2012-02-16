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

define( [ "util/lang", "./scrubber" ], function( util, Scrubber ) {

  return function( parentElement, media, tracksContainer ){ 

    var _element = document.createElement( "div" ),
        _canvas = document.createElement( "canvas" ),
        _canvasContainer = document.createElement( "div" ),
        _parent = parentElement,
        _media = media,
        _tracksContainer = tracksContainer,
        _scrubber = new Scrubber( _element, _media, _tracksContainer ),
        _this = this;

    _element.className = "butter-timebar";
    _canvasContainer.className = "butter-timebar-canvas-container";
    _canvasContainer.appendChild( _canvas );
    _element.appendChild( _canvasContainer );
    _parent.appendChild( _element );

    _tracksContainer.addEventListener( "scroll", function( e ){
      _canvasContainer.scrollLeft = _tracksContainer.scrollLeft;
    }, false );

    this.update = function( zoom ) {
      var width = _tracksContainer.scrollWidth;

      _canvas.style.width = width + "px";

      var context = _canvas.getContext( "2d" );

      _canvas.height = _canvas.offsetHeight;
      _canvas.width = _canvas.offsetWidth;

      var inc = _canvas.offsetWidth / _media.duration,
          textWidth = context.measureText( util.secondsToSMPTE( 5 ) ).width,
          padding = 20,
          lastPosition = 0,
          lastTimeDisplayed = -( ( textWidth + padding ) / 2 );

      context.clearRect ( 0, 0, _canvas.width, _canvas.height );

      context.beginPath();

      for ( var i = 1, l = _media.duration + 1; i < l; i++ ) {

        var position = i * inc;
        var spaceBetween = -~( position ) - -~( lastPosition );

        // ensure there is enough space to draw a seconds tick
        if ( spaceBetween > 3 ) {

          // ensure there is enough space to draw a half second tick
          if ( spaceBetween > 6 ) {

            context.moveTo( -~position - spaceBetween / 2, 0 );
            context.lineTo( -~position - spaceBetween / 2, 7 );

            // ensure there is enough space for quarter ticks
            if ( spaceBetween > 12 ) {

              context.moveTo( -~position - spaceBetween / 4 * 3, 0 );
              context.lineTo( -~position - spaceBetween / 4 * 3, 4 );

              context.moveTo( -~position - spaceBetween / 4, 0 );
              context.lineTo( -~position - spaceBetween / 4, 4 );

            }
          }
          context.moveTo( -~position, 0 );
          context.lineTo( -~position, 10 );

          if ( ( position - lastTimeDisplayed ) > textWidth + padding ) {

            lastTimeDisplayed = position;
            // text color
            context.fillStyle = "#999999";
            context.fillText( util.secondsToSMPTE( i ), -~position - ( textWidth / 2 ), 21 );
          }

          lastPosition = position;
        }
      }
      // stroke color
      context.strokeStyle = "#999999";
      context.stroke();
      context.closePath();

      _scrubber.update( zoom );
    }; //update

  };

});
