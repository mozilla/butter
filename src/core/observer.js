/*! This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define([], function(){

  /**
   * Notification
   *
   * A Notification object is passed to subscribers when a notification occurs. It
   * describes the notification, encompassing references to the notification origin,
   * the name of the notification, and some data to assist. Notifications can be
   * cancelled by calling the `cancel` function, and a reason can be specified to
   * pass on to the body which issued the notification.
   *
   * @param {Object} origin: The object which issued the notification.
   * @param {String} type: The type of notification.
   * @param {Object} data: Arbitrary data to associate with the notification.
   */
  function Notification( origin, type, data ) {
    var _cancelledReason;

    /**
     * cancel
     *
     * Cancels a notification and records a reason for doing so.
     *
     * @param {String} reason: The reason for canceling the notification.
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
   * __subscribe
   *
   * A class function which adds a subscriber to a group of subscribers
   * corresponding to a given notification type.
   *
   * @param {String} type: The type of notification that the given subscriber should receive.
   * @param {Function} subscriber: A function which will be called when notification occurs.
   * @param {Object} subscriberDict: The group of subscribers for an object.
   */
  function __subscribe( type, subscriber, subscriberDict ) {
    if ( !subscriberDict[ type ] ) {
      subscriberDict[ type ] = [];
    }
    subscriberDict[ type ].push( subscriber );
  }

  /**
   * __unsubscribe
   *
   * A class function which removes a subscriber from a group of subscribers
   * corresponding to a given notification type.
   *
   * @param {String} type: The type of notification that the given subscriber was set up to receive.
   * @param {Function} subscriber: A function which will be called when notification occurs.
   * @param {Object} subscriberDict: The group of subscribers for an object.
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
   * __notify
   *
   * A class function which calls all the subscribers of a given notification type.
   *
   * @param {String} type: The type of notification identifying a group of subscribers.
   * @param {Function} subscriber: A function which will be called when notification occurs.
   * @param {Object} subscriberDict: The group of subscribers for an object.
   * @param {Object} object: The object issuing the notification.
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
   * extendObject
   *
   * Gives an object the functionality to record and notify subscribers for typed notifications
   * (simple implementation of Observer pattern).
   *
   * @param {Object} object: The object to extend with Observer functionality.
   */
  function extendObject( object ) {
    var _subscribers = {};

    if ( object.subscribe ) {
      throw "Object already has Observer properties.";
    }

    object.subscribe = function( type, subscriber ) {
      __subscribe( type, subscriber, _subscribers );
    };

    object.unsubscribe = function( type, subscriber ) {
      __unsubscribe( type, subscriber, _subscribers );
    };

    object.notify = function( type, data ) {
      return __notify( type, data, _subscribers, object );
    };
  }

  return {
    extend: extendObject
  };

});