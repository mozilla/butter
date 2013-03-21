var nconf = require( "nconf" );

// 1) Look for settings from the environment
nconf.env();

// 2) Recurse up the directory tree looking for a file named "local.json"
nconf.file({ dir: __dirname, file: "local.json", search: true });

// 3) Look for settings in a file specified by an environment variable
if ( process.env.BUTTER_CONFIG_FILE ) {
  nconf.file( process.env.BUTTER_CONFIG_FILE );
}

// Load default settings from our config. Don't change this file
nconf.defaults( require( "./default-config.js" ) );

// Check for deprecated configuration options, and patch them to new equivalents if they exist
[
  {
    old: "server:bindIP"
  },
  {
    old: "server:bindPort",
    new: "PORT"
  },
  {
    old: "dirs:appHostname",
    new: "hostname"
  }
].forEach(function( pref ) {
  if ( nconf.get( pref.old ) ) {
    if ( pref.new ) {
      console.log( "Preference `%s` has been deprecated. Use `%s` instead.", pref.old, pref.new );
      nconf.set( pref.new, nconf.get( pref.old ) );
    } else {
      console.log( "Preference `%s` has been removed. Remove it from your config", pref.old );
    }
  }
});

// Validate hostname by parsing using url module.
var hostName = require( "url" ).parse( nconf.get( "hostname" ) );

// We must check protocol explicitly for http or https, because the url module is easy to fool
if ( !hostName.protocol || !hostName.hostname || !/^https?:$/.test( hostName.protocol ) ) {
  console.warn( "The hostname option must contain a valid protocol and hostname. i.e. \"http://foo.com\"" );
}

nconf.set( "hostname", hostName.protocol + '//' + hostName.host );

module.exports = nconf.get();
