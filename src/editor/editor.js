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
console.log("open!");
/*
      var updateEditor = function( e ){
        var sendObj = {
          "id": e.data.id, 
          "options": e.data.popcornOptions
        };
       // _comm.send( _editorLinkName, sendObj, "trackeventupdated" );
      };
      var checkRemoved = function( e ) {
        //_comm.send( _editorLinkName, e.data.id, "trackeventremoved" );
      };
      var targetAdded = function( e ) {
        //_comm.send( _editorLinkName, butter.targets, "domtargetsupdated" );
      };
      var clientDimsUpdated = function( e ) {
        var dims = e.data;
        _dims[ 1 ] = dims.height;
        _dims[ 0 ] = dims.width;
        _em.dispatch( "clientdimsupdated", _this );
      };
      var undoListeners = function() {
        butter.unlisten( "trackeventupdated", updateEditor );
        butter.unlisten( "targetadded", targetAdded );
        butter.unlisten( "trackeventremoved", checkRemoved );
        butter.unlisten( "clientdimsupdated", clientDimsUpdated );
        //_comm.unlisten( _editorLinkName, "okayclicked" );
        //_comm.unlisten( _editorLinkName, "applyclicked" );
        //_comm.unlisten( _editorLinkName, "deleteclicked" );
        //_comm.unlisten( _editorLinkName, "cancelclicked" );
        //_comm.unlisten( _editorLinkName, "clientdimsupdated" );
        //_comm.destroy( _editorLinkName );
      };

      function filterKnownFields( fields ) {
        var val;

        function checkNumber( num ) {
          var val = parseFloat( num );
          if ( isNaN( val ) || val < 0 ) {
            val = 0;
          }
          return val;
        } //checkNumber

        fields[ "start" ] = checkNumber( fields[ "start" ] );
        fields[ "end" ] = checkNumber( fields[ "end" ] );
      } //filterKnownFields

          _comm.listen( _editorLinkName, "applyclicked", function( e ) {
            var newOptions = e.data;
            filterKnownFields( newOptions );
            trackEvent.update( newOptions );
          });

          _comm.listen( _editorLinkName, "deleteclicked", function() {
            butter.removeTrackEvent( trackEvent );
            if ( _frameTypeWindow.close ) {
              _frameTypeWindow.close();
            }
            if ( _frameTypeWindow && _frameTypeWindow.parentNode ) {
              _frameTypeWindow.parentNode.removeChild( _frameTypeWindow );
            }
            undoListeners();
            _frameTypeWindow = undefined;
            _em.dispatch( "trackeditclosed", _this );
          });

          _comm.listen( _editorLinkName, "cancelclicked", function() {
            if ( _frameTypeWindow.close ) {
              _frameTypeWindow.close();
            }
            if ( _frameTypeWindow && _frameTypeWindow.parentNode ) {
              _frameTypeWindow.parentNode.removeChild( _frameTypeWindow );
            }
            undoListeners();
            _frameTypeWindow = undefined;
            _em.dispatch( "trackeditclosed", _this );
          });


        var checkEditorInterval;
        function editorReady() {
          succeeded = true;
          _em.dispatch( "trackeditstarted", _this );
          //_comm.unlisten( _editorLinkName, "ready", editorReady );
          clearInterval( checkEditorInterval );
          var targetCollection = butter.targets, targetArray = [];
          for ( var i=0, l=targetCollection.length; i<l; ++i ) {
            targetArray.push( [ targetCollection[ i ].name, targetCollection[ i ].id ] );
          }
          trackEvent.manifest = butter.getManifest( trackEvent.type );
          _comm.send( _editorLinkName, {
            "trackEvent": trackEvent, 
            "targets": targetArray,
            "id": trackEvent.id
          }, "edittrackevent");
        }
        checkEditorInterval = setInterval( function() {
          //_comm.send( _editorLinkName, "ready", "ready" );
        }, 500 );
        setTimeout( function() {
          clearInterval( checkEditorInterval );
          _comm.unlisten( _editorLinkName, "ready", editorReady );
          if ( succeeded ) {
            return;
          }
          if ( _frameTypeWindow && _frameTypeWindow.close ) {
            _frameTypeWindow.close();
          }
          if ( _frameTypeWindow && _frameTypeWindow.parentNode ) {
            _frameTypeWindow.parentNode.removeChild( _frameTypeWindow );
          }
          undoListeners();
          _frameTypeWindow = undefined;
          _em.dispatch( "trackeditfailed", _this );
        }, 5000 );

      if ( _frameType === "window" ) {
        if ( !_frameTypeWindow ) {
          _frameTypeWindow = window.open( _source, "", "width=" + _dims[ 0 ] + ",height=" + _dims[ 1 ] + ",menubar=no,toolbar=no,location=no,status=no" );
          setupServer( "window" );
          _frameTypeWindow.addEventListener( "beforeunload", function() {
            undoListeners();
            _em.dispatch( "trackeditclosed", _this );
            _frameTypeWindow = undefined;
          }, false );
        }
      }
      else {
        if ( _frameTypeContainer ) {
          clearTarget();
        }
        _frameTypeWindow = document.createElement( "iframe" );
        _frameTypeWindow.id = "butter-editor-iframe";
        _frameTypeWindow.style.width = _dims[ 0 ];
        _frameTypeWindow.style.height = _dims[ 1 ];
        setupServer( "iframe" );
        _frameTypeWindow.setAttribute( "src", _source );
        _frameTypeWindow.src = _source;
        _frameTypeContainer.appendChild( _frameTypeWindow );
      } //if

*/

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


