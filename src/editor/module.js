/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

/**
 * Module: EditorModule
 *
 * Butter Module for Editors
 */
define( [ "core/eventmanager", "core/trackevent", "./editor",
          "ui/toggler", "util/lang", "text!layouts/editor-area.html",
          "./default" ],
  function( EventManagerWrapper, TrackEvent, Editor,
            Toggler, LangUtils, EDITOR_AREA_LAYOUT,
            DefaultEditor ){

  /**
   * Class: EventEditor
   *
   * Module which provides Editor functionality to Butter
   */
  function EventEditor( butter, moduleOptions, ButterNamespace ){

    moduleOptions = moduleOptions || {};

    var _currentEditor,
        _editorAreaDOMRoot = LangUtils.domFragment( EDITOR_AREA_LAYOUT ),
        _toggler,
        _this = this;

    EventManagerWrapper( _this );

    ButterNamespace.Editor = Editor;

    /**
     * Member: editTrackEvent
     *
     * Open the editor corresponding to the type of the given TrackEvent
     *
     * @param {TrackEvent} trackEvent: TrackEvent to edit
     */
    _this.editTrackEvent = function( trackEvent ) {
      if ( !trackEvent || !( trackEvent instanceof TrackEvent ) ) {
        throw new Error( "trackEvent must be valid to start an editor." );
      }

      _editorAreaDOMRoot.classList.remove( "minimized" );
      _toggler.state = false;

      var editorType = Editor.isRegistered( trackEvent.type ) ? trackEvent.type : "default";
      if( _currentEditor ) {
        _currentEditor.close();
      }
      _currentEditor = Editor.create( editorType, butter );
      _currentEditor.open( _editorAreaDOMRoot, trackEvent );
      return _currentEditor;
    };

    // When a TrackEvent is somewhere in butter, open its editor immediately.
    butter.listen( "trackeventcreated", function( e ) {
      if( [ "target", "media" ].indexOf( e.data.by ) > -1 && butter.ui.contentState === "timeline" ){
        _this.editTrackEvent( e.data.trackEvent );
      }
    });

    butter.listen( "trackeventadded", function ( e ) {
      var trackEvent = e.data,
          view = trackEvent.view,
          element = trackEvent.view.element;

      // Open a new editor on a single click
      var trackEventClicked = function ( e ) {
        if( butter.selectedEvents.length === 1 && !trackEvent.dragging ) {
          _this.editTrackEvent( trackEvent );
        }
      };

      element.addEventListener( "mouseup", trackEventClicked, true );

      view.listen( "trackeventdragstarted", function() {
        element.removeEventListener( "mouseup", trackEventClicked, true );
      });

      view.listen( "trackeventdragstopped", function() {
        element.addEventListener( "mouseup", trackEventClicked, true );
      });

      butter.listen( "trackeventremoved", function ( e ) {
        if ( e.data === trackEvent ) {
          element.removeEventListener( "click", trackEventClicked, true );
        }
      });
    });

    /**
     * Member: _start
     *
     * Prepares this module for Butter startup
     *
     * @param {Function} onModuleReady: Callback to signify that module is ready
     */
    this._start = function( onModuleReady ){
      _toggler = new Toggler( function( e ) {
        var newState = !_editorAreaDOMRoot.classList.contains( "minimized" );
        _toggler.state = newState;
        if ( newState ) {
          document.body.classList.add( "editor-minimized" );
          _editorAreaDOMRoot.classList.add( "minimized" );
        }
        else {
          document.body.classList.remove( "editor-minimized" );
          _editorAreaDOMRoot.classList.remove( "minimized" );
        }
      }, "Show/Hide Editor", true );

      var editorsToLoad = [];

      if( butter.config.value( "ui" ).enabled !== false ){
        butter.ui.areas.editor = new butter.ui.Area( "editor-area", _editorAreaDOMRoot );
        _editorAreaDOMRoot.appendChild( _toggler.element );
        document.body.classList.add( "butter-editor-spacing" );

        // Start minimized
        _editorAreaDOMRoot.classList.add( "minimized" );
        document.body.classList.add( "editor-minimized" );

        document.body.appendChild( _editorAreaDOMRoot );

        var config = butter.config.value( "editor" );
        for ( var editorName in config ) {
          if ( config.hasOwnProperty( editorName ) ) {
            editorsToLoad.push({
              url: config[ editorName ],
              type: "js"
            });
          }
        }

        if ( editorsToLoad.length > 0 ){
          butter.loader.load( editorsToLoad, function() {
            Editor.loadUrlSpecifiedLayouts( onModuleReady, butter.config.value( "baseDir" ) );
          });
        }
        else {
          onModuleReady();
        }

      }
      else {
        onModuleReady();
      }
    };

  }

  this.register = Editor.register;

  EventEditor.__moduleName = "editor";

  return EventEditor;

}); //define
