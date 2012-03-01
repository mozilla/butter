/* Copyright 2011, 2012 - Mozilla Foundation
 * This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MPL was not distributed with this file, you can
 * obtain one at http://www.opensource.org/licenses/mit-license.php */

(function() {

  define( [], function() {

    return function( name ) {

      this.log = function( message ) {
        console.log( "[" + name + "] " + message );
      }; //log

      this.error = function( message ) {
        throw new Error( "[" + name + "]" + message ); 
      }; //error

    }; //Logger

  }); //define

})();
