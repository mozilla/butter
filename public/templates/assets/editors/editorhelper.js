(function( global, $ ) {
  var plugins = {};

  var EditorHelper = function() {
    throw "Do not use EditorHelper in this manner. Use EditorHelper.init instead.";
  };

  // This fix is to ensure content-editable still updates correctly, and deals with ie9 not reading document.activeElement properly
  function blurActiveEl() {
   if ( document.activeElement && document.activeElement.blur ) {
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

    // Enforce container size here, instead of relying on the update.
    container.style.width = width + "%";
    container.style.height = height + "%";

    blurActiveEl();

    trackEvent.update({
      height: height,
      width: width,
      top: ( top / targetHeight ) * 100,
      left: ( left / targetWidth ) * 100
    });
  }

  EditorHelper.init = function( butter ) {

    require( [ "util/xhr" ], function( XHR ) {
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
        if ( $( dragContainer ).data( "draggable" ) ) {
          return;
        }

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
       *                              - Recommended that this option is specified due to a bug in z-indexing with
       *                                jQueryUI Resizable.
       *                    {Function} start: Function to execute on resize start event
       *                    {Function} end: Fucntion to execute on resize end event
       *                    {Number} minWidth: Minimum width that the resizeContainer should be
       *                    {Number} minHeight: Minimum height that the resizeContainer should be
       */
      global.EditorHelper.resizable = function( trackEvent, resizeContainer, targetContainer, options ) {
        if ( $( resizeContainer ).data( "resizable" ) ) {
          return;
        }

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

      /**
       * Member: droppable
       *
       * Make a container listen for drop events for loading images from a local machine
       *
       * @param {TrackEvent} trackEvent: The trackEvent to update when content changes
       * @param {DOMElement} dropContainer: The container that listens for the drop events
       */

      global.EditorHelper.droppable = function( trackEvent, dropContainer, callback ) {
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
          var file, fd;

          e.preventDefault();
          e.stopPropagation();

          dropContainer.classList.remove( "butter-dragover" );

          if ( !e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files[ 0 ] ) {
            butter.dispatch( "droppable-unsupported" );
            return;
          }

          file = e.dataTransfer.files[ 0 ];
          fd = new FormData();
          fd.append( "image", file );

          XHR.put( "/api/image", fd, function( data ) {
            if ( !data.error ) {
              if ( trackEvent ) {
                trackEvent.update( { src: data.url } );
              } else {
                callback( data.url );
              }
            } else {
              butter.dispatch( "droppable-upload-failed", data.error );
            }
          });

          if ( trackEvent ) {
            butter.editor.editTrackEvent( trackEvent );
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
    });
  };

  EditorHelper.addPlugin = function( plugin, callback ) {
    plugins[ plugin ] = callback;
  };

  global.EditorHelper = EditorHelper;

}( window, window.jQuery ));
