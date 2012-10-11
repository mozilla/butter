/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function( Butter ) {

  Butter.Editor.register( "text", "load!{{baseDir}}templates/assets/editors/text/text-editor.html",
    function( rootElement, butter, compiledLayout ) {

    var _this = this;

    var _rootElement = rootElement,
        _trackEvent,
        _butter;

    /**
     * Member: setup
     *
     * Sets up the content of this editor
     *
     * @param {TrackEvent} trackEvent: The TrackEvent being edited
     */
    function setup( trackEvent ) {
      _trackEvent = trackEvent;

      var basicContainer = _rootElement.querySelector( ".editor-options" ),
          advancedContainer = _rootElement.querySelector( ".advanced-options" ),
          pluginOptions = {};

      function callback( elementType, element, trackEvent, name ) {
        pluginOptions[ name ] = { element: element, trackEvent: trackEvent, elementType: elementType };
      }

      function attachHandlers() {
        var key,
            option;

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
          if ( pluginOptions.hasOwnProperty( key ) ) {
            option = pluginOptions[ key ];

            if ( option.elementType === "select" ) {
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
                _this.attachCheckboxChangeHandler( option.element, option.trackEvent, key, _this.updateTrackEventSafe );
              } else if ( key === "fontColor" ) {
                _this.attachColorChangeHandler( option.element, option.trackEvent, key, colorCallback );
              }
              else {
                _this.attachInputChangeHandler( option.element, option.trackEvent, key, _this.updateTrackEventSafe );
              }
            }
          }
        }

        basicContainer.insertBefore( _this.createStartEndInputs( trackEvent, _this.updateTrackEventSafe ), basicContainer.firstChild );
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

    // Extend this object to become a TrackEventEditor
    Butter.Editor.TrackEventEditor.extend( _this, butter, rootElement, {
      open: function( parentElement, trackEvent ) {
        var anchorContainer = trackEvent.popcornTrackEvent._container.querySelector( "a" );

        anchorClickPrevention( anchorContainer );

        _butter = butter;

        // Update properties when TrackEvent is updated
        trackEvent.listen( "trackeventupdated", function ( e ) {
          _trackEvent = e.target;

          anchorContainer = _trackEvent.popcornTrackEvent._container.querySelector( "a" );
          anchorClickPrevention( anchorContainer );

          _this.updatePropertiesFromManifest( _trackEvent );
          _this.setErrorState( false );
        });
        setup( trackEvent );
      },
      close: function() {
        _trackEvent.unlisten( "trackeventupdated" );
      }
    });
  });
}( window.Butter ));
