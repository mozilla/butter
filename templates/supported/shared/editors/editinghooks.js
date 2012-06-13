(function( Butter, $ ) {
  Butter.editorHelper = function( butter, popcorn ) {
    console.log( Butter, $ );
  // EDITING HOOKS
    function _updateFunction( e ) {

      var trackEvent,
          _container,
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

      _popcornOptions = trackEvent.popcornTrackEvent;
      _container = _popcornOptions._container;
      console.log( _container );

     

      if ( trackEvent.type === "photo" ) {
         if( !_container ) {
          return false;
        }
        // Prevent default draggable behaviour of images
        trackEvent.popcornTrackEvent._image.addEventListener( "mousedown", function( e ) {
          e.preventDefault();
        }, false);

        //Change default text to indicate draggable
        if( !_popcornOptions.src && window.$ ){
          _container.innerHTML = "<span>Drag an image from your desktop</span>";
        }

        //Apply resizable/draggable if jQuery exists
        if( $ ) {
          $( _container ).resizable({
            stop: function( event, ui ) {
              _container.style.border = "";
              trackEvent.update({
                height: ui.size.height,
                width: ui.size.width
              });
            }
          }).draggable({
            stop: function( event, ui ) {
              trackEvent.update({
                top: ui.position.top,
                left: ui.position.left
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
          image.onload = function() {
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
      else if( trackEvent.type === "zoink" ) {
        _container.addEventListener( "dblclick", function( e ){

          textEls = _container.querySelectorAll( ".text" );
          editor.makeContentEditable( textEls );
          if( $ ) {
            $( _container ).draggable( "disable" );
          }
        });
        if( $ ) { 
          $( _container ).draggable({
            stop: function(event, ui) {
                trackEvent.update( { top: ui.position.top, left: ui.position.left } );
            }
          });
        }
      }//zoink
    } //updateFunction

    // Add listeners for future track events.
    butter.listen( "trackeventadded", _updateFunction );
    butter.listen( "trackeventupdated", _updateFunction );
  }
}( window.Butter, window.jQuery ));
