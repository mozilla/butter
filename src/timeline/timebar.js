/*! This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "util/lang", "./scrubber" ], function( util, Scrubber ) {

  var CANVAS_CONTAINER_PADDING = 5,
      TICK_COLOR = "#999999";

  return function( butter, media, statusArea, tracksContainer, hScrollbar ) {

    var _element = statusArea.querySelector( ".time-bar" ),
        _canvas = _element.querySelector( "canvas" ),
        _media = media,
        _tracksContainer = tracksContainer,
        _scrubber = new Scrubber( butter, _element, _media, _tracksContainer, hScrollbar );

    function drawTicks() {
      var tracksContainerWidth = tracksContainer.container.getBoundingClientRect().width,
          width = Math.min( tracksContainerWidth, _tracksContainer.container.scrollWidth ),
          containerWidth = Math.min( width, _tracksContainer.element.offsetWidth - CANVAS_CONTAINER_PADDING );

      var context = _canvas.getContext( "2d" );

      if ( _canvas.height !== _canvas.offsetHeight ) {
        _canvas.height = _canvas.offsetHeight;
      }
      if ( _canvas.width !== containerWidth ) {
        _canvas.width = containerWidth;
      }

      var inc = _tracksContainer.container.clientWidth / _media.duration,
          textWidth = context.measureText( util.secondsToSMPTE( 5 ) ).width,
          padding = 20,
          lastPosition = 0,
          lastTimeDisplayed = -( ( textWidth + padding ) / 2 ),
          start = _tracksContainer.element.scrollLeft / inc,
          end = ( _tracksContainer.element.scrollLeft + containerWidth ) / inc;

      context.clearRect ( 0, 0, _canvas.width, _canvas.height );
      context.translate( -_tracksContainer.element.scrollLeft, 0 );
      context.beginPath();

      for ( var i = 1, l = _media.duration + 1; i < l; i++ ) {

        // If the current time is not in the viewport, just skip it
        if ( i + 1 < start ) {
          continue;
        }
        if ( i - 1 > end ) {
          break;
        }

        var position = i * inc;
        var spaceBetween = -~( position ) + ~( lastPosition );

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
            context.fillStyle = TICK_COLOR;
          }

          lastPosition = position;
        }
      }
      // stroke color
      context.strokeStyle = TICK_COLOR;
      context.stroke();
      context.translate( _tracksContainer.element.scrollLeft, 0 );

      _scrubber.update( containerWidth );
    }

    // drawTicks() is called as a consequence of update(), which is called
    // from timeline/media to update according to viewport-centering. As a result,
    // drawTicks() need only happen when tracksContainer scrolls and the media is
    // not playing (probably when the user is scrubbing/zooming/scrolling).
    _media.listen( "mediapause", function() {
      _tracksContainer.element.addEventListener( "scroll", drawTicks, false );
    });
    _media.listen( "mediaplay", function() {
      _tracksContainer.element.removeEventListener( "scroll", drawTicks, false );
    });
    _tracksContainer.element.addEventListener( "scroll", drawTicks, false );

    this.update = function() {
      drawTicks();
    };

    this.enable = function() {
      _canvas.addEventListener( "mousedown", _scrubber.onMouseDown, false );
      _scrubber.enable();
    };

    this.disable = function() {
      _canvas.removeEventListener( "mousedown", _scrubber.onMouseDown, false );
      _scrubber.disable();
    };

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
