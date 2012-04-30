/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [], function(){
  return function( butter, parentElement ){
    var _butter = butter,
        _parent = parentElement,
        _element = document.createElement( "div" ),
        _img = document.createElement( "div" ),
        _this = this;

    _element.id = "toggle-button";
    _element.title = "Show/Hide Timeline";
    _element.appendChild( _img );
    _parent.appendChild( _element );

    _element.addEventListener( "click", function( e ){
      _butter.ui.visible = !_butter.ui.visible;
    }, false );

    Object.defineProperties( _this, {
      visible: {
        enumerable: true,
        get: function(){
          return _element.style.display !== "none";
        },
        set: function( val ){
          _element.style.display = val ? "block" : "none";
        }
      }
    });

  };
});
