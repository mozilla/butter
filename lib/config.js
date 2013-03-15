var nconf = require( "nconf" );

// 1) Load default settings from our config.
nconf.defaults( require( "./default-config.json" ) );

// 2) Look for settings from the environment
nconf.env();

// 3) Look for settings in a file named "local.json" beside "server.js"
nconf.file( __dirname + "/../local.json" );

// 4) Look for settings in a file specified by an environment variable
if ( process.env.BUTTER_CONFIG_FILE ) {
  nconf.file( process.env.BUTTER_CONFIG_FILE );
}

module.exports = nconf.get();
