/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [], function(){

  var EventManager = function( object ) {
    var _listeners = [],
        _target = this,
        _this = this;

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
        e = {
          type: eventName.type,
          target: eventName.target,
          data: eventName.data
        };
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
