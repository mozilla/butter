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
      _setup: function( options ) {
        var img,
            target = document.getElementById( options.target ),
            context = this;

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
          options._container.style.overflow = "hidden";


        if ( !target && Popcorn.plugin.debug ) {
          target = context.media.parentNode;
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

      start: function( event, options ) {
        options._container.style.display = "block";
      },

      end: function( event, options ) {
        options._container.style.display = "none";
      },
      _teardown: function( options ) {
        document.getElementById( options.target ) && document.getElementById( options.target ).removeChild( options._container );
      }
  });
})( Popcorn );
