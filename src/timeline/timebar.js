/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "util/lang", "./scrubber" ], function( util, Scrubber ) {

  return function( media, tracksContainer ){ 

    var _element = document.createElement( "div" ),
        _canvas = document.createElement( "canvas" ),
        _canvasContainer = document.createElement( "div" ),
        _media = media,
        _tracksContainer = tracksContainer,
        _scrubber = new Scrubber( _element, _media, _tracksContainer ),
        _this = this;

    _element.className = "time-bar";
    _canvasContainer.className = "time-bar-canvas-container";
    _canvasContainer.appendChild( _canvas );
    _element.appendChild( _canvasContainer );

    _tracksContainer.element.addEventListener( "scroll", function( e ){
      _canvasContainer.scrollLeft = _tracksContainer.element.scrollLeft;
    }, false );

    _canvas.addEventListener( "mousedown", _scrubber.onMouseDown, false );

    this.update = function( zoom ) {
      var tracksContainerWidth = tracksContainer.container.getBoundingClientRect().width;

      var width = Math.min( tracksContainerWidth, _tracksContainer.container.scrollWidth );

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

    this.destroy = function(){
      _scrubber.destroy();
    }; //destroy


    Object.defineProperties( this, {
      element: {
        enumerable: true,
        get: function(){
          return _element;
        }
      }
    });

  }; //TimeBar

});
