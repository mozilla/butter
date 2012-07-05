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
  function EventEditor( butter, moduleOptions ){

    moduleOptions = moduleOptions || {};

    var _currentEditor,
        _firstUse = false,
        _editorAreaDOMRoot,
        _this = this;

    EventManagerWrapper( _this );

    /**
     * Member: openEditor
     *
     * Open the editor corresponding to the type of the given TrackEvent
     *
     * @param {TrackEvent} trackEvent: TrackEvent to edit
     */
    function openEditor( trackEvent ) {
      // If the editor has never been used before, open it now
      if ( !_firstUse ) {
        _firstUse = true;
        _editorAreaDOMRoot.classList.remove( "minimized" );
      }

      var editorType = Editor.isRegistered( trackEvent.type ) ? trackEvent.type : "default";
      if( _currentEditor ) {
        _currentEditor.close();
      }
      _currentEditor = Editor.create( editorType, butter );
      _currentEditor.open( butter.ui.areas.editor.element, trackEvent );
      return _currentEditor;
    }

    // When a TrackEvent is somewhere in butter, open its editor immediately.
    butter.listen( "trackeventcreated", function( e ){
      if( [ "target", "media" ].indexOf( e.data.by ) > -1 && butter.ui.contentState === "timeline" ){
        openEditor( e.data.trackEvent );
      }
    });

    /**
     * Member: edit
     *
     * Open the editor of corresponding to the type of the given TrackEvent
     *
     * @param {TrackEvent} trackEvent: TrackEvent to edit
     */
    this.edit = function( trackEvent ){
      if ( !trackEvent || !( trackEvent instanceof TrackEvent ) ){
        throw new Error( "trackEvent must be valid to start an editor." );
      }
      return openEditor( trackEvent );
    };

    butter.listen( "trackeventadded", function ( e ) {
      var trackEvent = e.data;

      var trackEventClicked = function ( e ) {
        openEditor( trackEvent );
      };

      e.data.view.element.addEventListener( "mouseup", trackEventClicked, true );

      butter.listen( "trackeventremoved", function ( e ) {
        if ( e.data === trackEvent ) {
          e.data.view.element.removeEventListener( "mouseup", trackEventClicked, true );
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
      onModuleReady();
      if( butter.config.value( "ui" ).enabled !== false ){
        _editorAreaDOMRoot = LangUtils.domFragment( EDITOR_AREA_LAYOUT );
        butter.ui.areas.editor = new butter.ui.Area( "editor-area", _editorAreaDOMRoot );
        var toggler = new Toggler( function( e ) {
          var newState = !_editorAreaDOMRoot.classList.contains( "minimized" );
          toggler.state = newState;
          if ( newState ) {
            _editorAreaDOMRoot.classList.add( "minimized" );
          }
          else {
            _editorAreaDOMRoot.classList.remove( "minimized" );
          }
        }, "Show/Hide Editor" );
        _editorAreaDOMRoot.appendChild( toggler.element );
        document.body.classList.add( "butter-editor-spacing" );

        // Start minimized
        _editorAreaDOMRoot.classList.add( "minimized" );

        document.body.appendChild( _editorAreaDOMRoot );

        Editor.baseDir = butter.config.value( "baseDir" );
        Butter.Editor = Editor;

        var config = butter.config.value( "editor" );
        for ( var editorName in config ) {
          if ( config.hasOwnProperty( editorName ) ) {
            butter.loader.load({
              url: config[ editorName ],
              type: "js"
            });
          }
        }
      }
    };

  }

  this.register = Editor.register;

  EventEditor.__moduleName = "editor";

  return EventEditor;

}); //define
