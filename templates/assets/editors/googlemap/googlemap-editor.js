/*global google*/
/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

( function( Butter ) {

  Butter.Editor.register( "googlemap", "load!{{baseDir}}templates/assets/editors/googlemap/googlemap-editor.html",
    function( rootElement, butter, compiledLayout ) {

    var _this = this;

    var _rootElement = rootElement,
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
              // Set zoom to one because the behaviour of this value differs
              // between streetview and map view
              updateOptions.zoom = 1;
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
              _this.attachSelectChangeHandler( option.element, option.trackEvent, key, _this.updateTrackEventSafe );
            } else if ( key === "fullscreen" ) {
              attachFullscreenHandler( option );
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

    // Extend this object to become a BaseEditor
    Butter.Editor.TrackEventEditor.extend( _this, butter, rootElement, {
      open: function( parentElement, trackEvent ) {
        var popcorn = butter.currentMedia.popcorn.popcorn;

        _butter = butter;
        // Update properties when TrackEvent is updated
        trackEvent.listen( "trackeventupdated", function ( e ) {
          _this.updatePropertiesFromManifest( e.target );
          _this.setErrorState( false );

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
