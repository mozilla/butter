(function( global, $ ) {
  var plugins = {};

  var EditorHelper = function() {
    throw "Do not use EditorHelper in this mannger. Use EditorHelper.init instead.";
  };

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

      $( dragContainer ).draggable({
        handle: options.handle,
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
          if ( iframeVideo ) {
            iframeVideo.style.pointerEvents = "auto";
          }

          if ( options.end ) {
            options.end();
          }
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
              width = ( ui.size.width + resizeContainer.offsetLeft ) <= media.width ? ui.size.width : media.width - resizeContainer.offsetLeft;

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

          trackEvent.update({
            height: height,
            width: width
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
    global.EditorHelper.contentEditable = function( trackEvent, contentContainer ) {
      var newText = "";

      if ( contentContainer ) {
        contentContainer.addEventListener( "blur", function( e ) {
          newText = contentContainer.textContent;
          trackEvent.update({
            text: newText && newText !== "" ? newText : trackEvent.popcornOptions.text
          });
        }, false );
        contentContainer.addEventListener( "keydown", function( e ) {
          if ( e.keyCode === 13 ) {
            newText = contentContainer.textContent;
            trackEvent.update({
              text: newText && newText !== "" ? newText : trackEvent.popcornOptions.text
            });
          }
        }, false );
        contentContainer.addEventListener( "mousedown", function( e ) {
          if ( !e.shiftKey ) {
            e.stopPropagation();
          }
        }, false );
        contentContainer.setAttribute( "contenteditable", "true" );
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
