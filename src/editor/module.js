/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function() {

  define( [ "core/logger",
            "core/eventmanager",
            "core/trackevent",
            "./editor"
          ], function(
            Logger,
            EventManagerWrapper,
            TrackEvent,
            Editor
          ){

    function EventEditor( butter, moduleOptions ){

      moduleOptions = moduleOptions || {};

      var _editors = {},
          _logger = new Logger( "EventEditor" ),
          _editorContainer,
          _openEditor,
          _this = this;

      EventManagerWrapper( _this );

      butter.listen( "trackeventcreated", function( e ){
        if( [ "target", "media" ].indexOf( e.data.by ) > -1 && butter.ui.contentState === "timeline" ){
          _this.edit( e.data.trackEvent );
        }
      });

      function editorClosed( e ){
        if( _openEditor.frame === "iframe" ){
          if( butter.ui.contentState === "editor" ){
            butter.ui.popContentState( "editor" );
          }
        }
        _openEditor.unlisten( "close", editorClosed );
        _openEditor = null;
      }

      function editorOpened( e ){
        if( _openEditor.frame === "iframe" ){
          if( butter.ui.contentState !== "editor" ){
            butter.ui.pushContentState( "editor" );
          }
        }
      }

      this.edit = function( trackEvent ){
        if ( !trackEvent || !( trackEvent instanceof TrackEvent ) ){
          throw new Error( "trackEvent must be valid to start an editor." );
        } //if

        var type = trackEvent.type;
        if ( !_editors[ type ] ){
          type = "default";
        } //if
        if( !_openEditor ){
          var editor = _editors[ type ];
          if( editor ){
            _openEditor = editor;
            editor.listen( "open", editorOpened );
            editor.open( trackEvent );
            editor.listen( "close", editorClosed );
          }
          else{
            throw new Error( "Editor " + type + " not found." );
          }
        }
      }; //edit

      this.add = function( source, type, frameType ){
        if ( !type || !source ) {
          throw new Error( "Can't create an editor without a plugin type and editor source" );
        } //if
        var editor = _editors[ type ] = new Editor( butter, source, type, frameType, _editorContainer );
        return editor;
      }; //add

      this.remove = function( type ){
        if ( !type ) {
          return;
        }
        var oldSource = _editors[ type ];
        _editors[ type ] = undefined;
       return oldSource;
      }; //remove

      function trackEventDoubleClicked( e ){
        _this.edit( e.target.trackEvent );
      } //trackEventDoubleClicked

      butter.listen( "trackeventadded", function( e ){
        e.data.view.listen( "trackeventdoubleclicked", trackEventDoubleClicked, false );
      });

      butter.listen( "trackeventremoved", function( e ){
        e.data.view.unlisten( "trackeventdoubleclicked", trackEventDoubleClicked, false );
      });

      this._start = function( onModuleReady ){
        var parentElement = document.createElement( "div" );
        parentElement.id = "butter-editor";

        _editorContainer = document.createElement( "div" );
        _editorContainer.id = "editor-container";
        parentElement.appendChild( _editorContainer );

        parentElement.classList.add( "fadable" );

        butter.ui.areas.work.addComponent( parentElement, {
          states: [ "editor" ],
          transitionIn: function(){
            parentElement.style.display = "block";
            setTimeout(function(){
              parentElement.style.opacity = "1";
            }, 0);
          },
          transitionInComplete: function(){

          },
          transitionOut: function(){
            if( _openEditor ){
              _openEditor.close();
            }
            parentElement.style.opacity = "0";
          },
          transitionOutComplete: function(){
            parentElement.style.display = "none";
          }
        });

        parentElement.style.display = "none";

        for( var editorName in moduleOptions ){
          if( moduleOptions.hasOwnProperty( editorName ) ){
            _this.add( moduleOptions[ editorName ], editorName );
          }
        }

        onModuleReady();
      }; //start

      butter.listen( "trackeventeditrequested", function( e ){
        _this.edit( e.target );
      });

    }

    EventEditor.__moduleName = "editor";

    return EventEditor;

  }); //define
}());
