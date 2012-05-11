/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function( root ){
var Comm = function(){
  var _listeners = {},
      _context,
      _this = this;

  root.addEventListener( "message", function( e ){

    if( e.source !== root && typeof e.data === "object" ){
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

}; //Comm
root.Comm = Comm;
}( window ));
