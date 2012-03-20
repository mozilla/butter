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
          _defaultEditor = options.default || DEFAULT_EDITOR,
          _em = new EventManager( this ),
          _this = this;

      this.edit = function( trackEvent ){
        if ( !trackEvent || !( trackEvent instanceof TrackEvent ) ){
          throw new Error( "trackEvent must be valid to start an editor." );
        } //if

        var type = trackEvent.type;
        if ( !_editors[ type ] ){
          type = "default";
        } //if

        var editor = _editors[ type ];
        editor.open( trackEvent );
        return editor;
      }; //edit

      this.add = function( source, type, frameType ){
        if ( !type || !source ) {
          throw new Error( "Can't create an editor without a plugin type and editor source" );
        } //if
        var editor = _editors[ type ] = new Editor( butter, source, type, frameType, {
        });
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

      this._start = function(){
        _this.add( _defaultEditor, "default" );
      }; //start

      butter.listen( "trackeventeditrequested", function( e ){
        _this.edit( e.target );
      });

    }; //Editor

    EventEditor.__moduleName = "editor";

    return EventEditor;

  }); //define
})();
