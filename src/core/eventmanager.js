/**********************************************************************************

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

define( [], function(){

  var EventManager = function( object ) {
    var _listeners = [],
        _target = this,
        _this = this;

console.log( object );
    this.repeat = function( object, events ){
      for( var i=0; i<events.length; ++i ){
        object.listen( events[ i ], _this.dispatch );
      } //for
    }; //repeat

    this.unrepeat = function( object, events ){
      for( var i=0; i<events.length; ++i ){
        object.unlisten( events[ i ], _this.dispatch );
      } //for
    }; //unrepeat

    this.dispatch = function( eventName, eventData ) {
      var e;
      if( typeof( eventName ) !== "object" ){
        e = {
          type: eventName + "",
          target: _target,
          data: eventData,
        };
      }
      else {
        e = eventName;
        eventName = e.type;
      } //if
      e.currentTarget = _target;
      if( _listeners[ eventName ] ) {
        var theseListeners = _listeners[ eventName ].slice();
        for( var i=0, l=theseListeners.length; i<l; ++i ){
          theseListeners[ i ]( e );
        } //for
      } //if
    }; //dispatch

    this.listen = function( eventName, listener ) {
      if( typeof( eventName ) === "object" ){
        for( var i in eventName ){
          if( eventName.hasOwnProperty( i ) ){
            _this.listen( i, eventName[ i ] );
          } //if
        } //for
      }
      else {
        if ( !_listeners[ eventName ] ) {
          _listeners[ eventName ] = [];
        }
        _listeners[ eventName ].push( listener );
      } //if
    }; //listen

    this.unlisten = function( eventName, listener ) {
      if( typeof( eventName ) === "object" ){
        for( var i in eventName ){
          if( eventName.hasOwnProperty( i ) ){
            _this.unlisten( i, eventName[ i ] );
          } //if
        } //for
      }
      else {
        var theseListeners = _listeners[ eventName ];
        if ( theseListeners ) {
          if ( listener ) {
            var idx = theseListeners.indexOf( listener );
            if ( idx > -1 ) {
              theseListeners.splice( idx, 1 );
            } //if
          }
          else {
            _listeners[ eventName ] = [];
          }
        } //if
      } //if
    }; //unlisten

    if( object ) {
      object.listen = _this.listen;
      object.unlisten = _this.unlisten;
      object.dispatch = _this.dispatch;
      _target = object;
    } //if

  }; //EventManager

  return EventManager;

});
