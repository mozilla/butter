/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [], function(){

  /**
   * EventManagerWrapper - an event queue wrapper
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
   * By default, all event dispatching is done asynchronously, meaning
   * calls to dispatch() return immediately, and callbacks are executed
   * later.  It is also possible to force a synchronous, blocking call
   * to dispatch() by passing `true` as the value of the optional third
   * argument:
   *
   *    o.listen( "some-event", function handler(){...} );
   *    o.dispatch( "some-event", data, true );
   *    // the handler function will have executed by this point...
   *
   * Event source objects wrapped with EventManagerWrapper have the
   * following methods attached:
   *
   * 1. object.listen( eventName, listener )
   *
   *    eventName [String] - the name of an event to listen for
   *    listener  [Function] - a callback function to execute
   *
   *    Register a new listener with the object.  The listener callback
   *    should accept an argument `e`, which is an event containing:
   *    type [String], target [Object], and data [Object].
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
   * 3. object.dispatch( eventName, eventData, [optional] synchronous=false )
   *
   *    eventName [String] - the name of an event to dispatch
   *    eventData [Object] - an object to attach to the event's `data` property
   *    synchronous [Boolean] - an optional argument indicating that the callback
   *                            should be fired synchronously with dispatch(). By
   *                            default this is `false` and done asynchronously.
   *
   *    Dispatch takes an `eventName` and creates a new event object, using
   *    `eventData` as its data property.  It then invokes any and all listeners
   *    which were previously registered with `listen`.  Depending on the presence/
   *    value of `synchronous`, this is either done synchronously or asynchronously.
   *
   * 4. object.chain( eventManagerWrappedObject, events )
   *
   *    eventManagerWrappedObject [Object] - an object wrapped by EventManagerWrapper
   *    events [Array] - an array of event names [String]
   *
   *    Chain allows the events of one event source to be chained to another,
   *    such that dispatching an event through one will also cause it to invoke
   *    listeners on the other.  This is a form of event bubbling.
   *
   * 5. object.unchain( eventManagerWrappedObject, events )
   *
   *    eventManagerWrappedObject [Object] - an object wrapped by EventManagerWrapper
   *    events [Array] - an array of event names [String]
   *
   *    Unchain allows one event source to be unchained from from another,
   *    which was previously chained using `chain`.
   **/

  /**
   * Static, shared functions for all event source wrapped objects.
   **/
  function __isWrapped( object ){
    return object.listen && object.unlisten;
  }

  function __chain( a, b, events ){
    if( !__isWrapped(b) ){
      throw "Error: Object is not a valid event source: " + b;
    }

    var i = events.length;
    while( i-- ){
      b.listen( events[ i ], a.dispatch );
    }
  }

  function __unchain( a, b, events ){
    if( !__isWrapped(b) ){
      throw "Error: Object is not a valid event source: " + b;
    }

    var i = events.length;
    while( i-- ){
      b.unlisten( events[ i ], a.dispatch );
    }
  }

  function __invoke( eventName, listeners, data ){
    var these, i;

    if( listeners[ eventName ] ){
      these = listeners[ eventName ].slice();
      i = these.length;
      while( i-- ){
        these[ i ]( data );
      }
    }
  }

  function __dispatch( target, namespace, eventName, eventData, listeners, sync ){
    var customEvent, e, namespacedEventName;

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

    namespacedEventName = namespace + eventName;

    // XXXhumph - Force synchronous code path until we test more
    // https://webmademovies.lighthouseapp.com/projects/65733/tickets/1130
    sync = true;

    if ( sync ){
      __invoke( namespacedEventName, listeners, e );
    } else /* async */ {
      customEvent = document.createEvent( "CustomEvent" );
      customEvent.initCustomEvent( namespacedEventName, false, false, e );
      document.dispatchEvent( customEvent );
    }
  }

  function __listen( o, namespace, eventName, listener, listeners, handler ){
    var i, namespacedEventName;

    if( typeof( eventName ) === "object" ){
      for( i in eventName ){
        if( eventName.hasOwnProperty( i ) ){
          o.listen( i, eventName[ i ] );
        }
      }
    } else {
      namespacedEventName = namespace + eventName;

      if( !listeners[ namespacedEventName ] ){
        listeners[ namespacedEventName ] = [];
        document.addEventListener( namespacedEventName, function( e ){
          handler( namespacedEventName, e );
        }, false);
      }
      listeners[ namespacedEventName ].push( listener );
    }
  }

  function __unlisten( o, namespace, eventName, listener, listeners, handler ){
    var these, idx, i,
        namespacedEventName = namespace + eventName;

    if( typeof( eventName ) === "object" ){
      for( i in eventName ){
        if( eventName.hasOwnProperty( i ) ){
          o.unlisten( i, eventName[ i ] );
        }
      }
    } else {
      these = listeners[ namespacedEventName ];
      if ( !these ){
        return;
      }

      if ( listener ){
        idx = these.indexOf( listener );
        if ( idx > -1 ){
          these.splice( idx, 1 );
        }
      }

      if ( !listener || these.length === 0 ){
        delete listeners[ namespacedEventName ];

        document.removeEventListener( namespacedEventName, function( e ){
          handler( namespacedEventName, e );
        }, false);
      }
    }
  }

  var __seed = Date.now();

  /**
   * EventManagerWrapper objects maintain a few internal items.
   * First, a list of listeners is kept for this object's events.
   * Second, all event names are namespaced so there is no
   * leakage into other event sources.  Third, an event handler
   * is created, which has access to the appropriate listeners.
   **/
  function EventManagerWrapper( object ){

    if ( !object || __isWrapped( object) ){
      return;
    }

    var
        // A list of listeners, keyed by namespaced event name.
        _listeners = {},

        // A unique namespace for events to avoid collisions. An
        // event name "event" with namespace "butter-1336504666771:"
        // would become "butter-1336504666771:event".
        _namespace = "butter-" + __seed++ + ":",

        // An event handler used to invoke listeners, with scope
        // such that it can get at *this* object's listeners.
        _handler = function( eventName, domEvent ){
          __invoke( eventName, _listeners, domEvent.detail );
        };

    // Thin wrapper around calls to static functions

    object.chain = function( eventManagerWrappedObject , events ){
      __chain( this, eventManagerWrappedObject, events );
    };

    object.unchain = function( eventManagerWrappedObject, events ){
      __unchain( this, eventManagerWrappedObject, events );
    };

    object.dispatch = function( eventName, eventData, sync ){
      __dispatch( this, _namespace, eventName, eventData, _listeners, !!sync );
    };

    object.listen = function( eventName, listener ){
      __listen( this, _namespace, eventName , listener, _listeners, _handler );
    };

    object.unlisten = function( eventName, listener ){
      __unlisten( this, _namespace, eventName, listener, _listeners, _handler );
    };

    return object;
  }

  return EventManagerWrapper;

});
