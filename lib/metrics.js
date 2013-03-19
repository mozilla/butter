// Thin wrapper around node.js statsd client:
// https://github.com/sivy/node-statsd.

module.exports.create = function( options ) {
  var statsd,
      disabled = !options,
      knownMethods = "timing increment decrement gauge set unique".split( " " ),
      env = process.env.NODE_ENV || 'development',
      whitelist;

  if( !options ) {
    // If no metrics setup is given, use a mock StatsD client
    // (i.e., nothing sent to server)
    options = { mock: true };
  } else {
    // If a prefix is given, use it. Otherwise use `<env>.butter.'
    options.prefix = options.prefix || env + ".butter.";
  }

  // Make sure that all of the following are true before we process
  // a stat:
  //   - whitelist is provided, and
  //   - stat name is in whitelist, and
  //   - method name is one of those known to statsd, and
  //   - method name is given in whitelist for this stat.
  whitelist = options.whitelist;
  function isWhitelisted( name, method ) {
    if ( !whitelist || !( name in whitelist ) ) {
      return false;
    }

    var approvedMethods = whitelist[ name ];
    if ( knownMethods.indexOf( method ) === -1 ||
         approvedMethods.indexOf( method ) === -1 ) {
      return false;
    }

    return true;
  }

  statsd = new ( require( 'node-statsd').StatsD )( options );
  statsd.isWhitelisted = isWhitelisted;
  statsd.disabled = disabled;

  return statsd;
};
