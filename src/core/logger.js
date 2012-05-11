/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function() {

  var __debug = true;

  define( [], function() {

    function logger( name ) {

      this.log = function( message ) {
        if ( __debug ) {
          console.log( "[" + name + "] " + message );
        }
      }; //log

      this.error = function( message ) {
        if ( __debug ) {
          throw new Error( "[" + name + "]" + message );
        }
      }; //error

    } //Logger

    logger.debug = function( value ) {
      if ( value !== undefined ) {
        __debug = value;
      } else {
        return __debug;
      }
    };

    return logger;
  }); //define
}());
