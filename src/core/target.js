/**********************************************************************************

Copyright (C) 2011 by Mozilla Foundation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

**********************************************************************************/

(function() {
  define( [ "core/logger", "core/eventmanager" ], function( Logger, EventManager ) {

    var Target = function ( options ) {
      var id = Target.guid++,
          logger = new Logger( id ),
          em = new EventManager( this );

      options = options || {};
      var name = options.name || "Target" + id + Date.now();
      this.elementID = options.elementID;

      Object.defineProperty( this, "name", {
        get: function() {
          return name;
        },
      });

      Object.defineProperty( this, "id", {
        get: function() {
          return id;
        },
      });

      Object.defineProperty( this, "json", {
        get: function() {
          var elem = "";
          if( this.elementID ) {
            elem = this.elementID.toString();
          }
          return {
            id: id,
            name: name,
            elementID: elem 
          };
        },
        set: function( importData ) {
          if ( importData.name ) {
            name = importData.name;
          }
          this.elementID = importData.elementID;
        }
      });
    }; //Target
    Target.guid = 0;

    return Target;

  }); //define
})();
