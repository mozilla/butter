/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/eventmanager", "./toggler", "./logo-spinner", "./context-button", "./header" ],
        function( EventManagerWrapper, Toggler, LogoSpinner, ContextButton, Header ){

  var TRANSITION_DURATION = 500,
      BUTTER_CSS_FILE = "{css}/butter.ui.css";

  function Area( id, element ){
    var _element,
        _components = [],
        _this = this;

    EventManagerWrapper( _this );

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
    var _onTransitionIn = options.transitionIn || function(){},
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

  var __unwantedKeyPressElements = [
    "TEXTAREA",
    "INPUT",
    "VIDEO",
    "AUDIO"
  ];

  var NUDGE_INCREMENT_SMALL = 0.25,
      NUDGE_INCREMENT_LARGE = 1;

  function UI( butter, options ){

    var _areas = {},
        _contentState = [],
        _state = true,
        _logoSpinner,
        _this = this;

    EventManagerWrapper( _this );

    _areas.main = new Area( "butter-tray" );

    this.contentStateLocked = false;

    var _element = _areas.main.element,
        _toggler = new Toggler( butter, _element );

    _element.setAttribute( "data-butter-exclude", "true" );
    _element.className = "butter-tray";

    _areas.work = new Area( "work" );
    _areas.statusbar = new Area( "status-bar" );
    _areas.tools = new Area( "tools" );

    var logoContainer = document.createElement( "div" );
    logoContainer.id = "butter-loading-container";
    _logoSpinner = LogoSpinner( logoContainer );
    _element.appendChild( logoContainer );

    _element.appendChild( _areas.statusbar.element );
    _element.appendChild( _areas.work.element );
    _element.appendChild( _areas.tools.element );

    if( options.enabled !== false ){
      document.body.appendChild( _element );
      butter.listen( "mediaadded", function( e ){
        e.data.createView();
      });
    }

    this.load = function( onReady ){
      if( options.enabled !== false ){
        butter.loader.load([
          {
            type: "css",
            url: BUTTER_CSS_FILE
          }
        ], onReady );
      }
      else{
        onReady();
      }
    };

    this.registerStateToggleFunctions = function( state, events ){
      _this.listen( "contentstatechanged", function( e ){
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
      _this.dispatch( "contentstatechanged", {
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
      _this.dispatch( "contentstatechanged", {
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
      _this.dispatch( "contentstatechanged", {
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
              _this.dispatch( "uivisibilitychanged", true );
            }
            else {
              _element.setAttribute( "ui-state", "hidden" );
              _this.dispatch( "uivisibilitychanged", false );
            } //if
          } //if
        }
      }
    });

    var orderedTrackEvents = butter.orderedTrackEvents = [],
        sortTrackEvents = function( a, b ) {
          return a.popcornOptions.start > b .popcornOptions.start;
        };

    butter.listen( "trackeventadded", function( e ) {
      orderedTrackEvents.push( e.data );
      orderedTrackEvents.sort( sortTrackEvents );
    }); // listen

    butter.listen( "trackeventremoved", function( e ) {
      var index = orderedTrackEvents.indexOf( e.data );
      if( index > -1 ){
        orderedTrackEvents.splice( index, 1 );
      } // if
    }); // listen

    butter.listen( "trackeventupdated", function( e ) {
      orderedTrackEvents.sort( sortTrackEvents );
    }); // listen

    var orderedTracks = butter.orderedTracks = [],
        sortTracks = function( a, b ) {
          return a.order > b.order;
        };

    butter.listen( "trackadded", function( e ) {
      e.data.listen( "trackorderchanged", function( e ) {
        orderedTracks.sort( sortTracks );
      }); // listen
      orderedTracks.push( e.data );
      orderedTracks.sort( sortTracks );
    }); // listen

    butter.listen( "trackremoved", function( e ) {
      var index = orderedTracks.indexOf( e.data );
      if( index > -1 ){
        orderedTracks.splice( index, 1 );
      } // if
    }); // listen

    var processKey = {
      32: function( e ) { // space key
        if( butter.currentMedia.ended ){
          butter.currentMedia.paused = false;
        }
        else{
          butter.currentMedia.paused = !butter.currentMedia.paused;
        }
      }, // space key
      37: function( e ) { // left key
        var inc = e.shiftKey ? NUDGE_INCREMENT_LARGE : NUDGE_INCREMENT_SMALL;
        if( butter.selectedEvents.length ) {
          e.preventDefault();
          for( var i = 0, seLength = butter.selectedEvents.length; i < seLength; i++ ) {
            butter.selectedEvents[ i ].moveFrameLeft( inc, e.ctrlKey || e.metaKey );
          } // for
        } else {
          butter.currentTime -= inc;
        } // if
      }, // left key
      38: function( e ) { // up key
        var track,
            trackEvent,
            nextTrack;
        for( var i = 0, seLength = butter.selectedEvents.length; i < seLength; i++ ) {
          trackEvent = butter.selectedEvents[ i ];
          track = trackEvent.track;
          nextTrack = orderedTracks[ orderedTracks.indexOf( track ) - 1 ];
          if( nextTrack ) {
            track.removeTrackEvent( trackEvent );
            nextTrack.addTrackEvent( trackEvent );
          } // if
        } // for
      }, // up key
      39: function( e ) { // right key
        e.preventDefault();
        var inc = e.shiftKey ? NUDGE_INCREMENT_LARGE : NUDGE_INCREMENT_SMALL;
        if( butter.selectedEvents.length ) {
          for( var i = 0, seLength = butter.selectedEvents.length; i < seLength; i++ ) {
            butter.selectedEvents[ i ].moveFrameRight( inc, e.ctrlKey || e.metaKey );
          } // for
        } else {
          butter.currentTime += inc;
        } // if
      }, // right key
      40: function( e ) { // down key
        var track,
            trackEvent,
            nextTrack;
        for( var i = 0, seLength = butter.selectedEvents.length; i < seLength; i++ ) {
          trackEvent = butter.selectedEvents[ i ];
          track = trackEvent.track;
          nextTrack = orderedTracks[ orderedTracks.indexOf( track ) + 1 ];
          if( nextTrack ) {
            track.removeTrackEvent( trackEvent );
            nextTrack.addTrackEvent( trackEvent );
          } // if
        } // for
      }, // down key
      27: function( e ) { // esc key
        for( var i = 0; i < butter.selectedEvents.length; i++ ) {
          butter.selectedEvents[ i ].selected = false;
        } // for
        butter.selectedEvents = [];
      }, // esc key
      8: function( e ) { // del key
        if( butter.selectedEvents.length ) {
          e.preventDefault();
          for( var i = 0; i < butter.selectedEvents.length; i++ ) {
            butter.selectedEvents[ i ].track.removeTrackEvent( butter.selectedEvents[ i ] );
          } // for
          butter.selectedEvents = [];
        } // if
      }, // del key
      9: function( e ) { // tab key
        if( orderedTrackEvents.length && butter.selectedEvents.length <= 1 ){
          e.preventDefault();
          var index = 0,
              direction = e.shiftKey ? -1 : 1;
          if( orderedTrackEvents.indexOf( butter.selectedEvents[ 0 ] ) > -1 ){
            index = orderedTrackEvents.indexOf( butter.selectedEvents[ 0 ] );
            if( orderedTrackEvents[ index+direction ] ){
              index+=direction;
            } else if( !e.shiftKey ){
              index = 0;
            } else {
              index = orderedTrackEvents.length - 1;
            } // if
          } // if
          for( var i = 0; i < butter.selectedEvents.length; i++ ) {
            butter.selectedEvents[ i ].selected = false;
          } // for
          butter.selectedEvents = [];
          orderedTrackEvents[ index ].selected = true;
          butter.selectedEvents.push( orderedTrackEvents[ index ] );
        } // if
      } // tab key
    };

    window.addEventListener( "keydown", function( e ){
      var key = e.which || e.keyCode;
      // this allows backspace and del to do the same thing on windows and mac keyboards
      key = key === 46 ? 8 : key;
      if( processKey[ key ] && __unwantedKeyPressElements.indexOf( e.target.nodeName ) === -1 ){
        processKey[ key ]( e );
      } // if
    }, false );

    this.TRANSITION_DURATION = TRANSITION_DURATION;

    _toggler.visible = false;
    _this.visible = false;

    this.loadIndicator = {
      start: function(){
        _logoSpinner.start();
        logoContainer.style.display = "block";
      },
      stop: function(){
        _logoSpinner.stop(function(){
          logoContainer.style.display = "none";
        });
      }
    };

    _this.loadIndicator.start();

    butter.listen( "ready", function(){
      _this.loadIndicator.stop();
      _this.visible = true;
      _toggler.visible = true;
      ContextButton( butter );
      if( options.enabled !== false ){
        Header( butter, options );
      }
    });

    _this.dialogDir = butter.config.dirs.dialogs || "";

   } //UI

  UI.__moduleName = "ui";

  return UI;

});
