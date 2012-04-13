/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function() {

  define( [ "core/logger",
            "core/eventmanager",
            "util/dragndrop",
            "util/scrollbars",
            "./plugin-list",
            "./plugin"
          ], 
          function(
            Logger,
            EventManager,
            DragNDrop,
            Scrollbars,
            PluginList,
            Plugin
          ) {

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
      var styleContent = "",
          hash = colourHashFromType( type );
      styleContent +=__cssRulePrefix + "[" + __cssRuleProperty + "=\"" + type + "\"]{";
      styleContent += "background: hsl( " + hash.h + ", " + hash.s + "%, " + hash.l + "% );";
      styleContent += "}";
      __newStyleSheet.innerHTML = __newStyleSheet.innerHTML + styleContent;
    } //createStyleForType

    var PluginManager = function( butter, moduleOptions ) {

      var _plugins = [],
          _container = document.createElement( "div" ),
          _listContainer = document.createElement( "div" ),
          _this = this,
          _pattern = '<div class="list-item $type_tool">$type</div>';

      _container.id = "butter-plugin";
      _listContainer.className = "list";

      var title = document.createElement( "div" );
      title.className = "title";
      title.innerHTML = "<span>My Events</span>";
      _container.appendChild( title );
      _container.appendChild( _listContainer );

      var _scrollbar = new Scrollbars.Vertical( _container, _listContainer );
      _container.appendChild( _scrollbar.element );

      this._start = function( onModuleReady ){
        if( butter.ui ){
          document.head.appendChild( __newStyleSheet );
          butter.ui.areas.tools.addComponent( _container );
          PluginList( butter );
        }
        if( moduleOptions && moduleOptions.plugins ){
          _this.add( moduleOptions.plugins, onModuleReady );
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
            _this.add( plugin[ i ], check );
          }
        } else {
          if( !__trackEventCSSRules[ plugin.type ] ){
            createStyleForType( plugin.type );
          }

          plugin = new Plugin( _plugins.length, plugin );
          
          var interval = setInterval(function( e ) {
            if( !Popcorn.manifest[ plugin.type ]) {
              return;
            }
            plugin.manifest = Popcorn.manifest[ plugin.type ];
            clearInterval( interval );
            if( cb ){
              cb();
            }
          }, 100);

          _plugins.push( plugin );
          _listContainer.appendChild( plugin.createElement( _pattern ) );
          butter.dispatch( "pluginadded", plugin );
        }

        _scrollbar.update();

        return plugin;
      }; //add

      this.remove = function( plugin ) {

        if( typeof plugin === "string" ) {
          plugin = this.get( plugin );
          if( !plugin ) {
            return;
          }
        }

        var i, l;

        for ( i = 0, l = _plugins.length; i < l; i++ ) {
          if( _plugins[ i ].name === plugin.name ) {
            var tracks = butter.tracks;
            for ( i = 0, l = tracks.length; i < l; i++ ) {
              var trackEvents = tracks[ i ].trackEvents;
              for( var k = 0, ln = trackEvents.length - 1; ln >= k; ln-- ) {
                if( trackEvents[ ln ].type === plugin.name ) {
                  tracks[ i ].removeTrackEvent( trackEvents[ ln ] );
                } //if
              } //for
            } //for

            _plugins.splice( i, 1 );
            l--;
            _listContainer.removeChild( plugin.element );

            var head = document.getElementsByTagName( "HEAD" )[ 0 ];
            for ( i = 0, l = head.children.length; i < l; i++ ) {
              if( head.children[ i ].getAttribute( "src" ) === plugin.path ) {
                head.removeChild( head.children[ i ] );
              }
            }

            butter.dispatch( "pluginremoved", plugin );
          }
        }

        _scrollbar.update();
      };

      this.clear = function () {
        while ( plugins.length > 0 ) {
          var plugin = _plugins.pop();
          _listContainer.removeChild( plugin.element );
          butter.dispatch( "pluginremoved", plugin );
        }
      }; //clear

      this.get = function( name ) {
        for ( var i=0, l=_plugins.length; i<l; ++i ) {
          if ( _plugins[ i ].name === name ) {
            return _plugins[ i ];
          } //if
        } //for
      }; //get
    }; //PluginManager

    PluginManager.__moduleName = "plugin";

    return PluginManager;

  }); //define
})();
