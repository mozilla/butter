/**********************************************************************************

Copyright (C) 2012 by Mozilla Foundation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

**********************************************************************************/

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

