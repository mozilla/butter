/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

/**
 * metrics - send metrics information to cornfield from butter.
 *
 * The metrics module provides a mechanism for client-generated stats
 * to be collected and sent to the server. The API is based on StatsD,
 * see https://github.com/sivy/node-statsd. All metrics methods take the
 * same form:
 *
 *   metrics.{method}( statName, optionalStatValue );
 *
 * NOTE: the module has to be initialized once before use:
 *
 *   metrics.init( butter );
 *
 * Metric names should be namespaced, for example: `project.save`,
 * `project.delete`, `error.loading`, etc. The value is optional
 * and 1 will be assumed if not given.
 *
 * The available methods include:
 *
 *   increment - increase the stat by a value.
 *
 *   once - increment the stat, but only once per session. Subsequent
 *          calls to `once` for this stat during the given session will
 *          do nothing (i.e., it is safe to call this multiple times for
 *          the same stat).
 *
 *   decrement - decrease the stat by a value.
 *
 *   timing - sending timing info (e.g., response time, performance), with
 *            the value specified in milliseconds.
 *
 *   gauge - gauge a stat by a specified amount (e.g., rate at 97.6).
 *
 *   set, unique - counts unique occurences of a stat (e.g., set
 *   "key" to "foo".
 */
define( [], function() {

  // Add all statsd metrics methods.
  function addMetricsMethods( metrics, cornfield, queue ) {
    var methods = "timing increment decrement gauge set unique".split( " " ),
        onceCache = {};

    /**
     * stat - queues a stat to be sent to the server. The form is:
     *
     *   [type]:[name]:[value]
     *
     * where [type] is a single letter ('i' for increment), [name] is the
     * name of the stat, and [value] is a value or the empty string if null.
     */
    function stat( type, name, value ) {
      // Deal with 'my_counter' vs [ 'my_counter1', 'my_counter2' ]
      if ( !Array.isArray( name ) ) {
        name = [ name ];
      }

      name.forEach( function( n ) {
        // Queue this stat, and we'll send when we flushQueue()
        queue.push( type + ":" + n + ":" + ( value || "" ) );
      });
    }

    methods.forEach( function( method ) {
      // Use first letter of method as type (e.g., "increment" will be "i")
      var type = method[ 0 ];
      metrics[ method ] = function( name, value ) {
        stat( type, name, value );
      };
    });

    /**
     * once - Count the given stat once for the given user session. Use `once`
     * when you want to record the fact that something happened at all vs.
     * happening N times. Use `increment` for the latter.
     */
    metrics.once = function once( name, value ) {
      if ( Array.isArray( name ) ) {
        name.forEach( function( n ) {
          once( n, value );
        });
        return;
      }

      // Don't process this stat a second time if it's already in cache.
      if ( name in onceCache ) {
        return;
      }

      // Record that we've processed this stat once and send.
      onceCache[ name ] = 1;
      metrics.increment( name, value );
    };
  }

  function init( butter, config, o ) {
    if ( init.done ) {
      return;
    }

    var cornfield = butter.cornfield,
        queue = [],
        sendInterval = +config.sendInterval,
        sendOnUnload = config.sendOnUnload;

    init.done = true;
    addMetricsMethods( o, cornfield, queue );

    // Send a batch of stats to the server
    function flushQueue() {
      if ( queue.length === 0 ) {
        return;
      }

      cornfield.metrics( queue );
      queue.length = 0;
    }

    // We send stats to the server every N minutes
    if ( sendInterval > 0 ) {
      window.setInterval( function() {
        flushQueue();
      }, sendInterval );
    }

    // ...and also when the window closes
    if ( sendOnUnload ) {
      window.addEventListener( "unload", flushQueue, false );
      window.addEventListener( "beforeunload", flushQueue, false );
    }
  }

  // We return a partially built metrics object, init will finish the job.
  return {
    init: function( butter, config ) {
      init( butter, config, this );
    }
  };

});
