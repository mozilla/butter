/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "util/mediatypes", "editor/editor", "util/time" ],
  function( MediaUtils, Editor, Time ) {

  Editor.register( "sequencer", "load!{{baseDir}}src/editor/default.html",
    function( rootElement, butter ) {
    var _this = this;

    var _rootElement = rootElement,
        _trackEvent,
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
      _popcornOptions = _trackEvent.popcornOptions;

      var basicContainer = _rootElement.querySelector( ".editor-options" ),
          pluginOptions = {};

      function callback( elementType, element, trackEvent, name ) {
        pluginOptions[ name ] = { element: element, trackEvent: trackEvent, elementType: elementType };
      }

      function attachHandlers() {
        var key,
            option;

        function sourceCallback( trackEvent, updateOptions, prop ) {
          MediaUtils.getMetaData( updateOptions.source, function( data ) {
            updateOptions.duration = data.duration;
            updateOptions.denied = data.denied;
            trackEvent.update( updateOptions );
          });
        }

        function checkboxCallback( trackEvent, updateOptions ) {
          trackEvent.update( updateOptions );
        }

        function fromCallback( trackEvent, updateOptions ) {
          updateOptions.from = Time.toSeconds( updateOptions.from );
          if ( updateOptions.from >= trackEvent.popcornOptions.duration ) {
            updateOptions.from = trackEvent.popcornOptions.from
          }
          trackEvent.update( updateOptions );
        }

        for ( key in pluginOptions ) {
          if ( pluginOptions.hasOwnProperty( key ) ) {
            option = pluginOptions[ key ];

            if ( option.elementType === "select" ) {
              _this.attachSelectChangeHandler( option.element, option.trackEvent, key, _this.updateTrackEventSafe );
            }
            else if ( option.elementType === "input" ) {
              if ( key === "source" ) {
                _this.attachInputChangeHandler( option.element, option.trackEvent, key, sourceCallback );
              } else if ( key === "from" ) {
                _this.attachInputChangeHandler( option.element, option.trackEvent, key, fromCallback );
              } else if ( option.element.type === "checkbox" ) {
                _this.attachCheckboxChangeHandler( option.element, option.trackEvent, key, checkboxCallback );
              } else {
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

      _this.createPropertiesFromManifest({
        trackEvent: trackEvent,
        callback: callback,
        basicContainer: basicContainer,
        ignoreManifestKeys: [ "start", "end" ]
      });

      attachHandlers();
      _this.updatePropertiesFromManifest( trackEvent );
      _this.setTrackEventUpdateErrorCallback( _this.setErrorState );
    }

    function anchorClickPrevention( anchorContainer ) {
      if ( anchorContainer ) {
        
        anchorContainer.onclick = _falseClick;
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
});
