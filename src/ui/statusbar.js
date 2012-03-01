/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [], function(){

  var StatusBar = function( butter, parentElement ){
    var _rootElement = document.createElement( "div" ),
        _list = document.createElement( "div" ),
        _visible = true,
        _media = {};

    _rootElement.id = "butter-status-bar";
    _rootElement.appendChild( _list );
    parentElement.appendChild( _rootElement );

    butter.listen( "mediachanged", function( e ){
    });

    butter.listen( "mediaadded", function( e ){
      var item = document.createElement( "div" ),
          text = document.createElement( "div" );
      _list.appendChild( item );
      item.appendChild( text );
      text.className = "media-url";
      text.innerHTML = e.data.url;
      _media[ e.data.id ] = item;
    });

    butter.listen( "mediaremoved", function( e ){
    });

    Object.defineProperties( this, {
      visible: {
        enumerable: true,
        get: function(){
          return _visible;
        },
        set: function( val ){
          if( val !== _visible ){
            _visible = val;
            _list.style.visibility = _visible ? "visible" : "hidden";
          } //if
        }
      }
    });

  }; //StatusBar

  return StatusBar;
}); //define

