/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

(function( Butter ) {

  Butter.Editor.register( "popup", "load!{{baseDir}}templates/assets/editors/popup/popup-editor.html",
    function( rootElement, butter ) {

    var _this = this;

    var _rootElement = rootElement,
        _trackEvent,
        _manifestOptions,
        _butter,
        _popcornOptions;

    /**
     * Member: setup
     *
     * Sets up the content of this editor
     *
     * @param {TrackEvent} trackEvent: The TrackEvent being edited
     */
    function setup( trackEvent ) {
      _trackEvent = trackEvent;
      _manifestOptions = _trackEvent.manifest.options;
      _popcornOptions = _trackEvent.popcornOptions;

      var basicContainer = _rootElement.querySelector( ".editor-options" ),
          advancedContainer = _rootElement.querySelector( ".advanced-options" ),
          pluginOptions = {};

      function callback( elementType, element, trackEvent, name ) {
        pluginOptions[ name ] = { element: element, trackEvent: trackEvent, elementType: elementType };
      }

      function attachHandlers() {
        var key,
            option;

        function togglePopup() {
          triangleObject.element.parentNode.style.display = "none";
          flipObject.element.parentNode.style.display = "none";
          soundObject.element.parentNode.style.display = "block";
          iconObject.element.parentNode.style.display = "block";
        }

        function toggleSpeech() {
          triangleObject.element.parentNode.style.display = "block";
          flipObject.element.parentNode.style.display = "block";
          soundObject.element.parentNode.style.display = "none";
          iconObject.element.parentNode.style.display = "none";
        }

        function attachTypeHandler( option ) {
          option.element.addEventListener( "change", function( e ) {
            var elementVal = e.target.value,
                updateOptions = {},
                target;

            if ( elementVal === "popup" ) {
              togglePopup();
            }
            else {
              toggleSpeech();
            }

            updateOptions.type = elementVal;
            option.trackEvent.update( updateOptions );

            // Attempt to make the trackEvent's target blink
            target = _butter.getTargetByType( "elementID", option.trackEvent.popcornOptions.target );
            if( target ) {
              target.view.blink();
            }
            else {
              _butter.currentMedia.view.blink();
            }
          }, false );
        }

        function colorCallback( te, prop, message ) {
          if ( message ) {
            _this.setErrorState( message );
            return;
          } else {
            te.update({
              fontColor: prop.fontColor
            });
          }
        }

        for ( key in pluginOptions ) {
          if ( pluginOptions[ key ] ) {
            option = pluginOptions[ key ];

            if ( key === "type" ) {
              var triangleObject = pluginOptions.triangle,
                  soundObject = pluginOptions.sound,
                  iconObject = pluginOptions.icon,
                  flipObject = pluginOptions.flip,
                  currentType = option.trackEvent.popcornOptions.type;

              if ( currentType === "popup" ) {
                togglePopup();
              }
              else {
                toggleSpeech();
              }

              attachTypeHandler( option );
            }
            else if ( option.elementType === "select" && key !== "type" ) {
              _this.attachSelectChangeHandler( option.element, option.trackEvent, key, _this.updateTrackEventSafe );
            }
            else if ( option.elementType === "input" ) {
              if ( key === "linkUrl" ) {
                _this.createTooltip( option.element, {
                  name: "text-link-tooltip" + Date.now(),
                  element: option.element.parentElement,
                  message: "Links will be clickable when shared.",
                  top: "105%",
                  left: "50%",
                  hidden: true,
                  hover: false
                });
              }

              if ( option.element.type === "checkbox" ) {
                _this.attachCheckboxChangeHandler( option.element, option.trackEvent, key );
              }
              else if ( key === "fontColor" ) {
                _this.attachColorChangeHandler( option.element, option.trackEvent, key, colorCallback );
              }
              else {
                _this.attachInputChangeHandler( option.element, option.trackEvent, key, _this.updateTrackEventSafe );
              }
            }
            else if ( option.elementType === "textarea" ) {
              _this.attachInputChangeHandler( option.element, option.trackEvent, key, _this.updateTrackEventSafe );
            }
          }
        }

        basicContainer.insertBefore( _this.createStartEndInputs( trackEvent, _this.updateTrackEventSafe ), basicContainer.firstChild );
      }

      if ( _popcornOptions.fontSize ) {
        _manifestOptions.fontPercentage.hidden = true;
        _manifestOptions.fontSize.hidden = false;
      } else {
        _manifestOptions.fontSize.hidden = true;
        _manifestOptions.fontPercentage.hidden = false;
      }

      _this.createPropertiesFromManifest({
        trackEvent: trackEvent,
        callback: callback,
        basicContainer: basicContainer,
        advancedContainer: advancedContainer,
        ignoreManifestKeys: [ "start", "end" ]
      });

      attachHandlers();
      _this.updatePropertiesFromManifest( trackEvent );
      _this.setTrackEventUpdateErrorCallback( _this.setErrorState );
    }

    function anchorClickPrevention( anchorContainer ) {
      if ( anchorContainer ) {

        anchorContainer.onclick = function() {
          return false;
        };
      }
    }

    function onTrackEventUpdated( e ) {
      _trackEvent = e.target;

      var anchorContainer = _trackEvent.popcornTrackEvent._container.querySelector( "a" );
      anchorClickPrevention( anchorContainer );

      _this.updatePropertiesFromManifest( _trackEvent );
      _this.setErrorState( false );
    }

    // Extend this object to become a TrackEventEditor
    Butter.Editor.TrackEventEditor.extend( _this, butter, rootElement, {
      open: function( parentElement, trackEvent ) {
        var anchorContainer = trackEvent.popcornTrackEvent._container.querySelector( "a" );

        anchorClickPrevention( anchorContainer );

        _butter = butter;

        // Update properties when TrackEvent is updated
        trackEvent.listen( "trackeventupdated", onTrackEventUpdated );
        setup( trackEvent );
      },
      close: function() {
        _trackEvent.unlisten( "trackeventupdated", onTrackEventUpdated );
      }
    });
  });
}( window.Butter ));
