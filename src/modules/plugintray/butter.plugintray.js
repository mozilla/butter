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

(function( window, document, undefined, Butter ) {

  Butter.registerModule( "plugintray", function ( options ) {
    
    var plugins = [],
        numPlugins = 0,
        container;
    
    var Plugin = function ( options ) {
      var id = numPlugins++,
          butter = undefined;

      options = options || {};
      var name = options.name || 'Plugin' + Date.now();
      this.type = options.type;
      
      this.getName = function () {
        return name;
      };

      this.getId = function () {
        return id;
      }; //getId

      this.setButter = function ( b ) {
        butter = b;
      };

      this.getButter = function ()  {
        return butter;
      };

    };

    options = options || {};
    container = document.getElementById( options.target ) || options.target;

    this.addPlugin = function( plugin ) {

      if ( !( plugin instanceof Plugin ) ) {
        plugin = new Plugin( plugin );
      } //if
      plugins.push( plugin );

      plugin.setButter( this );
      this.trigger( "pluginadded", plugin );
      
      var pluginElement = document.createElement( "span" );
      pluginElement.innerHTML = plugin.type + " ";
      pluginElement.id = plugin.type;
      pluginElement.setAttribute( "data-trackliner-type", "butterapp" );
      $( pluginElement ).draggable({ helper: "clone", appendTo: "body", zIndex: 9001, revert: true, revertDuration: 0 });
      container.appendChild( pluginElement );
      
      return plugin;
    }; //addPlugin
        
    this.getPlugins = function () {
      return plugins;
    }; //getPlugins

  }); //plugintray

})( window, document, undefined, Butter );

