/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "text!./default.html", "editor/editor", "util/lang" ],
  function( LAYOUT_SRC, Editor, LangUtils ) {

  /**
   * Class: DefaultEditor
   *
   * Implements the default editor as a general fallback editor
   *
   * @param {DOMElement} rootElement: Root DOM element containing the fundamental editor content
   * @param {Butter} butter: An instance of Butter
   * @param {TrackEvent} TrackEvent: The TrackEvent to edit
   */
  function DefaultEditor( rootElement, butter, compiledLayout, events ) {

    var _this = this;

    events = events || {};

    var _rootElement = rootElement,
        _trackEvent,
        _targets = [ butter.currentMedia ].concat( butter.targets ),
        _messageContainer = _rootElement.querySelector( "div.error-message" ),
        _oldOpenEvent = events.open,
        _oldCloseEvent = events.close;

    function onTrackEventUpdated( e ) {
      _this.updatePropertiesFromManifest( e.target );
      _this.setErrorState( false );
    }

    // Extend this object to become a TrackEventEditor
    events.open = function ( parentElement, trackEvent ) {
      var targetList,
          optionsContainer = _rootElement.querySelector( ".editor-options" ),
          selectElement;

      _this.applyExtraHeadTags( compiledLayout );

      _trackEvent = trackEvent;

      optionsContainer.appendChild( _this.createStartEndInputs( trackEvent, _this.updateTrackEventSafe ) );

      _this.createPropertiesFromManifest({
        trackEvent: trackEvent,
        callback: function( elementType, element, trackEvent, name ) {
          if ( elementType === "select" ) {
            _this.attachSelectChangeHandler( element, trackEvent, name, _this.updateTrackEventSafe );
          }
          else {
            if ( element.type === "checkbox" ) {
              _this.attachCheckboxChangeHandler( element, trackEvent, name, _this.updateTrackEventSafe );
            }
            else {
              _this.attachInputChangeHandler( element, trackEvent, name, _this.updateTrackEventSafe );
            }
          }
        },
        basicContainer: optionsContainer,
        ignoreManifestKeys: [ "target", "start", "end" ]
      });

      if ( trackEvent.manifest.options.target && !trackEvent.manifest.options.target.hidden ) {
        targetList = _this.createTargetsList( _targets );
        selectElement = targetList.querySelector( "select" );
        // Attach the onchange handler to trackEvent is updated when <select> is changed
        _this.attachSelectChangeHandler( selectElement, trackEvent, "target" );
        optionsContainer.appendChild( targetList );
      }

      _this.updatePropertiesFromManifest( trackEvent, null, true );

      // Catch the end of a transition for when the error message box opens/closes
      if ( _this.scrollbar ) {
        LangUtils.applyTransitionEndListener( _messageContainer.parentNode, _this.scrollbar.update );
      }

      _this.scrollbar.update();

      _this.setTrackEventUpdateErrorCallback( _this.setErrorState );

      // Update properties when TrackEvent is updated
      trackEvent.listen( "trackeventupdated", onTrackEventUpdated );

      if ( _oldOpenEvent ) {
        _oldOpenEvent.apply( this, arguments );
      }
    };
    events.close = function () {
      _trackEvent.unlisten( "trackeventupdated", onTrackEventUpdated );
      if ( _oldCloseEvent ) {
        _oldCloseEvent.apply( this, arguments );
      }
    };

    Editor.TrackEventEditor.extend( _this, butter, rootElement, events );
  }

  Editor.register( "default", LAYOUT_SRC, DefaultEditor );

  return {
    extend: function( extendObject, rootElement, butter, compiledLayout, events ){
      return DefaultEditor.apply( extendObject, [ rootElement, butter, compiledLayout, events ] );
    },
    EDITOR_SRC: LAYOUT_SRC
  };

});
