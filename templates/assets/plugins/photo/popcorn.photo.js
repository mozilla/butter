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
            "default": 20
          },
          height: {
            elem: "input",
            type: "number",
            label: "Height",
            "default": 15
          },
          top: {
            elem: "input",
            type: "number",
            label: "Top",
            "default": 5
          },
          left: {
            elem: "input",
            type: "number",
            label: "Left",
            "default": 5
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
          options._container.style.width = options.width + "%";
          options._container.style.height = options.height + "%";
          options._container.style.top = options.top + "%";
          options._container.style.left = options.left + "%";

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

        options.toString = function() {
          var string = options.src || options._natives.manifest.options.src[ "default" ] || "Photo",
              match = string.replace( /.*\//g, "" );
          return match.length ? match : string;
        };
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
