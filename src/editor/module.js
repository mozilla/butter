/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function() {

  var DEFAULT_EDITOR = "default-editor.html";

  define( [ "core/logger", 
            "core/eventmanager", 
            "core/trackevent",
            "./editor"
          ], function( 
            Logger, 
            EventManager, 
            TrackEvent,
            Editor
          ){

    function EventEditor( butter, options ){

      options = options || {};

      var _editors = {},
          _logger = new Logger( "EventEditor" ),
          _defaultEditor = options[ "default" ] || DEFAULT_EDITOR,
          _em = new EventManager( this ),
          _editorContainer,
          _this = this;

      butter.listen( "trackeventcreated", function( e ){
        if( [ "target", "media" ].indexOf( e.data.by ) > -1 ){
          _this.edit( e.data.trackEvent );
        }
      });

      this.edit = function( trackEvent ){
        if ( !trackEvent || !( trackEvent instanceof TrackEvent ) ){
          throw new Error( "trackEvent must be valid to start an editor." );
        } //if

        var type = trackEvent.type;
        if ( !_editors[ type ] ){
          type = "default";
        } //if

        var editor = _editors[ type ];
        if( editor ){
          if( editor.frame === "iframe" && butter.ui.contentState === "editor" ){
            editor.close();
            setTimeout(function(){
              editor.open( trackEvent );
            }, butter.ui.TRANSITION_DURATION + 10);
          }
          else{
            editor.open( trackEvent );
          }
          return editor; 
        }
        else{
          throw new Error( "Editor " + type + " not found." );
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
            parentElement.style.opacity = "0";
          },
          transitionOutComplete: function(){
            parentElement.style.display = "none";
          }
        });

        parentElement.style.display = "none";

        _this.add( _defaultEditor, "default" );

        onModuleReady();
      }; //start

      butter.listen( "trackeventeditrequested", function( e ){
        _this.edit( e.target );
      });

    }

    EventEditor.__moduleName = "editor";

    return EventEditor;

  }); //define
})();
