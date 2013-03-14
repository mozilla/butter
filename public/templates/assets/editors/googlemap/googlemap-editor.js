/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

( function( Butter ) {

  Butter.Editor.register( "googlemap", "load!{{baseDir}}templates/assets/editors/googlemap/googlemap-editor.html",
    function( rootElement, butter ) {

    var _this = this;

    var _rootElement = rootElement,
        _trackEvent,
        _popcornEventMapReference,
        _butter,
        _popcorn,
        _cachedValues = {};

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
     * Member: setup
     *
     * Sets up the content of this editor
     *
     * @param {TrackEvent} trackEvent: The TrackEvent being edited
     */
    function setup( trackEvent ) {
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
                popcornOptions = _trackEvent.popcornOptions,
                target;

            if ( elementVal === "STREETVIEW" ) {
              toggleStreetView();

              // If current map is using custom positions vs static
              if ( popcornOptions.lat && popcornOptions.lng ) {
                _cachedValues.lat = popcornOptions.lat;
                _cachedValues.lng = popcornOptions.lng;
              } else {
                _cachedValues.location = popcornOptions.location;
              }

              // Set zoom to one because the behaviour of this value differs
              // between streetview and map view
              _cachedValues.zoom = popcornOptions.zoom;
              updateOptions.zoom = 1;
            } else {
              toggleMaps();

              // If current map is using custom positions vs static
              if ( _cachedValues.lat && _cachedValues.lng ) {
                updateOptions.lat = _cachedValues.lat;
                updateOptions.lng = _cachedValues.lng;
              } else if ( _cachedValues.location ) {
                updateOptions.location = _cachedValues.location;
              }

              updateOptions.zoom = _cachedValues.zoom;
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
                popcornOptions = _trackEvent.popcornOptions;

            if ( srcElement.checked ) {
              _cachedValues.width = popcornOptions.width;
              _cachedValues.height = popcornOptions.height;
              _cachedValues.top = popcornOptions.top;
              _cachedValues.left = popcornOptions.left;

              updateOptions = {
                height: 100,
                width: 100,
                left: 0,
                top: 0,
                fullscreen: true
              };

            } else {
              updateOptions = {
                height: _cachedValues.height,
                width: _cachedValues.width,
                left: _cachedValues.left,
                top: _cachedValues.top,
                fullscreen: false
              };
            }

            trackEvent.update( updateOptions );
          }, false );
        }

        function updateLocation( te, prop ) {
          _cachedValues.location = prop.location;

          _this.updateTrackEventSafe( te, {
            location: prop.location
          });
        }

        function updateZoom( te, prop ) {
          _cachedValues.zoom = prop.zoom;

          _this.updateTrackEventSafe( te, {
            zoom: prop.zoom
          });
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
              _this.attachSelectChangeHandler( option.element, option.trackEvent, key, _this.updateTrackEventSafe );
            } else if ( key === "fullscreen" ) {
              attachFullscreenHandler( option );
            } else if ( key === "location" ) {
              _this.attachInputChangeHandler( option.element, option.trackEvent, key, updateLocation );
            } else if ( key === "zoom" ) {
              _this.attachInputChangeHandler( option.element, option.trackEvent, key, updateZoom );
            } else if ( option.elementType === "input" ) {
              _this.attachInputChangeHandler( option.element, option.trackEvent, key, _this.updateTrackEventSafe );
            }
          }
        }

      }

      optionsContainer.appendChild( _this.createStartEndInputs( trackEvent, _this.updateTrackEventSafe ) );

      _this.createPropertiesFromManifest({
        trackEvent: trackEvent,
        callback: callback,
        basicContainer: optionsContainer,
        ignoreManifestKeys: ignoreKeys
      });

      attachHandlers();

      _this.updatePropertiesFromManifest( trackEvent );
      _this.scrollbar.update();

      _this.setTrackEventUpdateErrorCallback( _this.setErrorState );

    }

    function mapLoaded() {
      _popcorn.off( "googlemaps-loaded", mapLoaded );
      getMapFromTrackEvent();
    }

    function onTrackEventUpdated( e ) {
      var popcornOptions;

      _trackEvent = e.target;
      _this.updatePropertiesFromManifest( _trackEvent );
      _this.setErrorState( false );
      popcornOptions = _trackEvent.popcornOptions;

      // We have to store lat/lng values on track event update because
      // we update these with events from dragging the map and not fields
      // in the editor.
      _cachedValues.lat = popcornOptions.lat;
      _cachedValues.lng = popcornOptions.lng;

      // Now we REALLY know that we can try setting up listeners
      _popcorn.on( "googlemaps-loaded", mapLoaded );
    }

    // Extend this object to become a BaseEditor
    Butter.Editor.TrackEventEditor.extend( _this, butter, rootElement, {
      open: function( parentElement, trackEvent ) {
        var popcornOptions = trackEvent.popcornOptions;

        _popcorn = butter.currentMedia.popcorn.popcorn;

        _cachedValues = {
          width: popcornOptions.width,
          height: popcornOptions.height,
          top: popcornOptions.top,
          left: popcornOptions.left,
          location: popcornOptions.location,
          zoom: popcornOptions.zoom,
          lat: popcornOptions.lat,
          lng: popcornOptions.lng
        };

        _butter = butter;
        // Update properties when TrackEvent is updated
        trackEvent.listen( "trackeventupdated", onTrackEventUpdated );

        // Now we REALLY know that we can try setting up listeners
        _popcorn.on( "googlemaps-loaded", mapLoaded );

        setup( trackEvent );

      },
      close: function() {
        _trackEvent.unlisten( "trackeventupdated", onTrackEventUpdated );
      }
    });
  });
}( window.Butter ));
