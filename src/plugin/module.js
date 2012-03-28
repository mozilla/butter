/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function() {

  define( [ "core/logger", "core/eventmanager", "util/dragndrop" ], function( Logger, EventManager, DragNDrop ) {

    var __trackEventCSSRules = {},
        __cssRuleProperty = "data-butter-trackevent-type",
        __cssRulePrefix = "#butter-timeline .butter-track-event",
        __newStyleSheet = document.createElement( "style" );

    __newStyleSheet.type = "text/css";
    __newStyleSheet.media = "screen";
    __newStyleSheet.setAttribute( "data-butter-exclude", "true" );

    function colourHashFromType( type ){
      var hue = 0, saturation = 0, lightness = 0, srcString = type;

      // very simple hashing function
      while( srcString.length < 9 ){
        srcString += type;
      } //while
      hue = ( srcString.charCodeAt( 0 ) + srcString.charCodeAt( 3 ) + srcString.charCodeAt( 6 ) ) % ( ( srcString.charCodeAt( 8) * 5 ) % 360 );
      saturation = ( ( srcString.charCodeAt( 0 ) + srcString.charCodeAt( 2 ) + srcString.charCodeAt( 4 ) + srcString.charCodeAt( 6 ) ) % 100 ) * 0.05 + 95;
      lightness = ( ( srcString.charCodeAt( 1 ) + srcString.charCodeAt( 3 ) + srcString.charCodeAt( 5 ) + srcString.charCodeAt( 7 ) ) % 100 ) * 0.20 + 40;

      // bump up reds because they're hard to see
      if( hue < 20 || hue > 340 ){
        lightness += 10;
      } //if

      // dial back blue/greens a bit
      if( hue > 160 && hue < 200 ){
        lightness -= 10;
      } //if

      return {
        h: hue,
        s: saturation,
        l: lightness
      };
    } //colourHashFromType

    function createStyleForType( type ){
      var styleContent = __newStyleSheet.innerHTML,
          hash = colourHashFromType( type );
      styleContent +=__cssRulePrefix + "[" + __cssRuleProperty + "=\"" + type + "\"]{";
      styleContent += "background: hsl( " + hash.h + ", " + hash.s + "%, " + hash.l + "% )";
      styleContent += "}";
      __newStyleSheet.innerHTML = styleContent;
    } //createStyleForType

    var PluginManager = function( butter, moduleOptions ) {

      var __butter = butter;

      var __plugins = [],
          __container = document.createElement( "ul" ),
          __addPopcornButton = document.createElement( "button" ),
          __addPopcornButton,
          __this = this,
          __pluginElementPrefix = "butter-plugin-",
          __pattern = '<li class="$type_tool">$type</li>';

      __container.id = "butter-plugin";
      __addPopcornButton.id = "add-popcorn";

      __addPopcornButton.innerHTML = "+Popcorn";

      document.head.appendChild( __newStyleSheet );

      var Plugin = function ( pluginOptions ) {
        pluginOptions = pluginOptions || {};

        var _id = "plugin" + __plugins.length,
            _this = this,
            _name = pluginOptions.name || 'Plugin' + Date.now(),
            _path = pluginOptions.path,
            _manifest = {},
            _type = pluginOptions.type,
            _element;

        if( !__trackEventCSSRules[ _type ] ){
          createStyleForType( _type );
        } //if

        if( _path ) {
          var head = document.getElementsByTagName( "HEAD" )[ 0 ],
              script = document.createElement( "script" );

          script.src = _path;
          head.appendChild( script );
        } //if

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
          }, //path
          manifest: {
            get: function() {
              return _manifest;
            },
            set: function( manifest ) {
              _manifest = manifest;
            }
          }, //manifest
          type: {
            get: function() {
              return _type;
            }
          }
        }); //defineProperties


        this.createElement = function ( pattern ) {
          var pluginElement,
              helper;
          if ( !pattern ) {
            pluginElement = document.createElement( "span" );
            pluginElement.innerHTML = _this.type + " ";
          }
          else {
            var patternInstance = pattern.replace( /\$type/g, _this.type );
            var range = document.createRange();
            range.selectNode( document.body.children[ 0 ] );
            pluginElement = range.createContextualFragment( patternInstance ).childNodes[ 0 ];
          }
          pluginElement.id = __pluginElementPrefix + _this.type;
          helper = document.getElementById( _this.type + "-icon" ) || document.getElementById( "default-icon" );
          pluginElement.setAttribute( "data-butter-plugin-type", _this.type );
          pluginElement.setAttribute( "data-butter-draggable-type", "plugin" );
          DragNDrop.helper( pluginElement, {
            image: helper,
            start: function(){
              var targets = butter.targets,
                  media = butter.currentMedia;
              media.view.blink();
              for( var i=0, l=targets.length; i<l; ++i ){
                targets[ i ].view.blink();
              }
            },
            stop: function(){
              
            }
          });
          this.element = pluginElement;
          return pluginElement;
        }; //createElement

      }; //Plugin

      this._start = function( onModuleReady ){
        if( butter.ui ){
          butter.ui.areas[ "tools" ].addComponent( __container );
          butter.ui.areas[ "tools" ].addComponent( __addPopcornButton );
        }
        
        if( moduleOptions && moduleOptions.plugins ){
          __this.add( moduleOptions.plugins, onModuleReady );
        }
        else{
          onModuleReady();
        }
      }; //start

      this.add = function( plugin, cb ) {

        if( plugin instanceof Array ) {
          var counter = 0,
              i = 0,
              l = 0,
              check = function() {
                if ( ++counter === plugin.length && cb ) {
                  cb();
                }
              };
        
          for( i = 0, l = plugin.length; i < l; i++ ) {
            __this.add( plugin[ i ], check );
          }
        } else {

          if ( !( plugin instanceof Plugin ) ) {
            plugin = new Plugin( plugin );
            var interval = setInterval(function( e ) {
              if( !Popcorn.manifest[ plugin.type ]) {
                return;
              }
              plugin.manifest = Popcorn.manifest[ plugin.type ];
              clearInterval( interval );
              if ( cb ) {
                cb();
              }
            }, 100);
          } //if
          __plugins.push( plugin );

          __container.appendChild( plugin.createElement( __pattern ) );

          __butter.dispatch( "pluginadded", plugin );

          return plugin;
        }
      }; //add

      this.remove = function( plugin ) {

        if( typeof plugin === "string" ) {
          plugin = this.get( plugin );
          if( !plugin ) {
            return;
          }
        }

        var i, l;

        for ( i = 0, l = __plugins.length; i < l; i++ ) {
          if( __plugins[ i ].name === plugin.name ) {
            var tracks = butter.tracks;
            for ( i = 0, l = tracks.length; i < l; i++ ) {
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
            for ( i = 0, l = head.children.length; i < l; i++ ) {
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

    PluginManager.__moduleName = "plugin";

    return PluginManager;

  }); //define
})();
