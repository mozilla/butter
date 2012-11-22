/*! This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "./base-loader" ], function( BaseLoader ) {

  function JSLoader( configDirs ) {
    BaseLoader.call( this, configDirs );
  }

  JSLoader.prototype = Object.create( BaseLoader );
  JSLoader.prototype.constructor = JSLoader;

  JSLoader.prototype.load = function( url, exclude, callback, checkFn, error ) {
    checkFn = checkFn || BaseLoader.generateDefaultCheckFunction();
    error = error || BaseLoader.DEFAULT_ERROR_FUNCTION;
    callback = callback || BaseLoader.DEFAULT_LOADED_FUNCTION;

    url = this.fixUrl( url );

    if ( !checkFn() ) {
      var scriptElement = document.createElement( "script" );
      scriptElement.type = "text/javascript";
      scriptElement.onload = callback;
      scriptElement.onerror = function( e ) {
        // Opera has a bug that will cause it to also fire load after
        // setting it to null to prevent this
        scriptElement.onload = null;

        error( e );
      };
      scriptElement.src = url;
      document.head.appendChild( scriptElement );
    }
    else if ( callback ) {
      callback();
    }
  };

  return JSLoader;

});