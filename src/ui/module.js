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

define( [ "core/eventmanager", "./statusbar", "./toggler" ], function( EventManager, StatusBar, Toggler ){

  return function( butter, options ){

    var _element = document.createElement( "div" ),
        _statusBar = new StatusBar( butter, _element ),
        _toggler = new Toggler( butter, _element ),
        _em = new EventManager( this ),
        _state = true;

    _element.id = "butter-timeline";
    _element.className = "butter-timeline";
    document.body.appendChild( _element );

    Object.defineProperties( this, {
      element: {
        configurable: false,
        enumerable: true,
        get: function(){
          return _element;
        }
      },
      visible: {
        enumerable: true,
        get: function(){
          return _state;
        },
        set: function( val ){
          if( _state !== val ){
            _state = val;
            if( _state ){
              _element.setAttribute( "ui-state", "visible" );
              _em.dispatch( "uivisibilitychanged", true );
              _statusBar.visible = true;
            }
            else {
              _element.setAttribute( "ui-state", "hidden" );
              _em.dispatch( "uivisibilitychanged", false );
              _statusBar.visible = false;
            } //if
          } //if
        }
      }
    });

  };

});
