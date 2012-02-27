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

define( [ "core/eventmanager" ], function( EventManager ) {

  const DEFAULT_DIMS = [ 400, 400 ];
  const DEFAULT_FRAME_TYPE = "window";

  var __guid = 0;

  function Editor( butter, source, type, frameType, options ) {
    var _id = __guid++,
        _frameType = frameType || DEFAULT_FRAME_TYPE,
        _source = source,
        _type = type,
        _dialogName = "editor-" + type + _id,
        _dims = DEFAULT_DIMS.slice(),
        _em = new EventManager( "Editor-" + _type ),
        _this = this;

    _dims[ 0 ] = options.width || _dims[ 0 ];
    _dims[ 1 ] = options.height || _dims[ 1 ];

    butter.dialog.add( _dialogName, {
      type: _frameType,
      modal: true,
      url: _source
    });

    this.open = function( trackEvent ) {

      function onTrackEventUpdated( e ){
        butter.dialog.send( _dialogName, "trackeventupdated", trackEvent.popcornOptions );
      } //onTrackEventUpdated

      function onTrackEventUpdateFailed( e ) {
        butter.dialog.send( _dialogName, "trackeventupdatefailed", e.data );
      } //onTrackEventUpdateFailed

      butter.dialog.open( _dialogName, {
        open: function( e ) {
          var targets = [];
          for( var i = 0, l = butter.targets.length; i < l; i++ ) {
            targets.push( butter.targets[ i ].elementID );
          }
          butter.dialog.send( _dialogName, "trackeventdata", {
            manifest: Popcorn.manifest[ trackEvent.type ],
            popcornOptions: trackEvent.popcornOptions,
            targets: targets
          });
          trackEvent.listen( "trackeventupdated", onTrackEventUpdated );
          trackEvent.listen( "trackeventupdatefailed", onTrackEventUpdateFailed );
        },
        submit: function( e ) {
          trackEvent.update( e.data );
        },
        close: function( e ){
          trackEvent.unlisten( "trackeventupdated", onTrackEventUpdated );
          trackEvent.unlisten( "trackeventupdatefailed", onTrackEventUpdateFailed );
        }
      });
    }; //open

    Object.defineProperties( _this, {
      type: {
        enumerable: true,
        get: function() {
          return _type;
        }
      },
      frame: {
        enumerable: true,
        get: function() {
          return _frameType === "window";
        }
      },
      size: {
        enumerable: true,
        get: function() {
          return { width: _dims[ 0 ], height: _dims[ 1 ] };
        },
        set: function( val ) {
          val = val || {};
          _dims[ 0 ] = val.width || _dims[ 0 ];
          _dims[ 1 ] = val.height || _dims[ 1 ];
        }
      }
    });

  } //Editor

  return Editor;

});


