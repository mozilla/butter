/*global google*/
/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

( function( Butter ) {

  Butter.Editor.register( "popup", "load!{{baseDir}}templates/assets/editors/popup-editor.html",
    function( rootElement, butter, compiledLayout ) {

    var _this = this;

    var _rootElement = rootElement,
        _messageContainer = _rootElement.querySelector( "div.error-message" ),
        _trackEvent,
        _cw;

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

      var basicContainer = _rootElement.querySelector( ".basic-options" ),
          advancedContainer = _rootElement.querySelector( ".advanced-options" ),
          optionsWrapper = _rootElement.querySelector( ".editor-options-wrapper" );

      function basicCallback( elementType, element, trackEvent, name ){
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
      }

      function advancedCallback( elementType, element, trackEvent, name ) {
        if ( elementType === "color-wheel" ) {
          // Element needs to be in the DOM before initializing a Color Wheel
          advancedContainer.appendChild( element );

          function callback( color ) {
            trackEvent.update( { fontColor: color.hex } );
          }

          _cw = Raphael.colorwheel( element, 100 ).color( trackEvent.popcornOptions.fontColor );
          // ColorWheel.onchange fires twice at the end of a drag. OnDrag however allows for specificiation of a 
          // start and end callback. We are only concerned about when the user lets go of their mouse
          _cw.ondrag( null, callback );
        }
        else if ( elementType === "select" ) {
          element.selectedIndex = 5;
          _this.attachSelectChangeHandler( element, trackEvent, name, updateTrackEventWithoutTryCatch );
        }
        else if ( elementType === "input" ) {
          _this.attachInputChangeHandler( element, trackEvent, name, updateTrackEventWithoutTryCatch );
        }
        else if ( elementType === "a" ) {
          element.classList.add( "font-btn" );
          _this.attachAnchorChangeHandler( element, trackEvent, name, updateTrackEventWithoutTryCatch );
        }
      }

      _this.createPropertiesFromManifest( trackEvent, basicCallback, advancedCallback, null, basicContainer, advancedContainer );
      _this.updatePropertiesFromManifest( trackEvent );
      _this.addVerticalScrollbar( optionsWrapper, basicContainer, _rootElement );
      _this.addVerticalScrollbar( optionsWrapper, advancedContainer, _rootElement );
      _this.updateScrollBars();
    }

    // Extend this object to become a BaseEditor
    Butter.Editor.TrackEventEditor( _this, butter, rootElement, {
      open: function( parentElement, trackEvent ) {
        // Update properties when TrackEvent is updated
        trackEvent.listen( "trackeventupdated", function ( e ) {
          _this.updatePropertiesFromManifest( e.target );
          // Color Wheel doesn't have any attributes set to it. Requires manual update
          _cw.color( e.target.popcornOptions.fontColor );
          setErrorState( false );
        });
        setup( trackEvent );
        _this.updateScrollBars();

        var basicButton = document.querySelector( ".basic-tab" ),
            advancedButton = document.querySelector( ".advanced-tab" ),
            basicTab = document.querySelector( ".basic-options" ),
            advancedTab = document.querySelector( ".advanced-options");

        basicButton.addEventListener( "mouseup", function( e ) {
          if ( basicTab.classList.contains( "display-off" ) ) {
            basicTab.classList.toggle( "display-off" );
            advancedTab.classList.toggle( "display-off" );
          }
        });

        advancedButton.addEventListener( "mouseup", function( e ) {
          if ( !basicTab.classList.contains( "display-off" ) ) {
            basicTab.classList.toggle( "display-off" );
            advancedTab.classList.toggle( "display-off" );
          }
        });
      },
      close: function() {
        
      }
    });

  });

}( window.Butter ));
