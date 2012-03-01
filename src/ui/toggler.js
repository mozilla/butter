/* Copyright 2011, 2012 - Mozilla Foundation
 * This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MPL was not distributed with this file, you can
 * obtain one at http://www.opensource.org/licenses/mit-license.php */

define( [], function(){
  return function( butter, parentElement ){
    var _butter = butter,
        _parent = parentElement,
        _element = document.createElement( "div" ),
        _img = document.createElement( "div" );

    _element.id = "toggle-button";
    _element.appendChild( _img );
    _parent.appendChild( _element );

    _element.addEventListener( "click", function( e ){
      _butter.ui.visible = !_butter.ui.visible;
    }, false );

  };
});
