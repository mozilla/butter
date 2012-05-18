/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function() {

  var __debug = true;

  /**
   * Module: Logger
   *
   * Supplies customized logging functionality to Butter.
   */
  define( [], function() {

    /**
     * Class: Logger
     *
     * Controls logging for a specific object instance.
     *
     * @param {String} name: Name of the object to report in the log.
     */
    function logger( name ) {

      /**
       * Member: log
       *
       * Logs a message to the console prefixed by the given name.
       *
       * @param {String} message: Contents of the log message
       */
      this.log = function( message ) {
        if ( __debug ) {
          console.log( "[" + name + "] " + message );
        }
      }; //log

      /**
       * Member: error
       *
       * Throws an error with the given message prefixed by the given name.
       *
       * @param {String} message: Contents of the error
       * @throws: Obligatory, since this is an error
       */
      this.error = function( message ) {
        if ( __debug ) {
          throw new Error( "[" + name + "]" + message );
        }
      }; //error

    }

    /**
     * Class Function: debug
     *
     * Effectively toggles the logger.
     *
     * @param {Boolean} value: State of the logger.
     */
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

