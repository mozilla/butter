/*global google*/
/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function( Butter ) {

  Butter.Editor.register( "twitter", "load!{{baseDir}}templates/assets/editors/twitter/twitter-editor.html",
    function( rootElement, butter, compiledLayout ) {

    var _rootElement = rootElement,
        _messageContainer = _rootElement.querySelector( "div.error-message" ),
        _trackEvent,
        _butter,
        _this = this;

    /**
     * Member: setErrorState
     *
     * Sets the error state of the editor, making an error message visible
     *
     * @param {String} message: Error message to display
     */
    function setErrorState( message ) {
      var messageParent = _messageContainer.parentNode,
          messageStyle = messageParent.style;

      if ( message ) {
        _messageContainer.innerHTML = message;
        messageStyle.height = _messageContainer.offsetHeight + "px";
        messageStyle.visibility = "visible";
        messageParent.classList.add( "open" );
      }
      else {
        _messageContainer.innerHTML = "";
        messageStyle.height = "";
        messageStyle.visibility = "";
        messageParent.classList.remove( "open" );
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

      var container = _rootElement.querySelector( ".editor-options" ),
          pluginOptions = {},
          ignoreKeys = [
            "search",
            "username"
          ];

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
            start = pluginOptions.start.element.parentNode.parentNode,
            end = pluginOptions.end.element.parentNode.parentNode,
            searchLabel = _rootElement.querySelector( "#search-label" ).parentNode,
            searchButton = _rootElement.querySelector( "#search-radio" ),
            userButton = _rootElement.querySelector( "#user-radio" ),
            searchText = _rootElement.querySelector( "#search-text" ),
            userText = _rootElement.querySelector( "#user-text" );

        // Move start and end to first elements in editor
        container.insertBefore( start, searchLabel );
        container.insertBefore( end, searchLabel );

        // Disable the user search box immediately
        userText.disabled = true;

        function updateSearch( e ) {
          trackEvent.update({
            search: e.target.value,
            username: ""
          });
        }

        function updateUser( evt ) {
          trackEvent.update({
            username: evt.target.value,
            search: ""
          });
        }

        function handler( e ) {
          var target = e.target;

          if ( target.id === "search-radio" ) {
            userText.removeEventListener( "blur", updateUser, false );
            userText.disabled = true;
            searchText.disabled = false;

            searchText.addEventListener( "blur", updateSearch, false );
          }
          else {
            searchText.removeEventListener( "blur", updateSearch, false );
            searchText.disabled = true;
            userText.disabled = false;

            userText.addEventListener( "blur", updateUser, false );
          }
        }

        searchText.addEventListener( "blur", updateSearch, false );
        searchButton.addEventListener( "click", handler, false );
        userButton.addEventListener( "click", handler, false );

        for ( key in pluginOptions ) {
          if ( pluginOptions.hasOwnProperty( key ) ) {
            option = pluginOptions[ key ];

            if ( option.elementType === "select" ) {
              _this.attachSelectChangeHandler( option.element, option.trackEvent, key, updateTrackEventWithoutTryCatch );
            }
            else if ( option.elementType === "input" ) {
              if ( [ "start", "end" ].indexOf( key ) > -1 ) {
                _this.attachStartEndHandler( option.element, option.trackEvent, key, updateTrackEventWithTryCatch );
              }
              else {
                _this.attachInputChangeHandler( option.element, option.trackEvent, key, updateTrackEventWithoutTryCatch );
              }
            }
          }
        }
      }

      _this.createPropertiesFromManifest( trackEvent, callback, null, container, null, ignoreKeys );
      attachHandlers();
      _this.updatePropertiesFromManifest( trackEvent );

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
      },
      close: function() {
        _this.removeExtraHeadTags();
        _trackEvent.unlisten( "trackeventupdated" );
      }
    });

  });

}( window.Butter ));
