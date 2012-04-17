/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [  ], function() {

  var EventManager = function( object ) {
      var _listeners = [  ],
        _target = this,
        _this = this;

      this.repeat = function( object, events ) {
        for ( var i = 0; i < events.length; ++i ) {
          object.listen( events[ i ], _this.dispatch );
        }
      };
      this.unrepeat = function( object, events ) {
        for ( var i = 0; i < events.length; ++i ) {
          object.unlisten( events[ i ], _this.dispatch );
        }
      };
      this.dispatch = function( eventName, eventData ) {
        var e;
        if ( typeof ( eventName ) !== "object" ) {
          e = {
            type: eventName + "",
            target: _target,
            data: eventData
          };
        } else {
          e = {
            type: eventName.type,
            target: eventName.target,
            data: eventName.data
          };
          eventName = e.type;
        }
        e.currentTarget = _target;
        if ( _listeners[ eventName ] ) {
          var theseListeners = _listeners[ eventName ].slice();
          for ( var i = 0, l = theseListeners.length; i < l; ++i ) {
            theseListeners[ i ]( e );
          }
        }
      };
      this.listen = function( eventName, listener ) {
        if ( typeof ( eventName ) === "object" ) {
          for ( var i in eventName ) {
            if ( eventName.hasOwnProperty( i )) {
              _this.listen( i, eventName[ i ] );
            }
          }
        } else {
          if ( !_listeners[ eventName ] ) {
            _listeners[ eventName] = [ ];
          }
          _listeners[ eventName ].push( listener );
        }
      };
      this.unlisten = function( eventName, listener ) {
        if ( typeof ( eventName ) === "object" ) {
          for ( var i in eventName ) {
            if ( eventName.hasOwnProperty( i )) {
              _this.unlisten( i, eventName[ i ] );
            }
          }
        } else {
          var theseListeners = _listeners[ eventName ];
          if ( theseListeners ) {
            if ( listener ) {
              var idx = theseListeners.indexOf( listener );
              if ( idx > -1 ) {
                theseListeners.splice( idx, 1 );
              }
            } else {
              _listeners[ eventName] = [ ];
            }
          }
        }
      };
      if ( object ) {
        object.listen = _this.listen;
        object.unlisten = _this.unlisten;
        object.dispatch = _this.dispatch;
        _target = object;
      }
    };
  return EventManager;

});
