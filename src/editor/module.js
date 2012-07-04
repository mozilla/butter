/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

/**
 * Module: EditorModule
 *
 * Butter Module for Editors
 */
define( [ "core/eventmanager", "core/trackevent", "./editor",
          "util/lang", "text!layouts/editor-area.html" ],
  function( EventManagerWrapper, TrackEvent, Editor, 
            LangUtils, EDITOR_AREA_LAYOUT ){

  /**
   * Class: EventEditor
   *
   * Module which provides Editor functionality to Butter
   */
  function EventEditor( butter, moduleOptions ){

    moduleOptions = moduleOptions || {};

    var _currentEditor,
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
      var editorType = Editor.isRegistered( trackEvent.type ) || "default";
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
        var editorAreaDOMRoot = LangUtils.domFragment( EDITOR_AREA_LAYOUT );
        butter.ui.areas.editor = new butter.ui.Area( "editor-area", editorAreaDOMRoot );
        document.body.classList.add( "butter-editor-spacing" );
        document.body.appendChild( editorAreaDOMRoot );
      }
    };

  }

  this.register = Editor.register;

  EventEditor.__moduleName = "editor";

  return EventEditor;

}); //define
