/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

(function( Butter ) {

  Butter.Editor.register( "twitter", "load!{{baseDir}}templates/assets/editors/twitter/twitter-editor.html",
    function( rootElement, butter ) {

    var _rootElement = rootElement,
        _trackEvent,
        _butter,
        _maxTweets,
        _this = this,
        _searchType = _rootElement.querySelector( "#search-type" );

    /**
     * Member: updateTrackEvent
     *
     * Simple handler for updating a TrackEvent when needed.
     *
     * @param {TrackEvent} trackEvent: TrackEvent to update
     * @param {Object} updateOptions: TrackEvent properties to update
     */
    function updateTrackEvent( trackEvent, updateOptions ) {
      if ( updateOptions.numberOfTweets ) {
        if ( updateOptions.numberOfTweets > _maxTweets ) {
          updateOptions.numberOfTweets = _maxTweets;
          _this.setErrorState( "The maximum number of tweets you may retrieve is " + _maxTweets + "." );
          return;
        }
      }

      _this.updateTrackEventSafe( trackEvent, updateOptions );
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
            "username",
            "start",
            "end"
          ],
          startEndElement;

      _maxTweets = trackEvent.manifest.options.numberOfTweets.maxTweets;

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
            searchButton = _rootElement.querySelector( "#search-radio" ),
            userButton = _rootElement.querySelector( "#user-radio" ),
            searchText = _rootElement.querySelector( "#search-text" ),
            userText = _rootElement.querySelector( "#user-text" );

        _searchType.addEventListener( "change", function onChange( e ) {
          trackEvent.update({
            searchType: e.target.value
          });
        }, false );

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
            userText.classList.add( "butter-disabled" );
            searchText.classList.remove( "butter-disabled" );
            _searchType.classList.remove( "butter-disabled" );
            // Our butter-disabled class doesn't handle this.
            _searchType.disabled = false;

            searchText.addEventListener( "blur", updateSearch, false );
          }
          else {
            searchText.removeEventListener( "blur", updateSearch, false );
            userText.classList.remove( "butter-disabled" );
            searchText.classList.add( "butter-disabled" );
            _searchType.classList.add( "butter-disabled" );
            // Our butter-disabled class doesn't handle this.
            _searchType.disabled = true;

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
              _this.attachSelectChangeHandler( option.element, option.trackEvent, key, updateTrackEvent );
            }
            else if ( option.elementType === "input" ) {
              _this.attachInputChangeHandler( option.element, option.trackEvent, key, updateTrackEvent );
            }
          }
        }
      }

      startEndElement = _this.createStartEndInputs( trackEvent, _this.updateTrackEventSafe );
      container.insertBefore( startEndElement, container.firstChild );

      _this.createPropertiesFromManifest({
        trackEvent: trackEvent,
        callback: callback,
        basicContainer: container,
        ignoreManifestKeys: ignoreKeys
      });

      attachHandlers();
      _this.updatePropertiesFromManifest( trackEvent );
      _this.setTrackEventUpdateErrorCallback( _this.setErrorState );

    }

    function onTrackEventUpdated( e ) {
      _this.updatePropertiesFromManifest( e.target );
      _this.setErrorState( false );
    }

    // Extend this object to become a TrackEventEditor
    Butter.Editor.TrackEventEditor.extend( _this, butter, rootElement, {
      open: function( parentElement, trackEvent ) {
        _butter = butter;
        // Update properties when TrackEvent is updated
        trackEvent.listen( "trackeventupdated", onTrackEventUpdated );
        setup( trackEvent );
      },
      close: function() {
        _this.removeExtraHeadTags();
        _trackEvent.unlisten( "trackeventupdated", onTrackEventUpdated );
      }
    });
  });
}( window.Butter ));
