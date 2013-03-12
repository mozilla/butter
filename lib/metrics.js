// Thin wrapper around node.js statsd client:
// https://github.com/sivy/node-statsd.

// In cases where the statsd client isn't being used, provide a null
// statsd client that is safe to use instead.
var NullStatsDClient = function(){},
    NP = NullStatsDClient.prototype;

// Funnel most methods through a shell implementation that
// uses a null type vs. a string, since we ignore types altogether.
NP.timing = NP.increment = NP.decrement =
NP.gauge = NP.unique = NP.set = function( stat, value, sampleRate, callback ) {
  this.sendAll(stat, value, null, sampleRate, callback);
};
NP.sendAll = NP.send = function( stat, value, type, sampleRate, callback ) {
  // We don't actually send anything, so just trigger the callback, if any.
  if( callback ) {
    // callback( error, sentBytes )
    callback( null, 0 );
  }
};

module.exports = {
  create: function( options ) {
    var StatsD,
        env = process.env.NODE_ENV || 'development';

    // If no metrics setup is given, use a null StatsD client.
    if( !options ) {
      options = {};
      StatsD = NullStatsDClient;
    } else {
      // If a prefix is given, use it. Otherwise use `<env>.butter.'
      options.prefix = options.prefix || env + ".butter.";
      StatsD = require( 'node-statsd' ).StatsD;
    }

    return new StatsD( options.host, options.port, options.prefix,
                       options.suffix, options.globalize );
  }
};
