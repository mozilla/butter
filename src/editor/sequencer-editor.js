/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "util/mediatypes", "editor/editor", "util/time",
          "util/uri", "text!editor/default.html"  ],
  function( MediaUtils, Editor, Time, URI, LAYOUT_SRC ) {

  Editor.register( "sequencer", LAYOUT_SRC,
    function( rootElement, butter ) {
    var _this = this;

    var _rootElement = rootElement,
        _trackEvent,
        _butter,
        _pluginOptions,
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

      var basicContainer = _rootElement.querySelector( ".editor-options" );
      _pluginOptions = {};

      function callback( elementType, element, trackEvent, name ) {
        _pluginOptions[ name ] = { element: element, trackEvent: trackEvent, elementType: elementType };
      }

      function attachHandlers() {
        var key,
            option;

        function sourceCallback( trackEvent, updateOptions ) {
          MediaUtils.getMetaData( updateOptions.source, function( data ) {
            updateOptions.duration = data.duration;
            updateOptions.denied = data.denied;
            updateOptions.from = data.from || 0;
            updateOptions.source = data.source;
            updateOptions.end = trackEvent.popcornOptions.start + data.duration;
            trackEvent.update( updateOptions );
          });
        }

        function checkboxCallback( trackEvent, updateOptions ) {
          trackEvent.update( updateOptions );
        }

        function fromCallback( trackEvent, updateOptions ) {
          updateOptions.from = Time.toSeconds( updateOptions.from );
          if ( updateOptions.from >= trackEvent.popcornOptions.duration ) {
            updateOptions.from = trackEvent.popcornOptions.from;
          }
          trackEvent.update( updateOptions );
        }

        for ( key in _pluginOptions ) {
          if ( _pluginOptions.hasOwnProperty( key ) ) {
            option = _pluginOptions[ key ];

            if ( option.elementType === "select" ) {
              _this.attachSelectChangeHandler( option.element, option.trackEvent, key, _this.updateTrackEventSafe );
            } else if ( option.elementType === "input" ) {
              if ( key === "source" ) {
                _this.attachInputChangeHandler( option.element, option.trackEvent, key, sourceCallback );
              } else if ( key === "from" ) {
                _this.attachInputChangeHandler( option.element, option.trackEvent, key, fromCallback );
              } else if ( option.element.type === "checkbox" ) {
                _this.attachCheckboxChangeHandler( option.element, option.trackEvent, key, checkboxCallback );
              } else {
                _this.attachInputChangeHandler( option.element, option.trackEvent, key, _this.updateTrackEventSafe );
              }
            } else if ( option.elementType === "textarea" ) {
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
      if ( trackEvent.popcornOptions.source ) {
        if ( !Array.isArray( trackEvent.popcornOptions.source ) ) {
          trackEvent.popcornOptions.source = [ trackEvent.popcornOptions.source ];
        }
        _pluginOptions.source.element.value = URI.stripUnique( trackEvent.popcornOptions.source[ 0 ] ).toString();
      }

      if ( trackEvent.popcornOptions.fallback ) {
        if ( !Array.isArray( trackEvent.popcornOptions.fallback ) ) {
          trackEvent.popcornOptions.fallback = [ trackEvent.popcornOptions.fallback ];
        }
        _pluginOptions.fallback.element.value = URI.stripUnique( trackEvent.popcornOptions.fallback[ 0 ] ).toString();
      }
      _this.setTrackEventUpdateErrorCallback( _this.setErrorState );
    }

    function onTrackEventUpdated( e ) {
      _trackEvent = e.target;

      _this.updatePropertiesFromManifest( _trackEvent );
      if ( _trackEvent.popcornOptions.source ) {
        if ( !Array.isArray( _trackEvent.popcornOptions.source ) ) {
          _trackEvent.popcornOptions.source = [ _trackEvent.popcornOptions.source ];
        }
        _pluginOptions.source.element.value = URI.stripUnique( _trackEvent.popcornOptions.source[ 0 ] ).toString();
      }
      if ( _trackEvent.popcornOptions.fallback ) {
        if ( !Array.isArray( _trackEvent.popcornOptions.fallback ) ) {
          _trackEvent.popcornOptions.fallback = [ _trackEvent.popcornOptions.fallback ];
        }
        _pluginOptions.fallback.element.value = URI.stripUnique( _trackEvent.popcornOptions.fallback[ 0 ] ).toString();
      }
      _this.setErrorState( false );
    }

    // Extend this object to become a TrackEventEditor
    Editor.TrackEventEditor.extend( _this, butter, rootElement, {
      open: function( parentElement, trackEvent ) {

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
