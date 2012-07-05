/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */


Butter.Editor.loadLayout( "{{baseDir}}editors/googlemap-editor.html", function( layoutSrc ) {

  Butter.Editor.register( "googlemap", layoutSrc, function( rootElement, butter ) {

    var _this = this;

    var _butter = butter,
        _rootElement = rootElement,
        _targets = [ butter.currentMedia ].concat( butter.targets ),
        _messageContainer = _rootElement.querySelector( "div.error-message" ),
        _targetSelectElement;

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

    /**
     * Member: updateTrackEventWithoutTryCatch
     *
     * Simple handler for updating a TrackEvent when needed
     *
     * @param {TrackEvent} trackEvent: TrackEvent to update
     * @param {Object} updateOptions: TrackEvent properties to update
     */    
    function updateTrackEventWithoutTryCatch( trackEvent, updateOptions ) {
      trackEvent.update( updateOptions );
    }

    /**
     * Member: updateTrackEventWithTryCatch
     *
     * Attempt to update the properties of a TrackEvent; set the error state if a failure occurs.
     *
     * @param {TrackEvent} trackEvent: TrackEvent to update
     * @param {Object} properties: TrackEvent properties to update
     */
    function updateTrackEventWithTryCatch( trackEvent, properties ) {
      try {
        trackEvent.update( properties );
      }
      catch ( e ) {
        setErrorState( e.toString() );
      }
    }

    /**
     * Member: setup
     *
     * Sets up the content of this editor
     *
     * @param {TrackEvent} trackEvent: The TrackEvent being edited
     */
    function setup( trackEvent ){
      var targetList = _this.createTargetsList( _targets ),
          optionsContainer = _rootElement.querySelector( ".editor-options" );

      // Attach the onchange handler to trackEvent is updated when <select> is changed
      _targetSelectElement = targetList.querySelector( "select" );

      // Remove the default "Media Element" target so that the googlemaps plugin doesn't get angry with a blank target
      _targetSelectElement.removeChild( _targetSelectElement.querySelector( '.default-target-option' ) );
      _this.attachSelectChangeHandler( _targetSelectElement, trackEvent, "target" );
      _targetSelectElement.value = trackEvent.popcornOptions.target;

      optionsContainer.appendChild( targetList );

      _this.createPropertiesFromManifest( trackEvent, 
          function( elementType, element, trackEvent, name ){
            if ( elementType === "select" ) {
              _this.attachSelectChangeHandler( element, trackEvent, name, updateTrackEventWithoutTryCatch );
            }
            else {
              if ( [ "start", "end" ].indexOf( name ) > -1 ) {
                _this.attachStartEndHandler( element, trackEvent, name, updateTrackEventWithTryCatch );
              }
              else {
                if ( element.type === "checkbox" ) {
                  _this.attachCheckboxChangeHandler( element, trackEvent, name, updateTrackEventWithoutTryCatch );
                }
                else {
                  _this.attachInputChangeHandler( element, trackEvent, name, updateTrackEventWithoutTryCatch );
                }
                
              }
            }
          },
          null,
          optionsContainer );

      _rootElement.querySelector( "button" ).addEventListener( "click", function( e ) {
        if ( trackEvent.popcornTrackEvent._map ) {
          var map = trackEvent.popcornTrackEvent._map,
              center = map.getCenter(),
              updateOptions = {
                lat: center.lat(),
                lng: center.lng(),
                heading: map.getHeading(),
                pitch: map.getTilt(),
                zoom: map.getZoom(),
                location: ""
              };
          trackEvent.update( updateOptions );
        }
      }, false );

      _this.updatePropertiesFromManifest( trackEvent );

    }

    // Extend this object to become a BaseEditor
    Butter.Editor.BaseEditor( _this, butter, rootElement, {
      open: function ( parentElement, trackEvent ) {
        // Update properties when TrackEvent is updated
        trackEvent.listen( "trackeventupdated", function ( e ) {
          _this.updatePropertiesFromManifest( e.target );
          _targetSelectElement.value = trackEvent.popcornOptions.target;
          setErrorState( false );
        });
        setup( trackEvent );
      },
      close: function () {
      }
    });

  });

});
