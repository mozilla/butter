/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/eventmanager", "./toggler", "./context-button" ], function( EventManager, Toggler, ContextButton ){

  var TRANSITION_DURATION = 500;

  function Area( id, element ){
    var _em = new EventManager( this ),
        _element,
        _components = [],
        _this = this;

    this.element = _element = element || document.createElement( "div" );
    _element.id = id;
    this.items = {};

    this.addComponent = function( element, options ){
      var component = new Component( element, options );
      _components.push( component );
      _element.appendChild( component.element );
    };

    this.setContentState = function( state ){
      for( var i=0, l=_components.length; i<l; ++i ){
        _components[ i ].setState( state );
      }
    };
  }

  function Component( element, options ){
    options = options || {};
    var _element = element,
        _onTransitionIn = options.transitionIn || function(){},
        _onTransitionInComplete = options.transitionInComplete || function(){},
        _onTransitionOut = options.transitionOut || function(){},
        _onTransitionOutComplete = options.transitionOutComplete || function(){},
        _validStates = options.states || [],
        _enabled = false;

    this.element = element;

    this.setState = function( state ){
      if( ( !_validStates || _validStates.indexOf( state ) > -1 ) && !_enabled ){
        _enabled = true;
        _onTransitionIn();
        setTimeout( _onTransitionInComplete, TRANSITION_DURATION );
      }
      else if( _enabled ){
        _onTransitionOut();
        setTimeout( _onTransitionOutComplete, TRANSITION_DURATION );
        _enabled = false;
      }
    };
  }

  function UI( butter, options ){

    var _em = new EventManager( this ),
        _areas = {},
        _contentState = [],
        _state = true,
        _this = this;

    _areas.main = new Area( "butter-tray" );

    this.contentStateLocked = false;

    var _element = _areas.main.element,
        _toggler = new Toggler( butter, _element );

    _element.setAttribute( "data-butter-exclude", "true" );
    _element.className = "butter-tray";

    function createArea( id ){
      var area = {
        element: document.createElement( "div" ),
        items: {}
      };
      area.element.id = id;
      return area;
    }

    _areas.work = new Area( "work" );
    _areas.statusbar = new Area( "status-bar" );
    _areas.tools = new Area( "tools" );

    _element.appendChild( _areas.statusbar.element );
    _element.appendChild( _areas.work.element );
    _element.appendChild( _areas.tools.element );

    if( options.enabled !== false ){
      document.body.appendChild( _element );
    }

    this.registerStateToggleFunctions = function( state, events ){
      _em.listen( "contentstatechanged", function( e ){
        if( e.data.oldState === state ){
          events.transitionOut( e );
        }
        if( e.data.newState === state ){
          events.transitionIn( e );
        }
      });
    };

    this.pushContentState = function( state ){
      if( _this.contentStateLocked ){
        return;
      }
      var oldState = _this.contentState;
      _contentState.push( state );
      _element.setAttribute( "data-butter-content-state", _this.contentState );
      for( var a in _areas ){
        if( _areas.hasOwnProperty( a ) ){
          _areas[ a ].setContentState( state );
        }
      }
      _em.dispatch( "contentstatechanged", {
        oldState: oldState,
        newState: _this.contentState
      });
    };

    this.popContentState = function(){
      if( _this.contentStateLocked ){
        return;
      }
      var oldState = _contentState.pop(),
          newState = _this.contentState;
      _element.setAttribute( "data-butter-content-state", newState );
      for( var a in _areas ){
        if( _areas.hasOwnProperty( a ) ){
          _areas[ a ].setContentState( newState );
        }
      }
      _em.dispatch( "contentstatechanged", {
        oldState: oldState,
        newState: newState
      });
      return oldState;
    };

    this.setContentState = function( newState ){
      var oldState = _contentState.pop();
      _contentState = [ newState ];
      _element.setAttribute( "data-butter-content-state", newState );
      for( var a in _areas ){
        if( _areas.hasOwnProperty( a ) ){
          _areas[ a ].setContentState( newState );
        }
      }
      _em.dispatch( "contentstatechanged", {
        oldState: oldState,
        newState: newState
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

    this.TRANSITION_DURATION = TRANSITION_DURATION;

    butter.listen( "ready", function( e ){
      ContextButton( butter );
    });

   } //UI

   UI.__moduleName = "ui";

   return UI;

});
