/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/eventmanager", "./statusbar", "./toggler" ], function( EventManager, StatusBar, Toggler ){

  function UI( butter, options ){

    var _element = document.createElement( "div" ),
        _statusBar = new StatusBar( butter, _element ),
        _toggler = new Toggler( butter, _element ),
        _em = new EventManager( this ),
        _state = true;

    _element.id = "butter-timeline";
    _element.setAttribute( "data-butter-exclude", "true" );
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

   }; //UI

   UI.__moduleName = "ui";

   return UI;

});
