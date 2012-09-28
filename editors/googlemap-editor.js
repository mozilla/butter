/*global google*/
/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

( function( Butter ) {

  Butter.Editor.register( "googlemap", "load!{{baseDir}}editors/googlemap-editor.html",
    function( rootElement, butter, compiledLayout ) {

    var _this = this;

    var _rootElement = rootElement,
        _messageContainer = _rootElement.querySelector( "div.error-message" ),
        _trackEvent,
        _popcornEventMapReference,
        _butter;

    /**
     * Member: getMapFromTrackEvent
     *
     * Retrieves a handle to the map associated with the trackevent.
     */
    function getMapFromTrackEvent() {
      if ( !_trackEvent.popcornTrackEvent._map ) {
        _trackEvent.popcornTrackEvent.onmaploaded = function( options, map ){
          _popcornEventMapReference = map;
        };
      }
      else {
        _popcornEventMapReference = _trackEvent.popcornTrackEvent._map;
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

      var pluginOptions = {},
          ignoreKeys = [
            "target",
            "start",
            "end"
          ],
          optionsContainer = _rootElement.querySelector( ".editor-options" );

      function callback( elementType, element, trackEvent, name ) {
        pluginOptions[ name ] = {
          element: element,
          trackEvent: trackEvent,
          elementType: elementType
        };
      }

      function attachHandlers() {
        var key,
            option,
            pitchObject,
            headingObject,
            currentMapType;

        function toggleStreetView() {
          pitchObject.element.parentNode.style.display = "block";
          headingObject.element.parentNode.style.display = "block";
          _this.scrollbar.update();
        }

        function toggleMaps() {
          pitchObject.element.parentNode.style.display = "none";
          headingObject.element.parentNode.style.display = "none";
          _this.scrollbar.update();
        }

        function attachTypeHandler( option ) {
          option.element.addEventListener( "change", function( e ) {
            var elementVal = e.target.value,
                updateOptions = {},
                target;

            if ( elementVal === "STREETVIEW" ) {
              toggleStreetView();
            } else {
              toggleMaps();
            }

            updateOptions.type = elementVal;
            option.trackEvent.update( updateOptions );

            // Attempt to make the trackEvent's target blink
            target = _butter.getTargetByType( "elementID", option.trackEvent.popcornOptions.target );
            if ( target ) {
              target.view.blink();
            } else {
              _butter.currentMedia.view.blink();
            }
          }, false );
        }

        function attachFullscreenHandler( option ) {
          option.element.addEventListener( "click", function( e ) {
            var srcElement = e.target,
                updateOptions = {},
                manifestOpts = trackEvent.manifest.options;

            if ( srcElement.checked ) {
              updateOptions = {
                height: 100,
                width: 100,
                left: 0,
                top: 0,
                fullscreen: true
              };

            } else {
              updateOptions = {
                height: manifestOpts.height[ "default" ],
                width: manifestOpts.width[ "default" ],
                left: manifestOpts.left[ "default" ],
                top: manifestOpts.top[ "default" ],
                fullscreen: false
              };
            }

            trackEvent.update( updateOptions );
          }, false );
        }

        for ( key in pluginOptions ) {
          if ( pluginOptions.hasOwnProperty( key ) ) {
            option = pluginOptions[ key ];

            if ( key === "type" ) {
              pitchObject = pluginOptions.pitch;
              headingObject = pluginOptions.heading;
              currentMapType = option.trackEvent.popcornOptions.type;

              if ( currentMapType === "STREETVIEW" ) {
                toggleStreetView();
              } else {
                toggleMaps();
              }

              attachTypeHandler( option );
            } else if ( option.elementType === "select" && key !== "type" ) {
              _this.attachSelectChangeHandler( option.element, option.trackEvent, key, updateTrackEventWithoutTryCatch );
            } else if ( key === "fullscreen" ) {
              attachFullscreenHandler( option );
            } else if ( option.elementType === "input" ) {
              _this.attachInputChangeHandler( option.element, option.trackEvent, key, updateTrackEventWithoutTryCatch );
            }
          }
        }
      }

      optionsContainer.appendChild( _this.createStartEndInputs( trackEvent, updateTrackEventWithTryCatch ) );

      _this.createPropertiesFromManifest({
        trackEvent: trackEvent,
        callback: callback,
        basicContainer: optionsContainer,
        ignoreManifestKeys: ignoreKeys,
        safeCallback: updateTrackEventWithTryCatch
      });

      attachHandlers();

      _this.updatePropertiesFromManifest( trackEvent );
      _this.scrollbar.update();

    }

    // Extend this object to become a BaseEditor
    Butter.Editor.TrackEventEditor.extend( _this, butter, rootElement, {
      open: function( parentElement, trackEvent ) {
        var popcorn = butter.currentMedia.popcorn.popcorn;

        _butter = butter;
        // Update properties when TrackEvent is updated
        trackEvent.listen( "trackeventupdated", function ( e ) {
          _this.updatePropertiesFromManifest( e.target );
          setErrorState( false );

          // Now we REALLY know that we can try setting up listeners
          popcorn.on( "googlemaps-loaded", function() {
            popcorn.off( "googlemaps-loaded" );
            getMapFromTrackEvent();
          });
        });

        // Now we REALLY know that we can try setting up listeners
        popcorn.on( "googlemaps-loaded", function() {
          popcorn.off( "googlemaps-loaded" );
          getMapFromTrackEvent();
        });

        setup( trackEvent );

      },
      close: function() {
      }
    });

  });

}( window.Butter ));
