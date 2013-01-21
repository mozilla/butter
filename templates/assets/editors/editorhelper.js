(function( global, $ ) {
  var plugins = {},
      MAX_IMAGE_WIDTH = 1280,
      MAX_IMAGE_HEIGHT = 740;

  var EditorHelper = function() {
    throw "Do not use EditorHelper in this manner. Use EditorHelper.init instead.";
  };

  // This fix is to ensure content-editable still updates correctly, and deals with ie9 not reading document.activeElement properly
  function blurActiveEl() {
   if ( document.activeElement ) {
      document.activeElement.blur();
    }
  }

  function calculateFinalPositions( event, ui, trackEvent, targetContainer, container, options ) {
    var target = targetContainer.getBoundingClientRect(),
        cont = container.getBoundingClientRect(),
        height = cont.height,
        width = cont.width,
        top = ui.position.top,
        left = ui.position.left,
        targetHeight = target.height,
        targetWidth = target.width,
        minHeightPix = targetHeight * ( ( options.minHeight || 0 ) / 100 ),
        minWidthPix = targetWidth * ( ( options.minWidth || 0 ) / 100 );

    top = Math.max( 0, top );
    left = Math.max( 0, left );
    height = Math.max( minHeightPix, height );
    width = Math.max( minWidthPix, width );

    if ( ( container.offsetTop + height ) > targetHeight ) {
      top = targetHeight - height;
    }

    if ( ( container.offsetLeft + width ) > targetWidth ) {
      left = targetWidth - width;
    }

    height = ( height / targetHeight ) * 100;
    width = ( width / targetWidth ) * 100;

    if ( options.end ) {
      options.end();
    }

    blurActiveEl();

    trackEvent.update({
      height: height,
      width: width,
      top: ( top / targetHeight ) * 100,
      left: ( left / targetWidth ) * 100
    });
  }

  EditorHelper.init = function( butter ) {

    /**
     * Member: draggable
     *
     * Makes a container draggable using jQueryUI
     *
     * @param {TrackEvent} trackEvent: The trackEvent to update when position changes
     * @param {DOMElement} dragContainer: the container which to apply draggable to
     * @param {media} The current media's target element in Butter ( parent container )
     * @param {Object} extra options to apply to the draggable call
     *                 Options are:
     *                    {DOMElement} handle: Restrict drag start event to this element
     *                    {Function} start: Function to execute on drag start event
     *                    {Function} end: Fucntion to execute on drag end event
     */
    global.EditorHelper.draggable = function( trackEvent, dragContainer, targetContainer, options ) {
      var iframeCover = targetContainer.querySelector( ".butter-iframe-fix" );

      options = options || {};

      function createHelper( suffix ) {
        var el = document.createElement( "div" );
        el.classList.add( "ui-draggable-handle" );
        el.classList.add( "ui-draggable-" + suffix );
        return el;
      }

      dragContainer.appendChild( createHelper( "top" ) );
      dragContainer.appendChild( createHelper( "bottom" ) );
      dragContainer.appendChild( createHelper( "left" ) );
      dragContainer.appendChild( createHelper( "right" ) );
      dragContainer.appendChild( createHelper( "grip" ) );

      $( dragContainer ).draggable({
        handle: ".ui-draggable-handle",
        containment: "parent",
        start: function() {
          iframeCover.style.display = "block";

          // Open the editor
          butter.editor.editTrackEvent( trackEvent );

          if ( options.start ) {
            options.start();
          }
        },
        stop: function( event, ui ) {
          iframeCover.style.display = "none";

          calculateFinalPositions( event, ui, trackEvent, targetContainer, dragContainer, options );
        }
      });
    };

    /**
     * Member: resizable
     *
     * Makes a container resizable using jQueryUI
     *
     * @param {TrackEvent} trackEvent: The trackEvent to update when size changes
     * @param {DOMElement} resizeContainer: the container which to apply resizable to
     * @param {media} The current media's target element in Butter ( parent container )
     * @param {Object} extra options to apply to the resizeable call
     *                 Options are:
     *                    {String} handlePositions: describes where to position resize handles ( i.e. "n,s,e,w" )
     *                    {Function} start: Function to execute on resize start event
     *                    {Function} end: Fucntion to execute on resize end event
     *                    {Number} minWidth: Minimum width that the resizeContainer should be
     *                    {Number} minHeight: Minimum height that the resizeContainer should be
     */
    global.EditorHelper.resizable = function( trackEvent, resizeContainer, targetContainer, options ) {
      var iframeCover = targetContainer.querySelector( ".butter-iframe-fix" );

      options = options || {};

      $( resizeContainer ).resizable({
        handles: options.handlePositions,
        start: function() {
          iframeCover.style.display = "block";

          // Open the editor
          butter.editor.editTrackEvent( trackEvent );

          if ( options.start ) {
            options.start();
          }
        },
        containment: "parent",
        stop: function( event, ui ) {
          iframeCover.style.display = "none";

          calculateFinalPositions( event, ui, trackEvent, targetContainer, resizeContainer, options );
        }
      });
    };

    /**
     * Member: contentEditable
     *
     * Makes a container's content editable using contenteditable
     *
     * @param {TrackEvent} trackEvent: The trackEvent to update when content changes
     * @param {DOMElement} contentContainer: the container which to listen for changes and set as editable
     */
    global.EditorHelper.contentEditable = function( trackEvent, contentContainers ) {
      var newText = "",
          contentContainer,
          updateText,
          updateTrackEvent,
          onBlur,
          onKeyDown,
          onMouseDown;

      updateText = function() {
        newText = "";
        for ( var i = 0, l = contentContainers.length; i < l; i++ ) {
          contentContainer = contentContainers[ i ];
          contentContainer.innerHTML = contentContainer.innerHTML.replace( /<br>/g, "\n" );
          newText += contentContainer.textContent;
          if ( i < l - 1 ) {
            newText += "\n";
          }
        }
      };
      updateTrackEvent = function() {
        blurActiveEl();
        trackEvent.update({
          text: newText
        });
      };
      onBlur = function() {
        // store the new text.
        updateText();
        // update the text after any existing events are done.
        // this way we do not revert any other event's changes.
        setTimeout( updateTrackEvent, 0 );
      };
      onKeyDown = function( e ) {
        // enter key for an update.
        // shift + enter for newline.
        if ( !e.shiftKey && e.keyCode === 13 ) {
          updateText();
          updateTrackEvent();
        }
      };
      onMouseDown = function( e ) {
        e.stopPropagation();

        // Open the editor
        butter.editor.editTrackEvent( trackEvent );

        $( contentContainer ).draggable( "destroy" );
      };

      for ( var i = 0, l = contentContainers.length; i < l; i++ ) {
        contentContainer = contentContainers[ i ];
        if ( contentContainer ) {
          contentContainer.addEventListener( "blur", onBlur, false );
          contentContainer.addEventListener( "keydown", onKeyDown, false );
          contentContainer.addEventListener( "mousedown", onMouseDown, false );
          contentContainer.setAttribute( "contenteditable", "true" );
        }
      }
    };

    var mimeTypeMapping = {
      "image/gif": "image/png",
      "image/jpeg": "image/jpeg",
      "image/png": "image/png"
    };

    /**
     * Member: droppable
     *
     * Make a container listen for drop events for loading images from a local machine
     *
     * @param {TrackEvent} trackEvent: The trackEvent to update when content changes
     * @param {DOMElement} dropContainer: The container that listens for the drop events
     */

    global.EditorHelper.droppable = function( trackEvent, dropContainer ) {
      dropContainer.addEventListener( "dragover", function( e ) {
        e.preventDefault();
        dropContainer.classList.add( "butter-dragover" );
      }, false );

      dropContainer.addEventListener( "dragleave", function( e ) {
        e.preventDefault();
        dropContainer.classList.remove( "butter-dragover" );
      }, false );

      dropContainer.addEventListener( "mousedown", function( e ) {
        // Prevent being able to drag the images inside and re drop them
        e.preventDefault();
      }, false );

      dropContainer.addEventListener( "drop", function( e ) {
        var file, imgSrc, imgURI, image, div;

        e.preventDefault();
        e.stopPropagation();

        dropContainer.classList.remove( "butter-dragover" );

        if ( !e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files[ 0 ] ) {
          butter.dispatch( "droppable-unsupported" );
          return;
        }

        file = e.dataTransfer.files[ 0 ];

        if ( window.URL && window.URL.createObjectURL ) {
          imgSrc = window.URL.createObjectURL( file );
        } else if ( window.webkitURL && window.webkitURL.createObjectURL ) {
          imgSrc = window.webkitURL.createObjectURL( file );
        } else {
          butter.dispatch( "droppable-unsupported" );
        }

        // So yeah, Opera has the functionality namespaced but all it currently does is:
        // window.URL.createObjectURL = function(obj) {
        //   return obj;
        // };
        if ( imgSrc === file ) {
          butter.dispatch( "droppable-unsupported" );
          return;
        } else {

          image = document.createElement( "img" );
          image.onload = function() {
            var width = this.width,
                height = this.height,
                wRatio, hRatio, resizeRatio,
                scaledWidth, scaledHeight,
                canvas = document.createElement( "canvas" ),
                context;

            // Fit image nicely into our largest embed size, using
            // the longest side and aspect ratio. Inspired by:
            // http://stackoverflow.com/questions/7863653/algorithm-to-resize-image-and-maintain-aspect-ratio-to-fit-iphone
            if ( width >= height ) {
              if ( width <= MAX_IMAGE_WIDTH && height <= MAX_IMAGE_HEIGHT ) {
                scaledWidth = width;
                scaledHeight = height;
              } else {
                wRatio = MAX_IMAGE_WIDTH / width;
                hRatio = MAX_IMAGE_HEIGHT / height;
                resizeRatio = Math.min( wRatio, hRatio );
                scaledHeight = height * resizeRatio;
                scaledWidth = width * resizeRatio;
              }
            } else {
              if ( height <= MAX_IMAGE_WIDTH && width <= MAX_IMAGE_HEIGHT ) {
                scaledWidth = width;
                scaledHeight = height;
              } else {
                wRatio = MAX_IMAGE_HEIGHT / width;
                hRatio = MAX_IMAGE_WIDTH / height;
                resizeRatio = Math.min( wRatio, hRatio );
                scaledHeight = height * resizeRatio;
                scaledWidth = width * resizeRatio;
              }
            }

            canvas.width = scaledWidth;
            canvas.height = scaledHeight;
            context = canvas.getContext( "2d" );
            context.drawImage( this, 0, 0, scaledWidth, scaledHeight );

            // If we can't reasonably convert whatever they're dropping on us then bail
            var exportAs = mimeTypeMapping[ file.type ];
            if ( !exportAs ) {
              butter.dispatch( "droppable-unsupported" );
              return;
            }

            imgURI = canvas.toDataURL( exportAs );

            // If the browser's canvas impl. doesn't support whatever we requested then bail
            if ( imgURI.indexOf( exportAs ) === -1 ) {
              butter.dispatch( "droppable-unsupported" );
              return;
            }

            trackEvent.update( { src: imgURI } );

            if ( window.URL && window.URL.revokeObjectURL ) {
              window.URL.revokeObjectURL( imgSrc );
            } else if ( window.webkitURL && window.webkitURL.revokeObjectURL ) {
              window.webkitURL.revokeObjectURL( imgSrc );
            }
          };
          image.src = imgSrc;

          // Open the editor
          butter.editor.editTrackEvent( trackEvent );

          // Force image to download, esp. Opera. We can't use
          // "display: none", since that makes it invisible, and
          // thus not load.  Opera also requires the image be
          // in the DOM before it will load.
          div = document.createElement( "div" );
          div.setAttribute( "data-butter-exclude", "true" );
          div.className = "butter-image-preload";
          div.appendChild( image );
          document.body.appendChild( div );
        }
      }, false );
    };

    function _updateFunction( e ) {

      var trackEvent = e.target;

      if ( trackEvent.popcornTrackEvent && plugins[ trackEvent.type ] ) {
        plugins[ trackEvent.type ]( trackEvent, butter.currentMedia.popcorn.popcorn );
      }
    } //updateFunction

    butter.listen( "trackeventupdated", _updateFunction );
  };

  EditorHelper.addPlugin = function( plugin, callback ) {
    plugins[ plugin ] = callback;
  };

  global.EditorHelper = EditorHelper;

}( window, window.jQuery ));
