/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [], function(){

  /**
   * EventManagerWrapper - a synchrnous event queue wrapper
   *
   * Takes an object `object` and extends it with methods necessary to
   * allow object to become an event source.  Other objects can register
   * event listeners with an event source, and have their callback invoked
   * when an event occurs.  Event sources can also be used to dispatch
   * events to registered listeners.
   *
   * To create an event source, pass an object to EventManagerWrapper:
   *
   *    var o = new SomeObject();
   *    EventManagerWrapper( someObject );
   *    o.listen( "some-event", function(){...} );
   *    ...
   *    o.dispatch( "some-event", data );
   *
   * Event source objects wrapped with EventManagerWrapper have the
   * following methods attached:
   *
   * 1. object.listen( eventName, listener )
   *
   *    eventName [String] - the name of an event to listen for
   *    listener  [Function] - a callback to execute
   *
   *    Register a new listener with the object.  The listener callback
   *    should accept an argument `e`, which is an event containing:
   *    type, target, and data.
   *
   * 2. object.unlisten( eventName, listener )
   *
   *    eventName [String] - the name of an event
   *    listener  [Function] - the callback previously registered or null
   *
   *    Unregister an existing listener, or remove all listeners for a given
   *    event name.  The listener callback should be the one you used in
   *    a previous call to listen.  If you supply no listener argument, all
   *    listeners for the `eventName` event will be removed.
   *
   * 3. object.dispatch( eventName, eventData )
   *
   *    eventName [String] - the name of an event to dispatch
   *    eventData [Object] - an object to attach to the event's `data` property
   *
   *    Dispatch takes an eventName and creates a new event object, using
   *    eventData as its data property.  It then invokes any and all listeners
   *    which were previously registered with `listen`.
   *
   * 4. object.chain( eventManagerWrappedObject, events )
   *
   *    eventManagerWrappedObject [Object] - an object wrapped by EventManagerWrapper
   *    events [Array] - an array of event names [String]
   *
   *    Chain allows the events of one event source object to be chained to another,
   *    such that dispatching an event through one will also cause it to invoke
   *    listeners on the other.  This is a form of event bubbling.
   *
   * 5. object.unchain( eventManagerWrappedObject, events )
   *
   *    eventManagerWrappedObject [Object] - an object wrapped by EventManagerWrapper
   *    events [Array] - an array of event names [String]
   *
   *    Uncain allows one to unchain one event source object from another,
   *    which was previously chained using `chain`.
   **/

  function isWrapped( object ) {
    return object.listen && object.unlisten;
  }

  function chain( a, b, events ){
    if( !isWrapped(b) ){
      throw "Error: Object is not a valid event source: " + b;
    }

    var i = events.length;
    while( i-- ){
      b.listen( events[ i ], a.dispatch );
    }
  }

  function unchain( a, b, events ){
    if( !isWrapped(b) ){
      throw "Error: Object is not a valid event source: " + b;
    }

    var i = events.length;
    while( i-- ){
      b.unlisten( events[ i ], a.dispatch );
    }
  }

  function dispatch( target, eventName, eventData, listeners ){
    var theseListeners,
        e, i;
    if( typeof( eventName ) === "object" ){
      e = {
        type: eventName.type,
        target: eventName.target,
        data: eventName.data
      };
      eventName = e.type;
    } else {
      e = {
        type: eventName + "",
        target: target,
        data: eventData
      };
    }
// humphd: do we need this????
//    e.currentTarget = _target;

    if( listeners[ eventName ] ) {
      theseListeners = listeners[ eventName ].slice();
      i = theseListeners.length;
      while( i-- ){
        theseListeners[ i ]( e );
      }
    }
  }

  function listen( o, eventName, listener, listeners ){
    var i;
    if( typeof( eventName ) === "object" ){
      for( i in eventName ){
        if( eventName.hasOwnProperty( i ) ){
          o.listen( i, eventName[ i ] );
        }
      }
    } else {
      listeners[ eventName ] = listeners[ eventName ] || [];
      listeners[ eventName ].push( listener );
    }
  }

  function unlisten( o, eventName, listener, listeners ) {
    var theseListeners,
        idx, i;
    if( typeof( eventName ) === "object" ){
      for( i in eventName ){
        if( eventName.hasOwnProperty( i ) ){
          o.unlisten( i, eventName[ i ] );
        }
      }
    } else {
      theseListeners = listeners[ eventName ];
      if ( !theseListeners ) {
        return;
      }

      if ( listener ) {
        idx = theseListeners.indexOf( listener );
        if ( idx > -1 ) {
          theseListeners.splice( idx, 1 );
        }
      } else {
        // Wipe-out the array, but through the reference.
        listeners[ eventName ].length = 0;
      }
    }
  }

  var EventManagerWrapper = function( object ) {
    if ( !object || isWrapped( object) ) {
      return;
    }

    var _listeners = [];

    object.chain = function( eventManagerWrappedObject , events ){
      chain( this, eventManagerWrappedObject, events );
    };

    object.unchain = function( eventManagerWrappedObject, events ){
      unchain( this, eventManagerWrappedObject, events );
    };

    object.dispatch = function( eventName, eventData ){
      dispatch( this, eventName, eventData, _listeners);
    };

    object.listen = function( eventName, listener ){
      listen( this, eventName, listener, _listeners );
    };

    object.unlisten = function( eventName, listener ){
      unlisten( this, eventName, listener, _listeners );
    };

    return object;
  };

  return EventManagerWrapper;

});
