/*global google*/
/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

( function( Butter ) {

  Butter.Editor.register( "googlemap", "load!{{baseDir}}editors/googlemap-editor.html",
    function( rootElement, butter, compiledLayout ) {

    var _this = this;

    var _rootElement = rootElement,
        _targets = [ butter.currentMedia ].concat( butter.targets ),
        _messageContainer = _rootElement.querySelector( "div.error-message" ),
        _targetSelectElement,
        _trackEvent,
        _popcornEventMapReference,
        _mapListeners;

    /**
     * Member: onDragEnd
     *
     * GoogleMaps drag ended event handler. Updates the associated trackevent after the drag has ended.
     */
    function onDragEnd() {
      var center = _popcornEventMapReference.getCenter(),
          updateOptions = {
            lat: center.lat(),
            lng: center.lng(),
            location: ""
          };
      _trackEvent.update( updateOptions );
    }

    /**
     * Member: onHeadingChanged
     *
     * GoogleMaps heading changed event handler. Updates the associated trackevent after map heading is changed.
     */
    function onHeadingChanged() {
      var updateOptions = {
            heading: _popcornEventMapReference.getHeading(),
            location: ""
          };
      _trackEvent.update( updateOptions );
    }

    /**
     * Member: onZoomChanged
     *
     * GoogleMaps zoom changed event handler. Updates the associated trackevent after map zoom is changed.
     */
    function onZoomChanged() {
      var updateOptions = {
            zoom: _popcornEventMapReference.getZoom(),
            location: ""
          };
      _trackEvent.update( updateOptions );
    }

    /**
     * Member: setupMapListeners
     *
     * Adds listeners to the google map object to detect change in state.
     */
    function setupMapListeners() {
      _mapListeners = [];
      _mapListeners.push( google.maps.event.addListener( _popcornEventMapReference, 'dragend', onDragEnd ) );
      _mapListeners.push( google.maps.event.addListener( _popcornEventMapReference, 'zoom_changed', onZoomChanged ) );
      _mapListeners.push( google.maps.event.addListener( _popcornEventMapReference, 'heading_changed', onHeadingChanged ) );
    }

    /**
     * Member: removeMapListeners
     *
     * Removes listeners added by `setupMapListeners`.
     */
    function removeMapListeners() {
      if ( _popcornEventMapReference && _trackEvent.popcornTrackEvent._map ) {
        while ( _mapListeners.length ) {
          google.maps.event.removeListener( _mapListeners.pop() );
        }
      }
    }

    /**
     * Member: getMapFromTrackEvent
     *
     * Retrieves a handle to the map associated with the trackevent and proceeds to call `setupMapListeners`.
     * `removeMapListeners` is called first to remove old listeners if a map was already initialized
     * (trackeventupdate might cause this to occur).
     */
    function getMapFromTrackEvent() {
      removeMapListeners();
      if ( !_trackEvent.popcornTrackEvent._map ) {
        _trackEvent.popcornTrackEvent.onmaploaded = function( options, map ){
          _popcornEventMapReference = map;
          setupMapListeners();
        };
      }
      else {
        _popcornEventMapReference = _trackEvent.popcornTrackEvent._map;
        setupMapListeners();
      }
    }

    /**
     * Member: setErrorState
     *
     * Sets the error state of the editor, making an error message visible
     *
     * @param {String} message: Error message to display
     */
    function setErrorState( message ) {
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
      _trackEvent = trackEvent;

      var targetList = _this.createTargetsList( _targets ),
          optionsContainer = _rootElement.querySelector( ".editor-options" ),
          optionsWrapper = _rootElement.querySelector( ".editor-options-wrapper" );

      // Attach the onchange handler to trackEvent is updated when <select> is changed
      _targetSelectElement = targetList.querySelector( "select" );

      // Remove the default "Media Element" target so that the googlemaps plugin doesn't get angry with a blank target
      _targetSelectElement.removeChild( _targetSelectElement.querySelector( ".default-target-option" ) );
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

      getMapFromTrackEvent();

      _this.updatePropertiesFromManifest( trackEvent );

      _this.addVerticalScrollbar( optionsWrapper, optionsContainer, _rootElement );
      _this.vScrollBar.update();
    }

    // Extend this object to become a BaseEditor
    Butter.Editor.TrackEventEditor( _this, butter, rootElement, {
      open: function( parentElement, trackEvent ) {
        // Update properties when TrackEvent is updated
        trackEvent.listen( "trackeventupdated", function ( e ) {
          _this.updatePropertiesFromManifest( e.target );
          _targetSelectElement.value = trackEvent.popcornOptions.target;
          setErrorState( false );
          getMapFromTrackEvent();
        });
        setup( trackEvent );
        _this.applyExtraStyleTag( compiledLayout );
        _this.vScrollBar.update();
      },
      close: function() {
        _this.removeExtraStyleTag();
        removeMapListeners();
      }
    });

  });

}( window.Butter ));
