/*! This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define([ "util/xhr", "loaders/js-loader", "loaders/css-loader", "loaders/load-group" ],
  function( XHR, JSLoader, CSSLoader, LoadGroup ) {

  return function( config ) {

    var _configDirs = config.value( "dirs" );

    var _loaders = {
      js: new JSLoader( _configDirs ),
      css: new CSSLoader( _configDirs )
    };

    this.load = function( items, readyCallback, errorCallback, ordered ) {
      var loadGroup;

      errorCallback = errorCallback || function( e ) {
        if ( e ) {
          console.warn( e.toString() );
        }
      };

      loadGroup = new LoadGroup( _loaders, readyCallback, errorCallback, ordered );

      // if `items` is an array, add items to the LoadGroup individually
      if ( Array.isArray( items ) && items.length > 0 ) {
        items.forEach( function( item ) {
          loadGroup.addItem( item );
        });
      }
      else {
        // otherwise, just add the one item
        loadGroup.addItem( items );
      }

      loadGroup.start();
    };

  };

});
