// PLUGIN: PHOTO

(function ( Popcorn ) {

  Popcorn.plugin( "photo", {
      manifest: {
        about: {
          name: "Popcorn image Plugin",
          version: "0.1",
          author: "Scott Downe. Modified by k88hudson",
          website: "http://scottdowne.wordpress.com/"
        },
        options: {
          target: "video-overlay",
          src: {
            elem: "input",
            type: "url",
            label: "Source URL",
          },
          href: {
            elem: "input",
            type: "url",
            label: "Link URL",
            optional: true
          },
          width: {
            elem: "input",
            type: "number",
            label: "Width",
            "default": 150
          },
          height: {
            elem: "input",
            type: "number",
            label: "Height",
            "default": 150
          },
          top: {
            elem: "input",
            type: "number",
            label: "Top",
            "default": 100
          },
          left: {
            elem: "input",
            type: "number",
            label: "Left",
            "default": 200
          },
          start: {
            elem: "input",
            type: "number",
            label: "In"
          },
          end: {
            elem: "input",
            type: "number",
            label: "Out"
          }
        }
      },
      _dragSetup: function( options, callback ) {
        var _popcornOptions = options.popcornTrackEvent,
            _image = _popcornOptions._image,
            _container = _popcornOptions._container,
            _canvas = document.createElement( "canvas" );

        //Prevent default draggable behaviour of images
        _image.addEventListener( "mousedown", function( e ) {
          e.preventDefault();
        }, false );

        if ( !_popcornOptions.src ) {
          _container.innerHTML = "<span>Drag an image from your desktop</span>";
        }

        _container.addEventListener( "dragover", function( e ) {
          e.preventDefault();
          _container.classList.add( "butter-dragover" );
        }, false );

        _container.addEventListener( "dragleave", function( e ) {
          e.preventDefault();
          _container.classList.remove( "butter-dragover" );
        }, false );

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
            options.update( { src: imgURI } );
          };
          image.src = imgSrc;
        }, false );

        if ( callback ) {
          callback();
        }
      },
      onDragEnd: function( event, ui, trackevent ) {
        trackevent.update({
          top: ui.position.top,
          left: ui.position.left
        });
      },
      _resizeSetup: function( options, callback ) {
        if ( callback ) {
          callback();
        }
      },
      onResizeEnd: function( event, ui, trackevent ) {
        var _container = trackevent.popcornTrackEvent._container;

        _container.style.border = "";
        trackevent.update({
          height: ui.size.height,
          width: ui.size.width
        });
      },
      _setup: function( options ) {
        var img,
            target = document.getElementById( options.target ),
            context = this,
            innerDiv = document.createElement( "div" );

        if( options.href ) {
          options._container = document.createElement( "a" );
          options._container.style.textDecoration = "none";
          options._container.href = options.href || options.src || "#";
          options._container.target = "_blank";
        } else {
          options._container = document.createElement( "div" );
        }
          options._container.style.position = "absolute";
          options._container.style.display = "none";
          options._container.style.width = options.width + "px";
          options._container.style.height = options.height + "px";
          options._container.style.top = options.top + "px";
          options._container.style.left = options.left + "px";

        if ( !target && Popcorn.plugin.debug ) {
          target = context.media.parentNode;
        }

        //Cache a reference
        options._target = target;
        target && target.appendChild( options._container );

        //Allows cropping of the image by setting container height
        innerDiv.style.overflow = "hidden";
        innerDiv.style.height = "100%";

        //Is the source defined?
        if( options.src ) {
          img = document.createElement( "img" );
          img.addEventListener( "load", function() {

            var fontHeight, divText;
            img.style.borderStyle = "none";
            img.style.width = "100%";

            innerDiv.appendChild( img );
            options._container.appendChild( innerDiv );

          }, false );

          img.src = options.src;
        } else {
          img = document.createElement( "div" );
          img.style.height = "100%";
          img.style.width = "100%";
          img.innerHTML = "No image...";

          innerDiv.appendChild( img );
          options._container.appendChild( innerDiv );
        }

        //Export
        options._image = img;
      },

      start: function( event, options ) {
        options._container.style.display = "block";
      },

      end: function( event, options ) {
        options._container.style.display = "none";
      },
      
      _teardown: function( options ) {
        options._target && options._target.removeChild( options._container );
      }
  });
})( Popcorn );
