(function( global, $ ) {
  var plugins = {};

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
      var media = mediaContainer.getBoundingClientRect(),
          iframeVideo = mediaContainer.querySelector( "iframe" );

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
          if ( options.end ) {
            options.end();
          }

          blurActiveEl();

          trackEvent.update({
            top: ( ui.position.top / media.height ) * 100,
            left: ( ui.position.left / media.width ) * 100
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
      var media = mediaContainer.getBoundingClientRect(),
          iframeVideo = mediaContainer.querySelector( "iframe" );

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
          var height = ( ui.size.height + resizeContainer.offsetTop ) <= media.height ? ui.size.height : media.height - resizeContainer.offsetTop,
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

    function _updateFunction( e ) {

      var _trackEvent;

      if ( e.type === "trackeventadded" ) {
        _trackEvent = e.data;
      } else if ( e.type === "trackeventupdated" ) {
        _trackEvent = e.target;
      } else {
        _trackEvent = e;
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
