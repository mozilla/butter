/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/eventmanager", "./toggler" ], function( EventManager, Toggler ){

  function UI( butter, options ){

    var _element = document.createElement( "div" ),
        _toggler = new Toggler( butter, _element ),
        _em = new EventManager( this ),
        _areas = {},
        _contentState = [],
        _state = true,
        _this = this;

    _element.id = "butter-tray";
    _element.setAttribute( "data-butter-exclude", "true" );
    _element.className = "butter-tray";

    _areas[ "main" ] = { element: _element, items: {} };
    _areas[ "statusbar" ] = { element: document.createElement( "div" ), items: {} };

    _areas[ "statusbar" ].element.id = "butter-status-bar";

    _element.appendChild( _areas[ "statusbar" ].element );
    document.body.appendChild( _element );

    this.addToArea = function( area, name, childElement ){
      if( _areas[ area ] && !_areas[ area ].items[ name ] ){
        _areas[ area ].element.appendChild( childElement );
        _areas[ area ].items[ name ] = childElement;
      }
      else{
        throw new Error( "UI Component " + name + " already exists on " + area + "." );
      }
    };

    this.removeFromArea = function( area, name ){
      if( _areas[ area ] && _areas[ area ].items[ name ] ){
        _areas[ area ].element.removeChild( _areas[ area ][ name ] );
        delete _areas[ area ].items[ name ];
      }
    };

    this.pushContentState = function( state ){
      _contentState.push( state );
      _element.setAttribute( "data-butter-content-state", _this.contentState );
      _em.dispatch( "contentstatechanged", _this.contentState );
    };

    this.popContentState = function(){
      var oldState = _contentState.pop();
      _element.setAttribute( "data-butter-content-state", _this.contentState );
      _em.dispatch( "contentstatechanged", _this.contentState );
      return oldState;
    };

    Object.defineProperties( this, {
      contentState: {
        configurable: false,
        enumerable: true,
        get: function(){
          if( _contentState.length > 0 ){
            return _contentState[ _contentState.length - 1 ];
          }
          return null;
        }
      },
      element: {
        configurable: false,
        enumerable: true,
        get: function(){
          return _element;
        }
      },
      areas: {
        configurable: false,
        enumerable: true,
        get: function(){
          return _areas;
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
            }
            else {
              _element.setAttribute( "ui-state", "hidden" );
              _em.dispatch( "uivisibilitychanged", false );
            } //if
          } //if
        }
      }
    });

   }; //UI

   UI.__moduleName = "ui";

   return UI;

});
