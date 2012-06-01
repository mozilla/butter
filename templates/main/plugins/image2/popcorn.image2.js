// PLUGIN: IMAGE

(function ( Popcorn ) {

/**
 * Images popcorn plug-in
 * Shows an image element
 * Options parameter will need a start, end, href, target and src.
 * Start is the time that you want this plug-in to execute
 * End is the time that you want this plug-in to stop executing
 * href is the url of the destination of a anchor - optional
 * Target is the id of the document element that the iframe needs to be attached to,
 * this target element must exist on the DOM
 * Src is the url of the image that you want to display
 * text is the overlayed text on the image - optional
 *
 * @param {Object} options
 *
 * Example:
   var p = Popcorn('#video')
      .image({
        start: 5, // seconds
        end: 15, // seconds
        href: 'http://www.drumbeat.org/',
        src: 'http://www.drumbeat.org/sites/default/files/domain-2/drumbeat_logo.png',
        text: 'DRUMBEAT',
        target: 'imagediv'
      } )
 *
 */
  Popcorn.plugin( "image2", {
      manifest: {
        about: {
          name: "Popcorn image Plugin",
          version: "0.1",
          author: "Scott Downe. Modified by k88hudson",
          website: "http://scottdowne.wordpress.com/"
        },
        options: {
          start: {
            elem: "input",
            type: "number",
            label: "In",
            hidden: true
          },
          end: {
            elem: "input",
            type: "number",
            label: "Out",
            hidden: true
          },
          imageType: {
            elem: "select",
            options: [ "yes", "no" ],
            label: "Use URL?",
            "default": "yes"
          },
          src: {
            elem: "input",
            type: "url",
            label: "Source URL",
          },
          width: {
            elem: "input",
            type: "text",
            label: "Width",
            "default": "150px"
          },
          height: {
            elem: "input",
            type: "text",
            label: "Height",
            "default": "150px",
            hidden: true
          },
          top: {
            elem: "input",
            type: "text",
            label: "Top",
            "default": "0",
            hidden: true
          },
          left: {
            elem: "input",
            type: "text",
            label: "Left",
            "default": "0",
            hidden: true
          },
          text: {
            elem: "input",
            type: "text",
            label: "Text",
            optional: true,
            hidden: true
          },
          href: {
            elem: "input",
            type: "url",
            label: "Link URL",
            optional: true
          },
          target: "video-overlay"
        }
      },
      _setup: function( options ) {
        var img,
            target = document.getElementById( options.target );

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
          options._container.style.width = options.width;
          options._container.style.height = options.height;
          options._container.style.top = options.top;
          options._container.style.left = options.left;


        if ( !target && Popcorn.plugin.debug ) {
          throw new Error( "target container doesn't exist" );
        }
        // add the widget's div to the target div
        target && target.appendChild( options._container );

        //Is the source defined?
        if( options.src ) {
          img = document.createElement( "img" );
          img.addEventListener( "load", function() {

            var fontHeight, divText;
            img.style.borderStyle = "none";
            img.style.width = "100%";

            options._container.appendChild( img );

            // If display text was provided, display it:
            if ( options.text ) {
              fontHeight = ( img.height / 12 ) + "px";
              divText = document.createElement( "div" );

              Popcorn.extend( divText.style, {
                color: "black",
                fontSize: fontHeight,
                fontWeight: "bold",
                position: "relative",
                textAlign: "center",
                width: img.style.width || img.width + "px",
                zIndex: "10"
              });

              divText.innerHTML = options.text || "";

              divText.style.top = ( ( img.style.height.replace( "px", "" ) || img.height ) / 2 ) - ( divText.offsetHeight / 2 ) + "px";
              options._container.insertBefore( divText, img );
            }
          }, false );

          img.src = options.src;
        } else {
          options._container.style.border = "2px dashed #CCC";
          img = document.createElement( "div" );
          img.style.color = "red"
          img.style.height = "100%"
          img.style.width = "100%"
          img.innerHTML = "No image..."
          options._container.appendChild( img );
        }

        //Export
        options._image = img;
      },

      /**
       * @member image
       * The start function will be executed when the currentTime
       * of the video  reaches the start time provided by the
       * options variable
       */
      start: function( event, options ) {
        options._container.style.display = "block";
      },
      /**
       * @member image
       * The end function will be executed when the currentTime
       * of the video  reaches the end time provided by the
       * options variable
       */
      end: function( event, options ) {
        options._container.style.display = "none";
      },
      _teardown: function( options ) {
        document.getElementById( options.target ) && document.getElementById( options.target ).removeChild( options._container );
      }
  });
})( Popcorn );
