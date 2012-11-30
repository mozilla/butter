/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

(function( undefined ) {

  // By default, logging is off.
  var __debug = false;

  /**$
   * Logger
   *
   * Supplies customized logging functionality to Butter.
   *
   * @type module
   */
  define( [],
    function() {

    /**$
     * Logger::Logger
     *
     * Controls logging for a specific object instance.
     *
     * @type class
     * @param {String} name Name of the object to report in the log.
     * @api public
     */
    function Logger( name ) {

      /**$
       * Logger::Logger::log
       *
       * Logs a message to the console prefixed by the given name.
       *
       * @type member
       * @api public
       * @param {String} message Contents of the log message
       */
      this.log = function( message ) {
        if ( __debug ) {
          console.log( "[" + name + "] " + message );
        }
      };

      /**$
       * Logger::Logger::error
       *
       * Throws an error with the given message prefixed by the given name.
       *
       * @type member
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

    /**$
     * Logger::Logger::enabled
     *
     * Whether the logger is enabled or not.
     *
     * @type class function
     * @param {Boolean} value State of the logger.
     * @api public
     */
    Logger.enabled = function( value ) {
      if ( value !== undefined ) {
        __debug = !!value;
      }
      return __debug;
    };

    Object.defineProperties(Logger, {
      /**$
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
