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
nconf.defaults( require( "./default-config.json" ) );

module.exports = nconf.get();
