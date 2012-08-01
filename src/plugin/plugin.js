/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "util/dragndrop", "util/lang" ], function( DragNDrop, LangUtils ){

  return function( pluginOptions ){
    pluginOptions = pluginOptions || {};

    var _this = this,
        _helper;

    this.type = pluginOptions.type;
    this.path = pluginOptions.path;

    this.generateHelper = function() {
      _helper = document.getElementById( _this.type + "-icon" ) || document.getElementById( "default-icon" );
      if( _helper ) {
        _helper = _helper.cloneNode( false );
        // Prevent two elements from having the same ID on the page
        _helper.id = null;
      }
      _helper.setAttribute( "data-popcorn-plugin-type", _this.type );
      _helper.setAttribute( "data-butter-draggable-type", "plugin" );
      _this.helper = _helper;
    };

  };
});
