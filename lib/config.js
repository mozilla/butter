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

module.exports = nconf.get();
