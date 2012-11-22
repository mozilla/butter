/*! This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

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
   * later.
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
   * 3. object.dispatch( eventName, eventData )
   *
   *    eventName [String] - the name of an event to dispatch
   *    eventData [Object] - an object to attach to the event's `data` property
   *
   *    Dispatch takes an `eventName` and creates a new event object, using
   *    `eventData` as its data property.  It then invokes any and all listeners
   *    which were previously registered with `listen`.
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
   * Class: ButterEvent
   *
   * An event to propagate within Butter which holds and protects data about the event
   * instance. Propagation of the event can be stopped in the same manner as DOM events:
   * by calling event.stopPropagation inside a handler, the dispatch loop will be
   * interrupted.
   *
   * @param {String} type: Event type. Usually specified by a call to `object.dispatch`.
   * @param {Object} target: The event target. Usually the object which dispatched the event.
   * @param {*} data: Optional. Data to accompany the event.
   */
  function ButterEvent( type, target, data ) {
    var _propagationStopped = false;

    Object.defineProperties( this, {
      type: {
        value: type
      },
      target: {
        value: target
      },
      data: {
        value: data
      },
      propagationStopped: {
        get: function() {
          return _propagationStopped;
        }
      }
    });

    /**
     * Member: stopPropagation
     *
     * Stops the propagation of this event during a dispatch. As a side-effect
     * _propagationStopped is set to true and cannot be reset, thus notifying
     * external bodies that the event dispatch should halt.
     */
    this.stopPropagation = function() {
      _propagationStopped = true;
    };

    this.clone = function() {
      return new ButterEvent( type, target, data );
    };
  }

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
      // Hook event directly to dispatch function so that new
      // event object is not generated, simply propagated further.
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

  function __invoke( eventName, listeners, butterEvent ){
    var these, i;

    if( listeners[ eventName ] ){
      these = listeners[ eventName ].slice();
      i = these.length;
      // Progress through the loop of listeners until there are no more or until
      // the propagationStopped flag has been raised.
      while( i-- && !butterEvent.propagationStopped ){
        these[ i ]( butterEvent );
      }
    }
  }

  function __dispatch( target, namespace, event, eventData, listeners ){
    var customEvent, butterEvent,
        namespacedEventName, eventName;

    if ( event instanceof ButterEvent ) {
      // If an old event object was passed in, don't re-use it; clone it
      // instead to provide a fresh slate (e.g. propagation flag is reset).
      butterEvent = event.clone();
      eventName = butterEvent.type;
    } else if ( typeof( event ) === "string" ) {
      // Otherwise, create a new event object from parameters to initialize dispatch process.
      butterEvent = new ButterEvent( event + "", target, eventData );
      eventName = event;
    }
    else {
      // Protect from the use of object literals or other objects passed in as re-dispatched events.
      throw "Invalid event dispatch parameters.";
    }

    namespacedEventName = namespace + eventName;

    // Create custom DOM event and dispatch it.
    customEvent = document.createEvent( "CustomEvent" );
    customEvent.initCustomEvent( namespacedEventName, false, false, butterEvent );
    document.dispatchEvent( customEvent );
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

      // If there are no listeners yet for `eventName`, create a place to store them
      // and add a DOM event listener to the document. Note that `handler` is the
      // specified event handler, not listener, since we call all listeners in a loop
      // in JS, relying on DOM events only for the initial dispatch/handle.
      if( !listeners[ namespacedEventName ] ){
        listeners[ namespacedEventName ] = [];
        document.addEventListener( namespacedEventName, handler, false );
      }

      // Add the listener to the list so that it's called when a dispatch occurs.
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

      if ( !listener ) {
        throw "Removing listeners without specifying a listener explicitly is prohibited. Please remove listeners directly.";
      }

      idx = these.indexOf( listener );
      if ( idx > -1 ){
        these.splice( idx, 1 );
      }

      // If no listeners exist in the pool any longer, remove the pool and the
      // DOM event listener.
      if ( these.length === 0 ){
        delete listeners[ namespacedEventName ];
        document.removeEventListener( namespacedEventName, handler, false );
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
        _handler = function( domEvent ){
          __invoke( domEvent.type, _listeners, domEvent.detail );
        };

    // Thin wrapper around calls to static functions

    object.chain = function( eventManagerWrappedObject , events ){
      __chain( this, eventManagerWrappedObject, events );
    };

    object.unchain = function( eventManagerWrappedObject, events ){
      __unchain( this, eventManagerWrappedObject, events );
    };

    object.dispatch = function( eventName, eventData ){
      __dispatch( this, _namespace, eventName, eventData, _listeners );
    };

    object.listen = function( eventName, listener ){
      __listen( this, _namespace, eventName , listener, _listeners, _handler );
    };

    object.unlisten = function( eventName, listener ){
      __unlisten( this, _namespace, eventName, listener, _listeners, _handler );
    };

    return object;
  }

  return {
    extend: EventManagerWrapper
  };

});
