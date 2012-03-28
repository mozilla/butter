/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/eventmanager", "./toggler" ], function( EventManager, Toggler ){

  var TRANSITION_DURATION = 500;

  function Area( id, element ){
    var _em = new EventManager( this ),
        _components = [],
        _this = this;

    this.element = element || document.createElement( "div" );
    this.items = {};

    this.addComponent = function( component ){
      _components.push( component );
    };

    this.setContentState = function( state ){

    };
  }

  function Component( element, options ){
    var _element = element,
        _onTransitionIn = options.in || function(){},
        _onTransitionOut = options.out || function(){},
        _events = events || {};
  }

  function UI( butter, options ){

    var _em = new EventManager( this ),
        _areas = {},
        _contentState = [],
        _state = true,
        _this = this;

    _areas[ "main" ] = new Area( "butter-tray" );

    var _element = _areas[ "main" ].element,
        _toggler = new Toggler( butter, _element );

    _element.setAttribute( "data-butter-exclude", "true" );
    _element.className = "butter-tray";

    function createArea( id ){
      var area = {
        element: document.createElement( "div" ),
        items: {}
      }
      area.element.id = id;
      return area;
    }

    _areas.work = new Area( "work" );
    _areas.statusbar = new Area( "status-bar" );
    _areas.tools = new Area( "tools" );

    _element.appendChild( _areas[ "statusbar" ].element );
    _element.appendChild( _areas[ "work" ].element );
    _element.appendChild( _areas[ "tools" ].element );

    if( options.enabled !== false ){
      document.body.appendChild( _element );
    }

    this.addToArea = function( area, name, childElement ){
      if( _areas[ area ] && !_areas[ area ].items[ name ] ){
        if( !childElement.parentNode ){
          _areas[ area ].element.appendChild( childElement );
        }
        _areas[ area ].items[ name ] = childElement;
      }
      else{
        throw new Error( "UI Component " + name + " already exists on " + area + "." );
      }
    };

    this.removeFromArea = function( area, name ){
      if( _areas[ area ] && _areas[ area ].items[ name ] ){
        var element = _areas[ area ].items[ name ];
        if( element.parentNode === _areas[ area ].element ){
          _areas[ area ].element.removeChild( element );
        }
        delete _areas[ area ].items[ name ];
      }
    };

    this.pushContentState = function( state ){
      var oldState = _this.contentState;
      _contentState.push( state );
      _element.setAttribute( "data-butter-content-state", _this.contentState );
      _em.dispatch( "contentstatechanged", {
        oldState: oldState,
        newState: _this.contentState
      });
    };

    this.popContentState = function(){
      var oldState = _contentState.pop();
      _element.setAttribute( "data-butter-content-state", _this.contentState );
      _em.dispatch( "contentstatechanged", {
        oldState: oldState,
        newState: _this.contentState
      });
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

   } //UI

   UI.__moduleName = "ui";

   return UI;

});
