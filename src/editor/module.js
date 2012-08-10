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
          "./default", "core/logger", "./header",
          "./media-editor", "./share-editor", "./settings-editor", "./ui-kit" ],
  function( EventManagerWrapper, TrackEvent, Editor,
            Toggler, LangUtils, EDITOR_AREA_LAYOUT,
            DefaultEditor, Logger, Header,

            //included here to register themselves
            MediaEditor, ShareEditor, SettingsEditor ){

  /**
   * Class: EventEditor
   *
   * Module which provides Editor functionality to Butter
   */
  function EventEditor( butter, moduleOptions, ButterNamespace ){

    moduleOptions = moduleOptions || {};

    var _currentEditor,
        _editorAreaDOMRoot = LangUtils.domFragment( EDITOR_AREA_LAYOUT, ".butter-editor-area" ),
        _editorContentArea = _editorAreaDOMRoot.querySelector( ".butter-editor-content" ),
        _header,
        _toggler,
        _this = this,
        _logger = new Logger( butter.id );

    EventManagerWrapper( _this );

    ButterNamespace.Editor = Editor;

    _header = new Header( _editorAreaDOMRoot, _this );

    /**
     * Member: openEditor
     *
     * Opens an editor corresponding to the given editor name if it exists
     *
     * @param {String} editorName: Name of editor to open
     */
    _this.openEditor = function( editorName, forceTrayOpen, openData ) {
      // If the editor has never been used before, open it now
      _editorAreaDOMRoot.classList.remove( "minimized" );
      document.body.classList.remove( "editor-minimized" );
      _toggler.state = false;

      if( _currentEditor ) {
        _currentEditor.close();
      }
      _currentEditor = Editor.create( editorName, butter );
      _currentEditor.open( _editorContentArea, openData );
      
      _header.setFocus( editorName );

      return _currentEditor;
    };

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
      var editorType = Editor.isRegistered( trackEvent.type ) ? trackEvent.type : "default";
      return _this.openEditor( editorType, false, trackEvent );
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
      var trackEventMouseUp = function ( e ) {
        if( butter.selectedEvents.length === 1 && !trackEvent.dragging && !view.resizing ) {
          trackEvent.selected = true;
          _this.editTrackEvent( trackEvent );
        }
      };

      element.addEventListener( "mouseup", trackEventMouseUp, true );

      view.listen( "trackeventdragstarted", function() {
        element.removeEventListener( "mouseup", trackEventMouseUp, true );
      });

      view.listen( "trackeventdragstopped", function() {
        element.addEventListener( "mouseup", trackEventMouseUp, true );
      });

      butter.listen( "trackeventremoved", function ( e ) {
        if ( e.data === trackEvent ) {
          element.removeEventListener( "mouseup", trackEventMouseUp, true );
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
      _toggler = new Toggler( _editorAreaDOMRoot.querySelector( ".butter-editor-close-btn" ),
        function( e ) {
          var newState = !_editorAreaDOMRoot.classList.contains( "minimized" );

          var onTransitionEnd = function(){
            _editorAreaDOMRoot.removeEventListener( "transitionend", onTransitionEnd, false );
            _editorAreaDOMRoot.removeEventListener( "oTransitionEnd", onTransitionEnd, false );
            _editorAreaDOMRoot.removeEventListener( "webkitTransitionEnd", onTransitionEnd, false );
            _this.dispatch( "editorminimized", newState );
          };

          _toggler.state = newState;
          if ( newState ) {
            document.body.classList.add( "editor-minimized" );
            _editorAreaDOMRoot.classList.add( "minimized" );
          }
          else {
            document.body.classList.remove( "editor-minimized" );
            _editorAreaDOMRoot.classList.remove( "minimized" );
          }

          //Listen for the end of the "minimize" transition
          _editorAreaDOMRoot.addEventListener( "transitionend", onTransitionEnd, false );
          _editorAreaDOMRoot.addEventListener( "oTransitionEnd", onTransitionEnd, false );
          _editorAreaDOMRoot.addEventListener( "webkitTransitionEnd", onTransitionEnd, false );
          
        }, "Show/Hide Editor", true );

      var editorsToLoad = [],
          editorsLoaded = 0;

      if( butter.config.value( "ui" ).enabled !== false ){
        document.body.classList.add( "butter-editor-spacing" );

        // Start minimized
        _editorAreaDOMRoot.classList.add( "minimized" );
        document.body.classList.add( "editor-minimized" );

        butter.ui.setEditor( _editorAreaDOMRoot );

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
          }, function( e ) {
            _logger.log( "Couldn't load editor " + e.srcElement.src );
            
            if ( ++editorsLoaded === editorsToLoad.length ) {
              onModuleReady();
            }
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
