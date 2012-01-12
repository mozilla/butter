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

    var PluginManager = function( butter, options ) {

      var plugins = [],
          numPlugins = 0,
          container,
          pluginElementPrefix = "butter-plugin-",
          pattern;
      
      var Plugin = function ( options ) {
        var id = numPlugins++,
            that = this;

        options = options || {};
        var name = options.name || 'Plugin' + Date.now();
        this.type = options.type;
        this.element = undefined;

        Object.defineProperty( this, "id", { get: function() { return id; } } );
        Object.defineProperty( this, "name", { get: function() { return name; } } );
        
        this.createElement = function ( pattern ) {
          var pluginElement;
          if ( !pattern ) {
            pluginElement = document.createElement( "span" );
            pluginElement.innerHTML = that.type + " ";
          }
          else {
            var patternInstance = pattern.replace( /\$type/g, that.type );
            var $pluginElement = $( patternInstance );
            pluginElement = $pluginElement[ 0 ];
          }
          pluginElement.id = pluginElementPrefix + that.type;
          $( pluginElement ).draggable({ helper: "clone", appendTo: "body", zIndex: 9001, revert: true, revertDuration: 0 });
          this.element = pluginElement;
          return pluginElement;
        }; //createElement

      }; //Plugin

      options = options || {};
      container = document.getElementById( options.target ) || options.target;
      pattern = options.pattern;

      this.add = function( plugin ) {

        if ( !( plugin instanceof Plugin ) ) {
          plugin = new Plugin( plugin );
        } //if
        plugins.push( plugin );

        butter.dispatch( "pluginadded", plugin );

        container.appendChild( plugin.createElement( pattern ) );
        
        return plugin;
      }; //add

      Object.defineProperty( this, "plugins", {
        get: function() {
          return plugins;
        }
      }); //plugins

      this.clear = function () {
        while ( plugins.length > 0 ) {
          var plugin = plugins.pop();
          container.removeChild( plugin.element );
          butter.dispatch( "pluginremoved", plugin );
        }
      }; //clear

      this.get = function( name ) {
        for ( var i=0, l=plugins.length; i<l; ++i ) {
          if ( plugins[ i ].name === name ) {
            return plugins[ i ];
          } //if
        } //for
      }; //get

      Object.defineProperty( this, "pluginElementPrefix", {
        get: function() {
          return pluginElementPrefix;
        }
      });

    }; //PluginManager

    return {
      name: "pluginmanager",
      init: function( butter, options ) {
        return new PluginManager( butter, options );
      } //init
    };

  }); //define

})();

