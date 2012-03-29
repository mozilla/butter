/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/eventmanager", "./statusbar", "./toggler" ], function( EventManager, StatusBar, Toggler ){

  var __unwantedKeyPressElements = [
    "TEXTAREA",
    "INPUT"
  ];

  var NUDGE_INCREMENT_SMALL = 0.25,
      NUDGE_INCREMENT_LARGE = 1;

  function UI( butter, options ){

    var _element = document.createElement( "div" ),
        _statusBar = new StatusBar( butter, _element ),
        _toggler = new Toggler( butter, _element ),
        _em = new EventManager( this ),
        _state = true,
        _this = this;

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

    var orderedTrackEvents = butter.orderedTrackEvent = [],
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

    var processKey = {
      32: function( e ) { // space key
        butter.currentMedia.paused = !butter.currentMedia.paused;
      }, // space key
      37: function( e ) { // left key
        if( butter.selectedEvents.length ) {
          e.preventDefault();
          for( var i = 0, seLength = butter.selectedEvents.length; i < seLength; i++ ) {
            butter.selectedEvents[ i ].moveFrameLeft( e.shiftKey ? NUDGE_INCREMENT_LARGE : NUDGE_INCREMENT_SMALL, e.ctrlKey || e.metaKey );
          } // for
        } else {
          butter.currentTime -= e.shiftKey ? NUDGE_INCREMENT_LARGE : NUDGE_INCREMENT_SMALL;
        } // if
      }, // left key
      38: function( e ) { // up key
        var track,
            trackEvent,
            nextTrack;
        for( var i = 0, seLength = butter.selectedEvents.length; i < seLength; i++ ) {
          trackEvent = butter.selectedEvents[ i ];
          track = trackEvent.track;
          nextTrack = butter.tracks[ butter.tracks.indexOf( track ) - 1 ]
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
        for( var i = 0; i < butter.selectedEvents.length; i++ ) {
          trackEvent = butter.selectedEvents[ i ];
          track = trackEvent.track;
          nextTrack = butter.tracks[ butter.tracks.indexOf( track ) + 1 ]
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

  }; //UI

  UI.__moduleName = "ui";

  return UI;

});
