/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/logger", "util/dragndrop", "util/scrollbars",
          "./plugin-list", "./plugin" ],
  function( Logger, DragNDrop, Scrollbars,
            PluginList, Plugin ) {

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
    }
    hue = ( srcString.charCodeAt( 0 ) + srcString.charCodeAt( 3 ) + srcString.charCodeAt( 6 ) ) % ( ( srcString.charCodeAt( 8) * 5 ) % 360 );
    saturation = ( ( srcString.charCodeAt( 0 ) + srcString.charCodeAt( 2 ) + srcString.charCodeAt( 4 ) + srcString.charCodeAt( 6 ) ) % 100 ) * 0.05 + 95;
    lightness = ( ( srcString.charCodeAt( 1 ) + srcString.charCodeAt( 3 ) + srcString.charCodeAt( 5 ) + srcString.charCodeAt( 7 ) ) % 100 ) * 0.20 + 40;

    // bump up reds because they're hard to see
    if( hue < 20 || hue > 340 ){
      lightness += 10;
    }

    // dial back blue/greens a bit
    if( hue > 160 && hue < 200 ){
      lightness -= 10;
    }

    return {
      h: hue,
      s: saturation,
      l: lightness
    };
  }

  function createStyleForType( type ){
    var styleContent = "",
        hash = colourHashFromType( type );
    styleContent +=__cssRulePrefix + "[" + __cssRuleProperty + "=\"" + type + "\"]{";
    styleContent += "background: hsl( " + hash.h + ", " + hash.s + "%, " + hash.l + "% );";
    styleContent += "}";
    __newStyleSheet.innerHTML = __newStyleSheet.innerHTML + styleContent;
  }

  var PluginManager = function( butter, moduleOptions ) {

    var _plugins = this.plugins = [],
        _container = document.createElement( "div" ),
        _listWrapper = document.createElement( "div" ),
        _listContainer = document.createElement( "div" ),
        _this = this,
        _pattern = '<div class="list-item $type_tool">$type</div>';

    _container.id = "popcorn-plugin";
    _listContainer.className = "list";
    _listWrapper.className = "list-wrapper";

    var title = document.createElement( "div" );
    title.className = "title";
    title.innerHTML = "<span>My Events</span>";
    _container.appendChild( title );
    _listWrapper.appendChild( _listContainer );
    _container.appendChild( _listWrapper );

    var _scrollbar = new Scrollbars.Vertical( _listWrapper, _listContainer );
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
    };

    function generatePluginTypeCheckFunction( pluginType ) {
      return function(){
        return !!Popcorn.manifest[ pluginType ];
      };
    }

    this.add = function( plugins, onReadyCallback ) {
      var newPlugins = [],
          pluginLoadDescriptors = [],
          plugin,
          i,
          l;

      if( ! ( plugins instanceof Array ) ) {
        plugins = [ plugins ];
      }

      for( i = 0, l = plugins.length; i < l; i++ ) {
        plugin = new Plugin( plugins[ i ] );
        if( !__trackEventCSSRules[ plugin.type ] ){
          createStyleForType( plugin.type );
        }
        pluginLoadDescriptors.push({
          type: "js",
          url: plugin.path,
          check: generatePluginTypeCheckFunction( plugin.type )
        });
        newPlugins.push( plugin );
      }

      butter.loader.load( pluginLoadDescriptors, function(){
        for( i = 0, l = newPlugins.length; i < l; i++ ) {
          plugin = newPlugins[ i ];
          if( moduleOptions.defaults && moduleOptions.defaults.indexOf( plugin.type ) > -1 ){
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
              }
            }
          }

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
      while ( _plugins.length > 0 ) {
        var plugin = _plugins.pop();
        _listContainer.removeChild( plugin.element );
        butter.dispatch( "pluginremoved", plugin );
      }
    };

    this.get = function( name ) {
      for ( var i=0, l=_plugins.length; i<l; ++i ) {
        if ( _plugins[ i ].name === name ) {
          return _plugins[ i ];
        }
      }
    };

    DragNDrop.droppable( _container, {
      drop: function( element ){
        if( element.getAttribute( "data-butter-draggable-type" ) === "plugin" ){
          var pluginType = element.getAttribute( "data-popcorn-plugin-type" ),
              plugin = _this.get( pluginType );
          if( plugin ){
            for( var i=0; i<_listContainer.childNodes.length; ++i ){
              if( _listContainer.childNodes[ i ].getAttribute( "data-popcorn-plugin-type" ) === pluginType ){
                return;
              }
            }
            _listContainer.appendChild( plugin.createElement( butter, _pattern ) );
            _scrollbar.update();
          }
        }
      }
    });
  };

  PluginManager.__moduleName = "plugin";

  return PluginManager;

});
