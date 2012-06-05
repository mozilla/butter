/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function() {

  define( [ "core/eventmanager",
            "core/trackevent",
            "./editor"
          ], function(
            EventManagerWrapper,
            TrackEvent,
            Editor
          ){

    function EventEditor( butter, moduleOptions ){

      moduleOptions = moduleOptions || {};

      var _currentEditor,
          _this = this;

      EventManagerWrapper( _this );

      function openEditor( trackEvent ) {
        if( _currentEditor ) {
          _currentEditor.close();
        }
        _currentEditor = Editor.create( "default", butter );
        _currentEditor.open( butter.ui.areas.editor.element, trackEvent );
      }

      butter.listen( "trackeventcreated", function( e ){
        if( [ "target", "media" ].indexOf( e.data.by ) > -1 && butter.ui.contentState === "timeline" ){
          _this.edit( e.data.trackEvent );
        }
      });

      this.edit = function( trackEvent ){
        if ( !trackEvent || !( trackEvent instanceof TrackEvent ) ){
          throw new Error( "trackEvent must be valid to start an editor." );
        }
        openEditor( trackEvent );
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

      this._start = function( onModuleReady ){
        onModuleReady();
      };

    }

    this.register = Editor.register;

    EventEditor.__moduleName = "editor";

    return EventEditor;

  }); //define
}());
