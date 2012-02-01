/**********************************************************************************

Copyright (C) 2012 by Mozilla Foundation

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

    var PluginManager = function( butter, moduleOptions ) {

      var __plugins = [],
          __container,
          __pluginElementPrefix = "butter-plugin-",
          __pattern = '<li class="$type_tool ui-draggable"><a href="#" title="$type"><span></span>$type</a></li>';

      var Plugin = function ( pluginOptions ) {
        pluginOptions = pluginOptions || {};

        var _id = "plugin" + __plugins.length,
            _this = this,
            _name = pluginOptions.name || 'Plugin' + Date.now(),
            _path = pluginOptions.path;

        this.type = pluginOptions.type;
        this.element = undefined;

        Object.defineProperties( this, { 
          plugins: {
            get: function() {
              return __plugins;
            }
          }, //plugins
          pluginElementPrefix: {
            get: function() {
              return __pluginElementPrefix;
            }
          }, //pluginElementPrefix
          id: {
            get: function() {
              return _id;
            }
          }, //id
          name: {
            get: function() {
              return _name;
            }
          }, //name
          path: {
            get: function() {
              return _path;
            }
          } //path
        }); //defineProperties


        this.createElement = function ( pattern ) {
          var pluginElement;
          if ( !pattern ) {
            pluginElement = document.createElement( "span" );
            pluginElement.innerHTML = _this.type + " ";
          }
          else {
            var patternInstance = pattern.replace( /\$type/g, _this.type );
            var $pluginElement = $( patternInstance );
            pluginElement = $pluginElement[ 0 ];
          }
          pluginElement.id = __pluginElementPrefix + _this.type;
          $( pluginElement ).draggable({ helper: "clone", appendTo: "body", zIndex: 9999999999, revert: true, revertDuration: 0 });
          this.element = pluginElement;
          return pluginElement;
        }; //createElement

      }; //Plugin

      __container = document.createElement( "div" );
      __container.id = "butter-plugin";
      
      //__container.className = "viewport enable-scroll";
      document.getElementById( "butter-timeline" ).appendChild( __container );

      this.add = function( plugin ) {

        if ( !( plugin instanceof Plugin ) ) {
          plugin = new Plugin( plugin );
        } //if
        __plugins.push( plugin );

        butter.dispatch( "pluginadded", plugin );

        __container.appendChild( plugin.createElement( __pattern ) );

        if( plugin._path ) {
          var head = document.getElementsByTagName( "HEAD" )[ 0 ],
              script = document.createElement( "script" );
          
          script.src = _path;
          head.appendChild( script );
        }
        
        return plugin;
      }; //add

      this.remove = function( plugin ) {

        if( typeof plugin === "string" ) {
          plugin = this.get( plugin );
          if( !plugin ) {
            return;
          }
        }

        for( var i =0,l = __plugins.length; i < l; i++ ) {
          if( __plugins[ i ].name === plugin.name ) {
            var tracks = butter.tracks;
            for( var i = 0, l = tracks.length; i < l; i++ ) {
              var trackEvents = tracks[ i ].trackEvents;
              for( var k = 0, ln = trackEvents.length - 1; ln >= k; ln-- ) {
                if( trackEvents[ ln ].type === plugin.name ) {
                  tracks[ i ].removeTrackEvent( trackEvents[ ln ] );
                } //if
              } //for
            } //for

            __plugins.splice( i, 1 );
            l--;
            __container.removeChild( plugin.element );

            var head = document.getElementsByTagName( "HEAD" )[ 0 ];
            for( var i = 0, l = head.children.length; i < l; i++ ) {
              if( head.children[ i ].getAttribute( "src" ) === plugin.path ) {
                head.removeChild( head.children[ i ] );
              }
            }

            butter.dispatch( "pluginremoved", plugin );
          }
        }
      };

      this.clear = function () {
        while ( plugins.length > 0 ) {
          var plugin = __plugins.pop();
          __container.removeChild( plugin.element );
          butter.dispatch( "pluginremoved", plugin );
        }
      }; //clear

      this.get = function( name ) {
        for ( var i=0, l=__plugins.length; i<l; ++i ) {
          if ( __plugins[ i ].name === name ) {
            return __plugins[ i ];
          } //if
        } //for
      }; //get
    }; //PluginManager

    return PluginManager;

  }); //define
})();
