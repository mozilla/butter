(function( global, $ ) {
  var plugins = {};

  global.EditorHelper = function( butter ) {

    /**
     * Member: draggable
     *
     * Makes a container draggable using jQueryUI
     *
     * @paran {TrackEvent} trackEvent: The trackEvent to update when position changes
     * @param {DOMElement} dragContainer: the container which to apply draggable to
     * @param {media} The current media's target element in Butter ( parent container )
     * @param {Object} extra options to apply to the draggable call
     *                 Options are:
     *                    {DOMElement} handle: Restrict drag start event to this element
     *                    {Function} start: Function to execute on drag start event
     *                    {Function} end: Fucntion to execute on drag end event
     */
    global.EditorHelper.draggable = function( trackEvent, dragContainer, mediaContainer, options ) {
      var media = mediaContainer.getBoundingClientRect();

      options = options || {};

      $( dragContainer ).draggable({
        handle: options.handle,
        start: options.start,
        containment: "parent",
        stop: function( event, ui ) {
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
     * @paran {TrackEvent} trackEvent: The trackEvent to update when size changes
     * @param {DOMElement} resizeContainer: the container which to apply resizable to
     * @param {media} The current media's target element in Butter ( parent container )
     * @param {Object} extra options to apply to the resizeable call
     *                 Options are:
     *                    {String} handlePositions: describes where to position resize handles ( i.e. "n,s,e,w" )
     *                    {Function} start: Function to execute on resize start event
     *                    {Function} end: Fucntion to execute on resize end event
     */
    global.EditorHelper.resizable = function( trackEvent, resizeContainer, mediaContainer, options ) {
      var media = mediaContainer.getBoundingClientRect();

      options = options || {};

      $( resizeContainer ).resizable({
        handles: options.handlePositions,
        start: options.start,
        containment: "parent",
        stop: function( event, ui ) {
          var height = ( ui.size.height + resizeContainer.offsetTop ) <= media.height ? ui.size.height : media.height - resizeContainer.offsetTop,
              width = ( ui.size.width + resizeContainer.offsetLeft ) <= media.width ? ui.size.width : media.width - resizeContainer.offsetLeft;

          if ( options.end ) {
            options.end();
          }
          trackEvent.update({
            height: ( height / media.height ) * 100,
            width: ( width / media.width ) * 100
          });
        }
      });
    };

    /**
     * Member: contentEditable
     *
     * Makes a container's content editable using contenteditable
     *
     * @paran {TrackEvent} trackEvent: The trackEvent to update when content changes
     * @param {DOMElement} contentContainer: the container which to listen for changes and set as editable
     * @param {media} The current media's target element in Butter ( parent container )
     */
    global.EditorHelper.contentEditable = function( trackEvent, contentContainer, mediaContainer ) {
      var media = mediaContainer.getBoundingClientRect(),
          newText = "";

      if ( contentContainer ) {
        contentContainer.addEventListener( "blur", function( e ) {
          newText = contentContainer.textContent;
          trackEvent.update({
            text: newText && newText !== "" ? newText : trackEvent.popcornOptions.text
          });
        }, false );
        contentContainer.addEventListener( "keydown", function( e ) {
          newText = contentContainer.textContent;
          if ( e.keyCode === 13 ) {
            trackEvent.update({
              text: newText && newText !== "" ? newText : trackEvent.popcornOptions.text
            });
          }
        }, false );
        contentContainer.addEventListener( "mousedown", function( e ) {
          !e.shiftKey && e.stopPropagation();
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

  global.EditorHelper.addPlugin = function( plugin, callback ) {
    plugins[ plugin ] = callback;
  };

}( window, window.jQuery ));
