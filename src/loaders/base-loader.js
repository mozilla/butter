/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [], function() {

  // Look for variables with alphanumeric symbols, dashes, underscores,
  // and periods, surrounded by curly braces.
  var VAR_REGEX = /\{([\w\-\._]+)\}/;

  // Replaces variables with content from configDirs.
  function __fixUrl( configDirs, url ) {
    var match,
        replacement;

    while ( VAR_REGEX.test( url ) ) {
      match = VAR_REGEX.exec( url );
      replacement = configDirs[ match[ 1 ] ] || "";
      url = url.replace( match[0], replacement );
    }
    return url.replace( "//", "/" );
  }

  function BaseLoader( configDirs ) {
    this.configDirs = configDirs;
  }

  BaseLoader.fixUrl = function( url ) {
    return __fixUrl( this.configDirs, url );
  };

  BaseLoader.generateDefaultCheckFunction = function() {
    var index = 0;
    return function(){
      return index++ > 0;
    };
  };

  BaseLoader.DEFAULT_ERROR_FUNCTION = function( e ) {
    if ( e ) {
      console.warn( e.toString() );
    }
  };

  BaseLoader.DEFAULT_LOADED_FUNCTION = function() {};

  return BaseLoader;

});