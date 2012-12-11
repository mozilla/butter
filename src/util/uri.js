/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [], function(){

  // -------------------------------------------------------------
  // parseUri 1.2.2
  // (c) Steven Levithan <stevenlevithan.com>
  // http://blog.stevenlevithan.com/archives/parseuri
  // MIT License

  function parseUri( str ){
    var o   = parseUri.options,
        m   = o.parser[ o.strictMode ? "strict" : "loose" ].exec( str ),
        uri = {},
        i   = 14;

    while( i-- ){
      uri[ o.key[ i ] ] = m[ i ] || "";
    }

    uri[ o.q.name ] = {};
    uri[ o.key[ 12 ] ].replace( o.q.parser, function( $0, $1, $2 ){
      if ($1){
        uri[ o.q.name ][ $1 ] = $2;
      }
    });

    return uri;
  }

  parseUri.options = {
    strictMode: false,
    key: [
      "source","protocol","authority","userInfo","user","password",
      "host","port","relative","path","directory","file","query","anchor"
    ],
    q:   {
      name:   "queryKey",
      parser: /(?:^|&)([^&=]*)=?([^&]*)/g
    },
    parser: {
      strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
      loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
    }
  };

  // -------------------------------------------------------------

  // Unique key name for query string
  var UID_KEY_NAME = "butteruid";

  // A default seed that won't collide.
  var seed = Date.now();

  // Reconstruct a URI from its parts as a string.
  function uriToString( uri ){
    var s = "";

    // XXX: need to figure out proper rules/exceptions for adding //
    s += uri.protocol ? uri.protocol + "://" : "";
    s += uri.authority || "";
    s += uri.path || "";
    s += uri.query ? "?" + uri.query : "";
    s += uri.anchor ? "#" + uri.anchor : "";

    return s;
  }

  // Rebuild the query string for a uri
  function updateQuery( uriObject ) {
    var queryKey = uriObject.queryKey,
        queryString = "",
        queryKeyCount = 0,
        key, value;

    for ( key in queryKey ) {
      if ( queryKey.hasOwnProperty( key ) ) {
        value = queryKey[ key ];
        queryString += queryKeyCount > 0 ? "&" : "";
        queryString += key;
        // Allow value=0
        queryString += ( !!value || value === 0 ) ? "=" + value : "";
        queryKeyCount++;
      }
    }
    uriObject.query = queryString;
    return uriObject;
  }

  var URI = {

    // Allow overriding the initial seed (mostly for testing).
    set seed( value ){
      seed = value|0;
    },
    get seed(){
      return seed;
    },

    // Parse a string into a URI object.
    parse: function( uriString ){
      var uri = parseUri( uriString );
      uri.toString = function(){
        return uriToString( this );
      };
      return uri;
    },

    // Make a URI object (or URI string, turned into a URI object) unique.
    // This will turn http://foo.com into http://foo.com?<UID_KEY_NAME>=<seed number++>.
    makeUnique: function( uriObject ){
      if( typeof uriObject === "string" ){
        uriObject = this.parse( uriObject );
      }

      var queryKey = uriObject.queryKey;
      queryKey[ UID_KEY_NAME ] = seed++;
      return updateQuery( uriObject );
    },

    // Remove the butteruid unique identifier from a URL, that is, undo makeUnique
    stripUnique: function( uriObject ) {
      if( typeof uriObject === "string" ){
        uriObject = this.parse( uriObject );
      }

      var queryKey = uriObject.queryKey;
      if( queryKey ) {
        delete queryKey[ UID_KEY_NAME ];
      }
      return updateQuery( uriObject );
    }
  };

  return URI;

});
