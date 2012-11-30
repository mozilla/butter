/*! This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

(function( undefined ) {

  // By default, logging is off.
  var __debug = false;

  /**
   * Document: Logger
   *
   * Supplies customized logging functionality to Butter.
   *
   * @structure Module
   */
  define( [],
    function() {

    /**
     * Document: Logger::Logger
     *
     * Controls logging for a specific object instance.
     *
     * @structure Class
     * @param {String} name Name of the object to report in the log.
     * @api public
     */
    function Logger( name ) {

      /**
       * Document: Logger::Logger::log
       *
       * Logs a message to the console prefixed by the given name.
       *
       * @structure Member Function
       * @api public
       * @param {String} message Contents of the log message
       */
      this.log = function( message ) {
        if ( __debug ) {
          console.log( "[" + name + "] " + message );
        }
      };

      /**
       * Document: Logger::Logger::error
       *
       * Throws an error with the given message prefixed by the given name.
       *
       * @structure Member Function
       * @api public
       * @param {String} message Contents of the error
       * @throws Obligatory, since this is an error.
       */
      this.error = function( message ) {
        if ( __debug ) {
          throw new Error( "[" + name + "] " + message );
        }
      };

    }

    /**
     * Document: Logger::Logger::enabled
     *
     * Whether the logger is enabled or not.
     *
     * @structure Class Function
     * @param {Boolean} value State of the logger.
     */
    Logger.enabled = function( value ) {
      if ( value !== undefined ) {
        __debug = !!value;
      }
      return __debug;
    };

    /**
     * Flarf
     */
    var foo1 = function foo2(){

    };

    Object.defineProperties(Logger, {
      /**
       * Heebie
       */
      blop: {
        get: function(){
          'snurp'
        }
      }
    });

    return Logger;
  });

}());
