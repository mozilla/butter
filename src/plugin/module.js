/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

/**
 * Module: PluginModule
 *
 * A Butter module which provides Popcorn plugin support.
 */
define( [ "core/logger", "util/dragndrop", "util/scrollbars",
          "./plugin-list", "./plugin" ],
  function( Logger, DragNDrop, Scrollbars,
            PluginList, Plugin ) {

  var __trackEventCSSRules = {},
      __cssRuleProperty = "data-butter-trackevent-type",
      __cssRulePrefix = ".butter-timeline .butter-track-event",
      __newStyleSheet = document.createElement( "style" );

  __newStyleSheet.type = "text/css";
  __newStyleSheet.media = "screen";
  __newStyleSheet.setAttribute( "data-butter-exclude", "true" );

  /**
   * Function: colourHashFromType
   *
   * Simple hash function to calculates a [relatively] unique colour for a plugin.
   *
   * @param {String} type: Name of the plugin
   */
  function colourHashFromType( type ) {
    var hue = 0, saturation = 0, lightness = 0, srcString = type;

    // very simple hashing function
    while ( srcString.length < 9 ) {
      srcString += type;
    }
    hue = ( srcString.charCodeAt( 0 ) + srcString.charCodeAt( 3 ) + srcString.charCodeAt( 6 ) ) % ( ( srcString.charCodeAt( 8) * 5 ) % 360 );
    saturation = ( ( srcString.charCodeAt( 0 ) + srcString.charCodeAt( 2 ) + srcString.charCodeAt( 4 ) + srcString.charCodeAt( 6 ) ) % 100 ) * 0.05 + 95;
    lightness = ( ( srcString.charCodeAt( 1 ) + srcString.charCodeAt( 3 ) + srcString.charCodeAt( 5 ) + srcString.charCodeAt( 7 ) ) % 100 ) * 0.20 + 40;

    // bump up reds because they're hard to see
    if ( hue < 20 || hue > 340 ) {
      lightness += 10;
    }

    // dial back blue/greens a bit
    if ( hue > 160 && hue < 200 ) {
      lightness -= 10;
    }

    return {
      h: hue,
      s: saturation,
      l: lightness
    };
  }

  /**
   * Function: createStyleForType
   *
   * Creates a css entry for a plugin type
   *
   * @param {String} type: Name of the plugin
   */
  function createStyleForType( type ) {
    var styleContent = "",
        hash = colourHashFromType( type );
    styleContent +=__cssRulePrefix + "[" + __cssRuleProperty + "=\"" + type + "\"]{";
    styleContent += "background: hsl( " + hash.h + ", " + hash.s + "%, " + hash.l + "% );";
    styleContent += "}";
    __newStyleSheet.innerHTML = __newStyleSheet.innerHTML + styleContent;
  }

  /**
   * Class: PluginManager
   *
   * Provides Butter module functionality for Plugins
   *
   * @param {Butter} butter: A butter instance
   * @param {Butter} moduleOptions: Config options passed in when module starts up.
   */
  var PluginManager = function( butter, moduleOptions ) {

    var _plugins = this.plugins = [],
        _container,
        _listWrapper,
        _listContainer,
        _this = this,
        _pattern = '<div class="list-item $type_tool">$type</div>';

    var _scrollbar;

    /**
     * Member: _start
     *
     * Module start function
     *
     * @param {Function} onModuleReady: Callback to signify that this module is ready to run
     */
    this._start = function( onModuleReady ) {
      if ( butter.ui ) {
        document.head.appendChild( __newStyleSheet );
        _container = butter.ui.tray.pluginArea.querySelector( ".popcorn-plugin-list" );
        _listContainer = _container.querySelector( ".list" );
        _listWrapper = _container.querySelector( ".list-wrapper" );
        _scrollbar = new Scrollbars.Vertical( _listWrapper, _listContainer );
        _container.appendChild( _scrollbar.element );

        // Make the entire container droppable so that it can be added to.
        DragNDrop.droppable( _container, {
          drop: function( element ){
            var pluginType = element.getAttribute( "data-popcorn-plugin-type" ),
                draggableType = element.getAttribute( "data-butter-draggable-type" ),
                plugin,
                existingContainer;

            if ( draggableType === "plugin" ) {
              plugin = _this.get( pluginType );
              if ( plugin ) {
                existingContainer = _listContainer.querySelector( "[data-popcorn-plugin-type='" + pluginType + "']" );
                if ( !existingContainer ) {
                  _listContainer.appendChild( plugin.createElement( butter, _pattern ) );
                  _scrollbar.update();
                }
              }
            }
          }
        });

        PluginList( butter );
      }
      if ( moduleOptions && moduleOptions.plugins ) {
        _this.add( moduleOptions.plugins, onModuleReady );
      }
      else {
        onModuleReady();
      }
    };

    /**
     * Member: generatePluginTypeCheckFunction
     *
     * Generates a check function for the given plugin type specifically for the butter loader to use.
     *
     * @param {String} pluginType: Name of plugin
     */
    function generatePluginTypeCheckFunction( pluginType ) {
      return function(){
        // Does Popcorn know about this plugin type yet?
        return !!Popcorn.manifest[ pluginType ];
      };
    }

    /**
     * Member: add
     *
     * Add a plugin to Butter
     *
     * @param {String or Array} plugins: Plugins to add to the system. If this parameter is an array, each entry will be added separately.
     * @param {Function} onReadyCallback: Callback to call when plugins are finished loading.
     */
    this.add = function( plugins, onReadyCallback ) {
      var newPlugins = [],
          pluginLoadDescriptors = [],
          plugin,
          i,
          l;

      // Try to always use an array for code simplicity
      if ( ! ( plugins instanceof Array ) ) {
        plugins = [ plugins ];
      }

      for ( i = 0, l = plugins.length; i < l; i++ ) {
        plugin = new Plugin( plugins[ i ] );

        // Create the styling for this plugin and its trackevents
        if ( !__trackEventCSSRules[ plugin.type ] ){
          createStyleForType( plugin.type );
        }

        // Create a loader descriptor for this plugin type for the Butter loader
        pluginLoadDescriptors.push({
          type: "js",
          url: plugin.path,
          check: generatePluginTypeCheckFunction( plugin.type )
        });

        newPlugins.push( plugin );
      }

      butter.loader.load( pluginLoadDescriptors, function(){
        for ( i = 0, l = newPlugins.length; i < l; i++ ) {
          plugin = newPlugins[ i ];
          if ( moduleOptions.defaults && moduleOptions.defaults.indexOf( plugin.type ) > -1 ) {
            _listContainer.appendChild( plugin.createElement( butter, _pattern ) );
          }
          _plugins.push( plugin );
          butter.dispatch( "pluginadded", newPlugins[ i ] );
        }
        _scrollbar.update();
        onReadyCallback();
      });

      return newPlugins;
    };

    /**
     * Member: remove
     *
     * Remove a plugin from Butter
     *
     * @param {String or Plugin} plugin: Name of plugin or Plugin object to remove
     */
    this.remove = function( plugin ) {
      var trackEvents,
          trackEvent,
          i;

      // If a string was passed in, try to get a Plugin object instead.
      if ( typeof plugin === "string" ) {
        plugin = this.get( plugin );
        if ( !plugin ) {
          // If no plugin was found, we know we don't have to go any further because it's not here!
          return;
        }
      }

      // Remove all trackevents that were using this plugin type
      trackEvents = butter.getTrackEventsByType( plugin.type );
      while ( trackEvents.length ) {
        trackEvent = trackEvents.pop();
        trackEvent.track.removeTrackEvent( trackEvent );
      }

      // Drop reference to plugin object
      i = _plugins.indexOf( plugin );
      if ( i > -1 ) {
        _plugins.splice( i, 1 );
      }

      // If it was in the plugin list, remove it
      if ( plugin.element && plugin.element.parentNode ) {
        _listContainer.removeChild( plugin.element );
      }

      // Update scrollbars because height of list may have changed.
      _scrollbar.update();

      butter.dispatch( "pluginremoved", plugin );
    };

    /**
     * Member: clear
     *
     * Removes all plugins from Butter.
     */
    this.clear = function() {
      while ( _plugins.length > 0 ) {
        var plugin = _plugins.pop();
        if ( plugin.element && plugin.element.parentNode ) {
          _listContainer.removeChild( plugin.element );
        }
        butter.dispatch( "pluginremoved", plugin );
      }
    };

    /**
     * Member: get
     *
     * Returns a plugin object corresponding to the given type.
     *
     * @param {String} type: Name of plugin to retrieve
     */
    this.get = function( type ) {
      for ( var i = 0, l = _plugins.length; i < l; ++i ) {
        if ( _plugins[ i ].type === type ) {
          return _plugins[ i ];
        }
      }
    };

  };

  // Give the module a name so the module loader can act sanely.
  PluginManager.__moduleName = "plugin";

  return PluginManager;

});
