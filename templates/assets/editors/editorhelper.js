(function( global, $ ) {
  var plugins = {},
      MAX_IMAGE_WIDTH = 1280,
      MAX_IMAGE_HEIGHT = 740;

  var EditorHelper = function() {
    throw "Do not use EditorHelper in this mannger. Use EditorHelper.init instead.";
  };

  // This fix is to ensure content-editable still updates correctly, and deals with ie9 not reading document.activeElement properly
  function blurActiveEl() {
   if ( document.activeElement ) {
      document.activeElement.blur();
    }
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
    global.EditorHelper.draggable = function( trackEvent, dragContainer, mediaContainer, options ) {
      var iframeVideo = mediaContainer.querySelector( "iframe" ),
          media;

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
          if ( iframeVideo ) {
            iframeVideo.style.pointerEvents = "none";
          }

          if ( options.start ) {
            options.start();
          }
        },
        stop: function( event, ui ) {

          var top = ui.position.top,
              left = ui.position.left;

          media = mediaContainer.getBoundingClientRect();
          
          if ( options.end ) {
            options.end();
          }

          if ( top < 0 ) {
            top = 0;
          }

          if ( left < 0 ) {
            left = 0;
          }

          blurActiveEl();

          trackEvent.update({
            top: ( top / media.height ) * 100,
            left: ( left / media.width ) * 100
          });
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
    global.EditorHelper.resizable = function( trackEvent, resizeContainer, mediaContainer, options ) {
      var iframeVideo = mediaContainer.querySelector( "iframe" );

      options = options || {};

      $( resizeContainer ).resizable({
        handles: options.handlePositions,
        start: function() {
          if ( iframeVideo ) {
            iframeVideo.style.pointerEvents = "none";
          }

          if ( options.start ) {
            options.start();
          }
        },
        containment: "parent",
        stop: function( event, ui ) {
          var media = mediaContainer.getBoundingClientRect(),
              height = ( ui.size.height + resizeContainer.offsetTop ) <= media.height ? ui.size.height : media.height - resizeContainer.offsetTop,
              width = ( ui.size.width + resizeContainer.offsetLeft ) <= media.width ? ui.size.width : media.width - resizeContainer.offsetLeft,
              top = ( ui.position.top / media.height ) * 100,
              left = ( ui.position.left / media.width ) * 100;

          if ( iframeVideo ) {
            iframeVideo.style.pointerEvents = "auto";
          }

          if ( options.end ) {
            options.end();
          }

          height = ( height / media.height ) * 100;
          width = ( width / media.width ) * 100;
          height = height >= options.minHeight ? height : options.minHeight;
          width = width >= options.minWidth ? width : options.minWidth;

          blurActiveEl();

          trackEvent.update({
            height: height,
            width: width,
            top: top,
            left: left
          });
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
      onBlur = function( e ) {
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

      dropContainer.addEventListener( "drop", function( e ) {
        var file, imgSrc, imgURI, image, div;

        e.preventDefault();
        e.stopPropagation();

        dropContainer.classList.add( "butter-dropped" );

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

            imgURI = canvas.toDataURL();
            trackEvent.update( { src: imgURI } );

            if ( window.URL && window.URL.revokeObjectURL ) {
              window.URL.revokeObjectURL( imgSrc );
            } else if ( window.webkitURL && window.webkitURL.revokeObjectURL ) {
              window.webkitURL.revokeObjectURL( imgSrc );
            }
          };
          image.src = imgSrc;

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

      var _trackEvent;

      if ( e.type === "trackeventadded" ) {
        _trackEvent = e.data;
      } else if ( e.type === "trackeventupdated" ) {
        _trackEvent = e.target;
      }

      if ( plugins[ _trackEvent.type ] ) {
        plugins[ _trackEvent.type ]( _trackEvent, butter.currentMedia.popcorn.popcorn );
      }
    } //updateFunction

    butter.listen( "trackeventadded", _updateFunction );
    butter.listen( "trackeventupdated", _updateFunction );
  };

  EditorHelper.addPlugin = function( plugin, callback ) {
    plugins[ plugin ] = callback;
  };

  global.EditorHelper = EditorHelper;

}( window, window.jQuery ));
