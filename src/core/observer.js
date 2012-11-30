/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

/**
 * Document: Observer
 *
 * An observer/notification system.
 *
 * @structure Module
 * @expose `extend`
 */
define([], function(){

  /**
   * Document: Observer::Notification
   *
   * A Notification object is passed to subscribers when a notification occurs. It
   * describes the notification, encompassing references to the notification origin,
   * the name of the notification, and some data to assist. Notifications can be
   * cancelled by calling the `cancel` function, and a reason can be specified to
   * pass on to the body which issued the notification.
   *
   * @param {Object} origin The object which issued the notification.
   * @param {String} type The type of notification.
   * @param {Object} data Arbitrary data to associate with the notification.
   * @structure Class
   * @api public
   */
  function Notification( origin, type, data ) {
    var _cancelledReason;

    /**
     * Document: Observer::Notification::cancel
     *
     * Cancels a notification and records a reason for doing so.
     *
     * @param {String} reason The reason for canceling the notification.
     * @structure Member Function
     * @api public
     */
    this.cancel = function( reason ) {
      _cancelledReason = reason || true;
    };

    Object.defineProperties( this, {
      origin: {
        value: origin,
        enumerable: true
      },
      type: {
        value: type,
        enumerable: true
      },
      data: {
        value: data,
        enumerable: true
      },
      cancelledReason: {
        enumerable: true,
        get: function() {
          return _cancelledReason;
        }
      },
      cancelled: {
        enumerable: true,
        get: function() {
          return !!_cancelledReason;
        }
      }
    });
  }

  /**
   * Document: Observer::__subscribe
   *
   * Adds a subscriber to a group of subscribers corresponding to a given notification type.
   *
   * @param {String} type: The type of notification that the given subscriber should receive.
   * @param {Function} subscriber: A function which will be called when notification occurs.
   * @param {Object} subscriberDict: The group of subscribers for an object.
   * @structure Class Function
   * @api private
   */
  function __subscribe( type, subscriber, subscriberDict ) {
    if ( !subscriberDict[ type ] ) {
      subscriberDict[ type ] = [];
    }
    subscriberDict[ type ].push( subscriber );
  }

  /**
   * Document: Observer::__unsubscribe
   *
   * Removes a subscriber from a group of subscribers corresponding to a given notification type.
   *
   * @param {String} type: The type of notification that the given subscriber was set up to receive.
   * @param {Function} subscriber: A function which will be called when notification occurs.
   * @param {Object} subscriberDict: The group of subscribers for an object.
   * @structure Class Function
   * @api private
   */
  function __unsubscribe( type, subscriber, subscriberDict ) {
    var idx, subscribers = subscriberDict[ type ];

    if ( subscribers ) {
      idx = subscribers.indexOf( subscriber );
      if ( idx > -1 ) {
        subscribers.splice( idx, 1 );
      }
    }
  }

  /**
   * Document: Observer::__notify
   *
   * Calls all the subscribers of a given notification type.
   *
   * @param {String} type: The type of notification identifying a group of subscribers.
   * @param {Function} subscriber: A function which will be called when notification occurs.
   * @param {Object} subscriberDict: The group of subscribers for an object.
   * @param {Object} object: The object issuing the notification.
   * @structure Class Function
   * @api private
   */
  function __notify( type, data, subscriberDict, object ) {
    var i, l,
        subscribers = subscriberDict[ type ],
        notification = new Notification( object, type, data );

    if ( subscribers ) {
      for ( i = 0, l = subscribers.length; i < l; ++i ) {
        subscribers[ i ]( notification );
        if ( notification.cancelled ) {
          break;
        }
      }
    }

    return notification;
  }

  /**
   * Document: Observer::Observer
   *
   * Gives an object the functionality to record and notify subscribers for typed notifications
   * (simple implementation of Observer pattern).
   *
   * @param {Object} object: The object to extend with Observer functionality.
   * @structure Class
   * @usage Observer.extend(object);
   * @api public
   */
  function Observer( object ) {
    var _subscribers = {};

    if ( object.subscribe ) {
      throw "Object already has Observer properties.";
    }

    /**
     * Document: Observer::Observer::subscribe
     *
     * Executes subscription procedure for the given subscriber on this Observer object.
     * 
     * @param {Object} object The object to extend with Observer functionality.
     * @see Observer::__subscribe
     * @structure Member Function
     * @api public
     */
    object.subscribe = function( type, subscriber ) {
      __subscribe( type, subscriber, _subscribers );
    };

    /**
     * Document: Observer::Observer::unsubscribe
     *
     * Executes unsubscription procedure for the given subscriber on this Observer object.
     *
     * @param {Object} object The object to extend with Observer functionality.
     * @see Observer::__unsubscribe
     * @structure Member Function
     * @api public
     */
    object.unsubscribe = function( type, subscriber ) {
      __unsubscribe( type, subscriber, _subscribers );
    };

    /**
     * Document: Observer::Observer::notify
     *
     * Executes notification procedure for the given subscriber on this Observer object.
     *
     * @param {Object} object The object to extend with Observer functionality.
     * @see Observer::__notify
     * @structure Member Function
     * @api public
     */
    object.notify = function( type, data ) {
      return __notify( type, data, _subscribers, object );
    };
  }

  return {
    extend: Observer
  };

});