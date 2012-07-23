/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "text!./default.html", "editor/editor" ],
  function( LAYOUT_SRC, Editor ) {

  /**
   * Class: DefaultEditor
   *
   * Implements the default editor as a general fallback editor
   *
   * @param {DOMElement} rootElement: Root DOM element containing the fundamental editor content
   * @param {Butter} butter: An instance of Butter
   * @param {TrackEvent} TrackEvent: The TrackEvent to edit
   */
  Editor.register( "default", LAYOUT_SRC, function( rootElement, butter ) {

    var _this = this;

    var _rootElement = rootElement,
        _trackEvent,
        _targets = [ butter.currentMedia ].concat( butter.targets ),
        _messageContainer = _rootElement.querySelector( "div.error-message" );

    /**
     * Member: setErrorState
     *
     * Sets the error state of the editor, making an error message visible
     *
     * @param {String} message: Error message to display
     */
    function setErrorState ( message ) {
      if ( message ) {
        _messageContainer.innerHTML = message;
        _messageContainer.parentNode.style.height = _messageContainer.offsetHeight + "px";
        _messageContainer.parentNode.style.visibility = "visible";
        _messageContainer.parentNode.classList.add( "open" );
      }
      else {
        _messageContainer.innerHTML = "";
        _messageContainer.parentNode.style.height = "";
        _messageContainer.parentNode.style.visibility = "";
        _messageContainer.parentNode.classList.remove( "open" );
      }
    }

    function onTrackEventUpdated( e ) {
      _this.updatePropertiesFromManifest( e.target );
      setErrorState( false );
    }

    // Extend this object to become a TrackEventEditor
    Editor.TrackEventEditor( _this, butter, rootElement, {
      open: function ( parentElement, trackEvent ) {
        var targetList,
            selectElement;

        _trackEvent = trackEvent;
        _this.createPropertiesFromManifest( trackEvent,
          function( elementType, element, trackEvent, name ){
            if ( elementType === "select" ) {
              _this.attachSelectChangeHandler( element, trackEvent, name, updateTrackEvent );
            }
            else {
              if ( [ "start", "end" ].indexOf( name ) > -1 ) {
                _this.attachStartEndHandler( element, trackEvent, name, updateTrackEvent );
              }
              else {
                if ( element.type === "checkbox" ) {
                  _this.attachCheckboxChangeHandler( element, trackEvent, name, updateTrackEvent );
                }
                else {
                  _this.attachInputChangeHandler( element, trackEvent, name, updateTrackEvent );
                }
                
              }
            }
          }, null, null, [ 'target' ] );

        targetList = _this.createTargetsList( _targets );
        selectElement = targetList.querySelector( "select" );
        // Attach the onchange handler to trackEvent is updated when <select> is changed
        _this.attachSelectChangeHandler( selectElement, trackEvent, "target" );
        _rootElement.appendChild( targetList );

        _this.updatePropertiesFromManifest( trackEvent, null, true );

        // Update properties when TrackEvent is updated
        trackEvent.listen( "trackeventupdated", onTrackEventUpdated );
      },
      close: function () {
        _trackEvent.unlisten( "trackeventupdated", onTrackEventUpdated );
      }
    });

    /**
     * Member: updateTrackEvent
     *
     * Attempt to update the properties of a TrackEvent; set the error state if a failure occurs.
     *
     * @param {TrackEvent} trackEvent: TrackEvent to update
     * @param {Object} properties: TrackEvent properties to update
     */
    function updateTrackEvent( trackEvent, properties ) {
      try {
        trackEvent.update( properties );
      }
      catch ( e ) {
        setErrorState( e.toString() );
      }
    }

  });

});
