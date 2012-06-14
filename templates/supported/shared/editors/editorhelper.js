(function( global, $ ) {
    global.EditorHelper = function( butter, popcorn ) {

      function _updateFunction( e ) {

        var _trackEvent,
            _container,
            _textEls,
            _popcornOptions,
            _canvas = document.createElement( "canvas" ),
            _context;

        if ( e.type === "trackeventadded" ) {
          _trackEvent = e.data;
        } else if ( e.type === "trackeventupdated" ) {
          _trackEvent = e.target;
        } else {
          _trackEvent = e;
        }

        _popcornOptions = _trackEvent.popcornTrackEvent;
        _container = _popcornOptions._container;

        if ( _trackEvent.type === "photo" ) {
           if( !_container ) {
            return false;
          }
          // Prevent default draggable behaviour of images
          _trackEvent.popcornTrackEvent._image.addEventListener( "mousedown", function( e ) {
            e.preventDefault();
          }, false);

          //Apply resizable/draggable if jQuery exists
          if( $ ) {
            
            //Change default text to indicate draggable
            if( !_popcornOptions.src ){
              _container.innerHTML = "<span>Drag an image from your desktop</span>";
            }

            $( _container ).resizable({
              stop: function( event, ui ) {
                _container.style.border = "";
                _trackEvent.update({
                  height: ui.size.height,
                  width: ui.size.width
                });
              }
            }).draggable({
              stop: function( event, ui ) {
                _trackEvent.update({
                  top: ui.position.top,
                  left: ui.position.left
                });
              }
            });
          }

          _container.addEventListener( "dragover", function( e ) {
            e.preventDefault();
            _container.classList.add( "butter-dragover" );
          }, false);

          _container.addEventListener( "dragleave", function( e ) {
            e.preventDefault();
            _container.classList.remove( "butter-dragover" );
          }, false);

          _container.addEventListener( "drop", function( e ) {
            _container.classList.add( "butter-dropped" );
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
              _trackEvent.update( { src: imgURI } );
            };
            image.src = imgSrc;
          }, false);
        } //image
        else if( _trackEvent.type === "zoink" && $ ) {

          $( _container ).draggable({
            stop: function( event, ui ) {
              _trackEvent.update( { top: ui.position.top, left: ui.position.left } );
            }
          });

        } //zoink
      } //updateFunction

      butter.unlisten( "trackeventadded", _updateFunction );
      butter.unlisten( "trackeventupdated", _updateFunction );

      butter.listen( "trackeventadded", _updateFunction );
      butter.listen( "trackeventupdated", _updateFunction );

    };
  })( window, window.jQuery );
