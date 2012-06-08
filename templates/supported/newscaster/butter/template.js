/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */
document.addEventListener( "DOMContentLoaded", function( e ){

  Butter({
    config: "butter/config.json",
    ready: function( butter ){
      var media = butter.media[ 0 ],
          popcorn = butter.media[ 0 ].popcorn.popcorn;

      function start(){
        media.addTrack( "Track1" );
        media.addTrack();
        media.addTrack();

        butter.tracks[0].addTrackEvent({
          type: "text",
          popcornOptions: {
            start: 0,
            end: 1,
            text: "This is a test.",
            target: "Area1"
          }
        });

        // EDITING HOOKS
        // Would be good if these were part of a library in shared, instead of existing here.
        // Should be updated to a hook syntax like hook("image2", myUpdateFunction) or something
        // Add listeners for future track events.
          butter.listen("trackeventadded", updateFunction);
          butter.listen("trackeventupdated", updateFunction);

        function updateFunction(e) {

          var trackEvent,
              _container = null,
              _textEls,
              _popcornOptions,
              canvas = document.createElement( "canvas" ),
              context,
              dropTarget,
              field;

          if (e.type==="trackeventadded") { 
            trackEvent = e.data; 
          } else if (e.type==="trackeventupdated") { 
            trackEvent = e.target; 
          } else { 
            trackEvent = e; 
          }

          _popcornOptions = trackEvent.popcornOptions;

          // Requires _container in options to work.
          // This will be better when track events store a reference to popcorn in Butter, but it's ok for now.
          trackEvent.popcornTrackEvent = popcorn.getTrackEvent( popcorn.getLastTrackEventId() ); //Store a reference
          _container = trackEvent.popcornTrackEvent._container;
          if (!_container ) { 
            return; 
          }

          if ( trackEvent.type === "image2" ) {
            // Prevent default draggable behaviour of images
            trackEvent.popcornTrackEvent._image.addEventListener( "mousedown", function(e) {
              e.preventDefault();
            }, false);

            //Change default text to indicate draggable
            if( !_popcornOptions.src && window.$ ){
              _container.innerHTML = "Drag an image from your desktop";
            }

            //Apply resizable/draggable if jQuery exists
            window.$ && $( _container ).resizable({
              stop: function(event, ui) {
                _container.style.border = "";
                trackEvent.update({ height: ui.size.height + "px", width: ui.size.width + "px" })
              }
            }).draggable({
              stop: function(event, ui) {
                trackEvent.update({top: ui.position.top + "px", left: ui.position.left + "px" });
              }
            });

            /* Drag and drop DataURI */
            canvas.id = "grabimage";
            canvas.style.display = "none";

            dropTarget = _container;

            dropTarget.addEventListener( "dragover", function( e ) {
              e.preventDefault();
              dropTarget.className = "dragover";
            }, false);

            dropTarget.addEventListener( "dragleave", function( e ) {
              e.preventDefault();
              dropTarget.className = "";
            }, false);

            dropTarget.addEventListener( 'drop', function( e ) {
              dropTarget.className = "dropped";
              e.preventDefault();
              var file = event.dataTransfer.files[ 0 ],
                  imgSrc,
                  image,
                  imgURI;

              if ( !file ) { return; }

              if ( window.URL ) { 
                imgSrc = window.URL.createObjectURL( file );
              } else if ( window.webkitURL ) {
                imgSrc = window.webkitURL.createObjectURL( file );
              }

              image = document.createElement( 'img' );
              image.onload = function () {
                  canvas.width = this.width;
                  canvas.height = this.height;
                  context = canvas.getContext( '2d' );
                  context.drawImage( this, 0, 0, this.width, this.height );
                  imgURI = canvas.toDataURL();  
                  trackEvent.update( { src: imgURI, isURL: false } );
              };
              image.src = imgSrc;
            }, false);
          } //image2
        } //updateFunction
    
      } //start

      media.onReady( start );
    }
  }); //Butter

}, false );
