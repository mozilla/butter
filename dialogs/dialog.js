/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function(){

  function Comm(){
    var _listeners = {},
        _context,
        _this = this;

    window.addEventListener( "message", function( e ){

      if( e.source !== window && typeof e.data === "object" ){
        if( !_context || _context === e.data.context ){
          if( e.data.type === "ping" ){
            _this.send( "pong" );
          }
          else {
            _this.dispatch( e.data.type, e.data );
          } //if
        } //if
      } //if
    }, false );

    this.listen = function( type, listener ){
      if( !_listeners[ type ] ){
        _listeners[ type ] = [];
      } //if
      _listeners[ type ].push( listener );
      return listener;
    }; //listen

    this.unlisten = function( type, listener ){
      if( _listeners[ type ] ){
        var idx = _listeners[ type ].indexOf( listener );
        if( idx > -1 ){
          _listeners[ type ].splice( idx, 1 );
        } //if
      } //if
      return listener;
    }; //unlisten

    this.dispatch = function( type, data ){
      var listeners = _listeners[ type ];
      if( listeners ){
        for( var i=0, l=listeners.length; i<l; ++i ){
          listeners[ i ]( data );
        } //for
      } //if
    }; //dispatch

    this.send = function( type, data ){
      window.postMessage({
        type: type,
        data: data,
        context: _context
      }, "*" );
    }; //send

    function onReady( e ){
      _context = e.context;
      _this.unlisten( "ready", onReady );
      _this.send( "ready", "ready" );
    } //onReady
    _this.listen( "ready", onReady );
    
  }

  var __comm,
      __domLoaded = false,
      __domLoadWaiting,
      __activities = {},
      __keyboardAvoidElements = [
        "TEXTAREA"
      ];

  document.addEventListener( "DOMContentLoaded", function( e ){
    __domLoaded = true;
    if( __domLoadWaiting ){
      __domLoadWaiting();
    }
  }, false );

  __comm = new Comm();

  window.Dialog = {

    listen: __comm.listen,
    unlisten: __comm.unlisten,
    send: __comm.send,

    activity: function( activityName ){
      __activities[ activityName ]();
    },

    enableCloseButton: function(){
      var closeButton = document.getElementById( "close-button" );
      if( closeButton ){
        closeButton.addEventListener( "click", function( e ){
          Dialog.activity( "default-close" );
        }, false );
      }
    },

    showError: function( message ){
      var element = document.getElementById( "error" );
      if( element ){
        element.innerHTML = message;
        document.body.setAttribute( "data-error", true );
      }
    },

    hideError: function(){
      document.body.removeAttribute( "data-error" );
    },

    assignEnterKey: function( activityName ){
      document.addEventListener( "keydown", function( e ){
        if( __keyboardAvoidElements.indexOf( e.target.nodeName ) === -1 && ( e.which === 13 || e.keyCode === 13 ) ){
          __activities[ activityName ]( e );
        }
      }, false );
    },

    assignEscapeKey: function( activityName ){
      document.addEventListener( "keydown", function( e ){
        if( __keyboardAvoidElements.indexOf( e.target.nodeName ) === -1 && ( e.which === 27 || e.keyCode === 27 ) ){
          __activities[ activityName ]( e );
        }
      }, false );
    },

    ready: function( callback ){
      if( __domLoaded ){
        callback();
      }
      else{
        __domLoadWaiting = callback;
      }
    },

    registerActivity: function( name, callback ){
      __activities[ name ] = callback;
    },

    assignButton: function( elementId, activityName ){
      var element = document.getElementById( elementId );
      element.addEventListener( "click", __activities[ activityName ], false );
    },

    wait: function( waitFor, callback ){
      __comm.listen( waitFor, callback );
    },

    enableElements: function(){
      for( var i=0; i<arguments.length; ++i ){
        document.getElementById( arguments[ i ] ).removeAttribute( "disabled" );
      }      
    },

    disableElements: function(){
      for( var i=0; i<arguments.length; ++i ){
        document.getElementById( arguments[ i ] ).setAttribute( "disabled", true );
      }      
    }

  };

  Dialog.registerActivity( "default-close", function(){
    Dialog.send( "close" );
  });

  Dialog.registerActivity( "default-ok", function(){
    Dialog.send( "submit", true );
  });

}());