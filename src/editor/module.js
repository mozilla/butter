/*********************************************************************************

Copyright (C) 2011 by Mozilla Foundation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

**********************************************************************************/

(function() {

  const DEFAULT_EDITOR = "default-editor.html";

  define( [ "core/logger", 
            "core/eventmanager", 
            "core/trackevent",
            "./editor"
          ], function( 
            Logger, 
            EventManager, 
            TrackEvent,
            Editor
          ) {

    var EventEditor = function( butter, options ) {

      options = options || {};

      var _editors = {},
          _logger = new Logger( "EventEditor" ),
          _em = new EventManager( this ),
          _this = this;

      this.edit = function( trackEvent ) {
        if ( !trackEvent || !( trackEvent instanceof TrackEvent ) ) {
          throw new Error( "Can't editor undefined trackEvent" );
        } //if

        var type = trackEvent.type;
        if ( !_editors[ type ] ) {
          type = "default";
        } //if
        var editor = _editors[ type ];
        editor.open( trackEvent );
        return editor;
      }; //edit

      this.add = function( source, type, frameType ) {
        if ( !type || !source ) {
          throw new Error( "Can't create an editor without a plugin type and editor source" );
        } //if
        var editor = _editors[ type ] = new Editor( butter, source, type, frameType, {
        });
        return editor;
      }; //add
            
      this.remove = function( type ) {
        if ( !type ) {
          return;
        }
        var oldSource = _editors[ type ];
        _editors[ type ] = undefined;
        return oldSource;
      }; //remove

      var defaultEditor = options.defaultEditor || DEFAULT_EDITOR;
      _this.add( defaultEditor, "default" );

      butter.listen( "trackeventeditrequested", function( e ){
        _this.edit( e.target );
      });

    }; //EventEditor

    return EventEditor;
  }); //define
})();
