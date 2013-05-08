var fs = require( 'fs' ),
    knox = require( 'knox' ),
    Path = require( 'path' );

// Make sure the dir exists, and its parent. Create if not.
function ensurePathExistsSync( path ) {
  var parent = Path.dirname( path );

  // Build paths above too, if not present. Check for relative or absolute paths
  if ( parent !== "." && parent !== "/" ) {
    ensurePathExistsSync( parent );
  }

  if ( !fs.existsSync( path ) ) {
    try {
      fs.mkdirSync( path );
    } catch (e) {
      console.log( Path.resolve( path ) );
      console.error( e );
      process.exit( 1 );
    }
  }
}

var BaseFileStore = {

  // By default, we use no prefix/suffix unless user-supplied.
  namePrefix: '',
  nameSuffix: '',

  // If we have a root directory, we need to work with the FS
  get requiresFileSystem() {
    return !!this.root;
  },

  // Expand a name to include the namePrefix
  expand: function( name ) {
    // Make sure name is a string, since non-strings are ignored by join
    name = name + '';
    return Path.join( this.namePrefix, name ) + this.nameSuffix;
  }
};

/**
 * LocalFileStore - stores data in local file system using root dir
 */
function LocalFileStore( options ) {
  // A root path for all filenames
  if( !options.root ) {
    throw 'LocalFileStore Error: expected root';
  }
  this.root = options.root;

  // An optional prefix for all filenames.  Will be joined with /
  // For example: filename=foo namePrefix=v becomes v/foo
  if( options.namePrefix ) {
    this.namePrefix = options.namePrefix;
  }
  ensurePathExistsSync( Path.join( this.root, this.namePrefix ) );

  // An optional suffix for all filenames.  Will be joined directly
  // For example: filename=foo nameSuffix=.html becomes foo.html
  if( options.nameSuffix ) {
    this.nameSuffix = options.nameSuffix;
  }

  // If embedHostname isn't appropriate, a hostname can be provided to override it.
  this.hostname = options.hostname;
}

LocalFileStore.prototype = Object.create( BaseFileStore );

LocalFileStore.prototype.write = function( path, data, contentType, callback ) {
  path = Path.join( this.root, this.expand( path ) );
  ensurePathExistsSync( Path.dirname( path ) );

  if ( typeof contentType === "function" ) {
    callback = contentType;
  }

  fs.writeFile( path, data, function( err ) {
    if (err) {
      callback( err );
    } else {
      callback();
    }
  });
};

LocalFileStore.prototype.remove = function( path, callback ) {
  callback = callback || function(){};
  path = Path.join( this.root, this.expand( path ) );
  fs.unlink( path, callback );
};

/**
 * S3FileStore - store data using Amazon S3
 */
function S3FileStore( options ) {
  // Amazon S3 credentials for accessing a bucket
  this.client = knox.createClient({
    key: options.key,
    secret: options.secret,
    bucket: options.bucket
  });

  // An optional prefix for all keys.  Will be joined with /
  // For example: key=foo namePrefix=v becomes v/foo
  if( options.namePrefix ) {
    this.namePrefix = options.namePrefix;
  }

  // An optional suffix for all filenames.  Will be joined directly
  // For example: filename=foo nameSuffix=.html becomes foo.html
  if( options.nameSuffix ) {
    this.nameSuffix = options.nameSuffix;
  }

  // An optional mime type for the files to be written.  Defaults to
  // text/plain if none given.
  this.contentType = options.contentType || 'text/plain';

  // If embedHostname isn't appropriate, a hostname can be provided to override it.
  this.hostname = options.hostname;

  // Append any additional headers to send with a write request
  this.headers = {};
  if ( options.headers ) {
    this.headers = options.headers;
  }
}

S3FileStore.prototype = Object.create( BaseFileStore );

S3FileStore.prototype.write = function( key, data, contentType, callback ) {
  // If the data we're writing is a string, then we want the byte count in UTF-8
  // Otherwise, assume it's already a Buffer object
  var contentLength = typeof data === "string" ? Buffer.byteLength( data, 'utf8' ) : data.length;

  if ( typeof contentType === "function" ) {
    callback = contentType;
    contentType = this.contentType;
  }

  var headers = {
    'x-amz-acl': 'public-read',
    'Content-Length': contentLength,
    'Content-Type': contentType
  };

  Object.keys( this.headers ).forEach(function( key ) {
    headers[ key ] = this.headers[ key ];
  }, this );

  this.client.put( this.expand( key ), headers )
  .on( 'response', function( res ) {
    if( res.statusCode === 200 ) {
      callback();
    } else {
      callback( res.statusCode );
    }
  })
  .end( data );
};

S3FileStore.prototype.remove = function( key, callback ) {
  callback = callback || function(){};
  this.client.del( this.expand( key ) )
  .on( 'response', function( res ) {
    if( res.statusCode === 200 ) {
      callback();
    } else {
      callback( res.statusCode );
    }
  })
  .end();
};


var FileStores = {
  'S3': S3FileStore,
  'LOCAL': LocalFileStore
};

module.exports = {
  // Pass a type (one of 'local' or 's3') to build a FileStore object.
  create: function( type, options ) {
    options = options || {};

    var Constructor = FileStores[ type.toUpperCase() ];
    if( !Constructor ) {
      throw 'Unknown FileStore type: ' + type;
    }

    return new Constructor( options );
  }
};
