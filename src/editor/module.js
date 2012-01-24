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

  define( [ "core/logger", "core/eventmanager", "core/trackevent", "comm/comm" ], function( Logger, EventManager, TrackEvent, Comm ) {

    var __editorGuid = 0;

    var EventEditor = function( butter, options ) {

      options = options || {};

      var _editors = {},
          _comm = new Comm.CommServer(),
          _logger = new Logger( "EventEditor" ),
          _em = new EventManager( { logger: _logger } ),
          _editorGuid = 0,
          _this = this;

      _em.apply( "EventEditor", this );

      var Editor = function ( options ) {
        var _target = options.target,
            _source = options.source,
            _editorHeight,
            _editorWidth,
            _targetContainer,
            _targetWindow,
            _editorLinkName = "editorLink" + __editorGuid++
            _this = this;

        _editorWidth = options.editorWidth || 400;
        _editorHeight = options.editorHeight || 400;

        function clearTarget() {
          while ( _targetContainer.firstChild ) {
            _targetContainer.removeChild( _targetContainer.firstChild );
          }
        } //clearTarget

        if ( typeof _target === "string" && _target !== "window" ) {
          _targetContainer = document.getElementById( target );
        } //if

        this.construct = function( trackEvent ) {
          var updateEditor = function( e ){
            var sendObj = {
              "id": e.data.id, 
              "options": e.data.popcornOptions
            };
            _comm.send( _editorLinkName, sendObj, "trackeventupdated" );
          };
          var checkRemoved = function( e ) {
            _comm.send( _editorLinkName, e.data.id, "trackeventremoved" );
          };
          var targetAdded = function( e ) {
            _comm.send( _editorLinkName, butter.targets, "domtargetsupdated" );
          };
          var clientDimsUpdated = function( e ) {
            var dims = e.data;
            _editorHeight = dims.height;
            _editorWidth = dims.width;
            _em.dispatch( "clientdimsupdated", _this );
          };
          var undoListeners = function() {
            butter.unlisten( "trackeventupdated", updateEditor );
            butter.unlisten( "targetadded", targetAdded );
            butter.unlisten( "trackeventremoved", checkRemoved );
            butter.unlisten( "clientdimsupdated", clientDimsUpdated );
            _comm.unlisten( _editorLinkName, "okayclicked" );
            _comm.unlisten( _editorLinkName, "applyclicked" );
            _comm.unlisten( _editorLinkName, "deleteclicked" );
            _comm.unlisten( _editorLinkName, "cancelclicked" );
            _comm.unlisten( _editorLinkName, "clientdimsupdated" );
            _comm.destroy( _editorLinkName );
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

          function setupServer( bindingType ) {
            var succeeded = false;

            var binding = bindingType === "window" ? "bindWindow" : "bindFrame";
            _comm[ binding ]( _editorLinkName, _targetWindow, function() {
              butter.listen( "trackeventupdated", updateEditor );
              butter.listen( "targetadded", targetAdded );
              butter.listen( "trackeventremoved", checkRemoved );
              
              _comm.listen( _editorLinkName, "okayclicked", function( e ){
                var newOptions = e.data;
                filterKnownFields( newOptions );
                if ( _targetWindow.close ) {
                  _targetWindow.close();
                }
                if ( _targetWindow && _targetWindow.parentNode ) {
                  _targetWindow.parentNode.removeChild( _targetWindow );
                }
                undoListeners();
                _targetWindow = undefined;
                trackEvent.update( newOptions );
                _em.dispatch( "trackeditclosed", _this );
              });

              _comm.listen( _editorLinkName, "applyclicked", function( e ) {
                var newOptions = e.data;
                filterKnownFields( newOptions );
                trackEvent.update( newOptions );
              });

              _comm.listen( _editorLinkName, "deleteclicked", function() {
                butter.removeTrackEvent( trackEvent );
                if ( _targetWindow.close ) {
                  _targetWindow.close();
                }
                if ( _targetWindow && _targetWindow.parentNode ) {
                  _targetWindow.parentNode.removeChild( _targetWindow );
                }
                undoListeners();
                _targetWindow = undefined;
                _em.dispatch( "trackeditclosed", _this );
              });

              _comm.listen( _editorLinkName, "cancelclicked", function() {
                if ( _targetWindow.close ) {
                  _targetWindow.close();
                }
                if ( _targetWindow && _targetWindow.parentNode ) {
                  _targetWindow.parentNode.removeChild( _targetWindow );
                }
                undoListeners();
                _targetWindow = undefined;
                _em.dispatch( "trackeditclosed", _this );
              });

            });

            _comm.listen( _editorLinkName, "ready", editorReady );
            _comm.listen( _editorLinkName, "clientdimsupdated", clientDimsUpdated );

            var checkEditorInterval;
            function editorReady() {
              succeeded = true;
              _em.dispatch( "trackeditstarted", _this );
              _comm.unlisten( _editorLinkName, "ready", editorReady );
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
              _comm.send( _editorLinkName, "ready", "ready" );
            }, 500 );
            setTimeout( function() {
              clearInterval( checkEditorInterval );
              _comm.unlisten( _editorLinkName, "ready", editorReady );
              if ( succeeded ) {
                return;
              }
              if ( _targetWindow && _targetWindow.close ) {
                _targetWindow.close();
              }
              if ( _targetWindow && _targetWindow.parentNode ) {
                _targetWindow.parentNode.removeChild( _targetWindow );
              }
              undoListeners();
              _targetWindow = undefined;
              _em.dispatch( "trackeditfailed", _this );
            }, 5000 );

          } //setupServer

          if ( _target === "window" ) {
            if ( !_targetWindow ) {
              _targetWindow = window.open( _source, "", "width=" + _editorWidth + ",height=" + _editorHeight + ",menubar=no,toolbar=no,location=no,status=no" );
              setupServer( "window" );
              _targetWindow.addEventListener( "beforeunload", function() {
                undoListeners();
                _em.dispatch( "trackeditclosed", _this );
                _targetWindow = undefined;
              }, false );
            }
          }
          else {
            if ( _targetContainer ) {
              clearTarget();
            }
            _targetWindow = document.createElement( "iframe" );
            _targetWindow.id = "butter-editor-iframe";
            _targetWindow.style.width = _editorWidth;
            _targetWindow.style.height = _editorHeight;
            setupServer( "iframe" );
            _targetWindow.setAttribute( "src", _source );
            _targetWindow.src = _source;
            _targetContainer.appendChild( _targetWindow );
          } //if


        }; //construct

        this.setDimensions = function( width, height ) {
          if ( !height ) {
            height = width.height;
            width = width.width;
          }
          _editorWidth = width || _editorWidth;
          _editorHeight = height || _editorHeight;
        }; //setDimensions

        Object.defineProperty( this, "type", {
          get: function() { return _target === "window" ? "window" : "iframe"; }
        });

        Object.defineProperty( this, "size", {
          get: function() { return { width: _editorWidth, height: _editorHeight }; },
          set: function( val ) {
            val = val || {};
            _editorWidth = val.width || _editorWidth;
            _editorHeight = val.height || _editorHeight;
          }
        });

        Object.defineProperty( this, "window", {
          get: function() { return _targetWindow; }
        });
        
      } //Editor

      if ( !options || typeof options !== "object" ) {
        throw new Error( "invalid arguments for initializing editor" );
      }

      this.editTrackEvent = function( trackEvent ) {
        if ( !trackEvent || !( trackEvent instanceof TrackEvent ) ) {
          throw new Error( "Can't editor undefined trackEvent" );
        }

        var type = trackEvent.type;
        if ( !_editors[ type ] ) {
          type = "default";
        }
        var editor = _editors[ type ];
        editor.construct( trackEvent );
        return editor;
      }; //editTrackEvent

      this.addEditor = function( editorSource, pluginType, target ) {
        if ( !pluginType || !editorSource ) {
          throw new Error( "Can't create an editor without a plugin type and editor source" );
        }
        var editor = _editors[ pluginType ] = new Editor({
          source: editorSource,
          type: pluginType,
          target: target
        });
        return editor;
      }; //addCustomEditor
            
      this.removeEditor = function( pluginType ) {
        if ( !pluginType ) {
          return;
        }
        var oldSource = _editors[ pluginType ];
        _editors[ pluginType ] = undefined;
        return oldSource;
      }; //removeEditor

      var defaultEditor = options.defaultEditor || "defaultEditor.html",
          defaultTarget = options.defaultTarget || "window";
      _this.addEditor( defaultEditor, "default", defaultTarget );

      _em.listen( "clientdimsupdated", butter.eventManager.repeat );
      _em.listen( "trackeventupdated", butter.eventManager.repeat );
      _em.listen( "trackeditstarted", butter.eventManager.repeat );
      _em.listen( "trackeditclosed", butter.eventManager.repeat );
      _em.listen( "trackeditfailed", butter.eventManager.repeat );     

    }; //EventEditor

    return EventEditor;

  }); //define

})();

