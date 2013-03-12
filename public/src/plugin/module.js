/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

/**
 * Module: PluginModule
 *
 * A Butter module which provides Popcorn plugin support.
 */
define( [ "core/logger", "./plugin-list", "./plugin" ],
  function( Logger, PluginList, Plugin ) {

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
        _pluginList,
        _this = this;

    /**
     * Member: _start
     *
     * Module start function
     *
     * @param {Function} onModuleReady: Callback to signify that this module is ready to run
     */
    this._start = function( onModuleReady ) {
      _pluginList = new PluginList( butter );
      if ( moduleOptions && moduleOptions.plugins ) {
        _this.add( moduleOptions.plugins, onModuleReady );
      }
      else {
        onModuleReady();
      }
    };

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
          plugin,
          i,
          l;

      // Try to always use an array for code simplicity
      if ( ! ( plugins instanceof Array ) ) {
        plugins = [ plugins ];
      }

      for ( i = 0, l = plugins.length; i < l; i++ ) {
        plugin = new Plugin( plugins[ i ] );
        newPlugins.push( plugin );

        if ( butter.ui.enabled ) {
          plugin.generateHelper();
        }
      }

      setTimeout(function() {
        for ( i = 0, l = newPlugins.length; i < l; i++ ) {
          plugin = newPlugins[ i ];
          _plugins.push( plugin );
          butter.dispatch( "pluginadded", plugin );
        }
        onReadyCallback();
      }, 4 );

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
