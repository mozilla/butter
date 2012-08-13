/*global google*/
/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

( function( Butter ) {

  Butter.Editor.register( "popup", "load!{{baseDir}}templates/assets/editors/popup/popup-editor.html",
    function( rootElement, butter, compiledLayout ) {

    var _this = this;

    var _rootElement = rootElement,
        _messageContainer = _rootElement.querySelector( "div.error-message" ),
        _trackEvent,
        _butter;

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
    function setup( trackEvent ) {
      _trackEvent = trackEvent;

      var basicContainer = _rootElement.querySelector( ".basic-options" ),
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
          flipObject.element.parentNode.style.display = "flip";
          soundObject.element.parentNode.style.display = "none";
          iconObject.element.parentNode.style.display = "none";
        }

        function attachTypeHandler( option ) {
          option.element.addEventListener( "change", function( e ) {
            var elementVal = e.srcElement.value,
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
              _this.attachSelectChangeHandler( option.element, option.trackEvent, key, updateTrackEventWithoutTryCatch );
            }
            else if ( option.elementType === "input" ) {
              if ( [ "start", "end" ].indexOf( key ) > -1 ) {
                _this.attachStartEndHandler( option.element, option.trackEvent, key, updateTrackEventWithTryCatch );
              }
              else if ( option.element.type === "checkbox" ) {
                _this.attachCheckboxChangeHandler( option.element, option.trackEvent, key, updateTrackEventWithoutTryCatch );
              }
              else {
                _this.attachInputChangeHandler( option.element, option.trackEvent, key, updateTrackEventWithoutTryCatch );
              }
            }
          }
        }
      }

      _this.createPropertiesFromManifest( trackEvent, callback, null, basicContainer, advancedContainer );
      attachHandlers();
      _this.updatePropertiesFromManifest( trackEvent );
      _this.addVerticalScrollbar( basicContainer.parentNode, basicContainer.parentNode, _rootElement );
      _this.updateScrollBar();
    }

    // Extend this object to become a BaseEditor
    Butter.Editor.TrackEventEditor( _this, butter, rootElement, {
      open: function( parentElement, trackEvent ) {
        _butter = butter;
        // Update properties when TrackEvent is updated
        trackEvent.listen( "trackeventupdated", function ( e ) {
          _this.updatePropertiesFromManifest( e.target );
          setErrorState( false );
        });
        setup( trackEvent );
        _this.applyExtraHeadTags( compiledLayout );

        var basicButton = document.querySelector( ".basic-tab" ),
            advancedButton = document.querySelector( ".advanced-tab" ),
            basicTab = document.querySelector( ".basic-options" ),
            advancedTab = document.querySelector( ".advanced-options" );

        basicButton.addEventListener( "mouseup", function( e ) {
          if ( basicTab.classList.contains( "display-off" ) ) {
            basicTab.classList.toggle( "display-off" );
            advancedTab.classList.toggle( "display-off" );
            _this.updateScrollBar();
          }
        });

        advancedButton.addEventListener( "mouseup", function( e ) {
          if ( !basicTab.classList.contains( "display-off" ) ) {
            basicTab.classList.toggle( "display-off" );
            advancedTab.classList.toggle( "display-off" );
            _this.updateScrollBar();
          }
        });
      },
      close: function() {
        _this.removeExtraHeadTags();
      }
    });

  });

}( window.Butter ));