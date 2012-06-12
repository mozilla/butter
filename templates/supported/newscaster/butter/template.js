/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

document.addEventListener( "DOMContentLoaded", function( e ) {
  (function( Butter, $ ) {
    Butter({
      config: "butter/config.json",
      ready: function( butter ){
        var media = butter.media[ 0 ],
            popcorn = butter.media[ 0 ].popcorn.popcorn;

        function start(){
          media.addTrack( "Track1" );
          media.addTrack();
          media.addTrack();

          butter.tracks[ 0 ].addTrackEvent({
            type: "text",
            popcornOptions: {
              start: 0,
              end: 1,
              text: "This is a test.",
              target: "Area1"
            }
          });

          // EDITING HOOKS
          function updateFunction( e ) {

            var trackEvent,
                _container = null,
                _textEls,
                _popcornOptions,
                _canvas = document.createElement( "canvas" ),
                _context,
                _dropTarget;

            if ( e.type === "trackeventadded" ) {
              trackEvent = e.data;
            } else if ( e.type === "trackeventupdated" ) {
              trackEvent = e.target;
            } else {
              trackEvent = e;
            }

            _popcornOptions = trackEvent.popcornOptions;

            // Requires _container in options to work.
            // This will be better when track events store a reference to popcorn in Butter, but it's ok for now.
            trackEvent.popcornTrackEvent = popcorn.getTrackEvent( popcorn.getLastTrackEventId() ); //Store a reference
            _container = trackEvent.popcornTrackEvent._container;
            if ( !_container ) {
              return;
            }

            if ( trackEvent.type === "photo" ) {
              // Prevent default draggable behaviour of images
              trackEvent.popcornTrackEvent._image.addEventListener( "mousedown", function( e ) {
                e.preventDefault();
              }, false);

              //Change default text to indicate draggable
              if( !_popcornOptions.src && window.$ ){
                _container.innerHTML = "Drag an image from your desktop";
              }

              //Apply resizable/draggable if jQuery exists

              if( $ ) {
                $( _container ).resizable({
                  stop: function( event, ui ) {
                    _container.style.border = "";
                    trackEvent.update({
                      height: ui.size.height + "px",
                      width: ui.size.width + "px"
                    });
                  }
                }).draggable({
                  stop: function( event, ui ) {
                    trackEvent.update({ 
                      top: ui.position.top + "px",
                      left: ui.position.left + "px"
                    });
                  }
                });
              }

              _dropTarget = _container;

              _dropTarget.addEventListener( "dragover", function( e ) {
                e.preventDefault();
                _dropTarget.className = "dragover";
              }, false);

              _dropTarget.addEventListener( "dragleave", function( e ) {
                e.preventDefault();
                _dropTarget.className = "";
              }, false);

              _dropTarget.addEventListener( "drop", function( e ) {
                _dropTarget.className = "dropped";
                e.preventDefault();
                var file = e.dataTransfer.files[ 0 ],
                    imgSrc,
                    image,
                    imgURI;

                if ( !file ) {
                  return;
                }

                if ( window.URL ) {
                  imgSrc = window.URL.createObjectURL( file );
                } else if ( window.webkitURL ) {
                  imgSrc = window.webkitURL.createObjectURL( file );
                }

                image = document.createElement( "img" );
                image.onload = function () {
                    _canvas.width = this.width;
                    _canvas.height = this.height;
                    _context = _canvas.getContext( "2d" );
                    _context.drawImage( this, 0, 0, this.width, this.height );
                    imgURI = _canvas.toDataURL();
                    trackEvent.update( { src: imgURI } );
                };
                image.src = imgSrc;
              }, false);
            } //image
          } //updateFunction

          // Would be good if these were part of a library in shared, instead of existing here.
          // Should be updated to a hook syntax like hook("photo", myUpdateFunction) or something
          // Add listeners for future track events.
          butter.listen( "trackeventadded", updateFunction );
          butter.listen( "trackeventupdated", updateFunction );

        } //start

        media.onReady( start );
      }
    }); //Butter

  }( window.Butter, window.jQuery ));
}, false );
