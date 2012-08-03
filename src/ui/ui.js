/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/eventmanager", "./toggler",
          "./header", "./unload-dialog",
          "./tray" ],
  function( EventManagerWrapper, Toggler,
            Header, UnloadDialog,
            Tray ){

  var TRANSITION_DURATION = 500,
      // Butter's UI is written in LESS, but deployed as CSS.
      // Depending on the config file, we'll use a pre-built
      // CSS file, or build CSS from LESS in the browser.
      BUTTER_CSS_FILE = "{css}/butter.ui.css",
      BUTTER_LESS_FILE = "{css}/butter.ui.less";

  var __unwantedKeyPressElements = [
    "TEXTAREA",
    "INPUT",
    "VIDEO",
    "AUDIO"
  ];

  var NUDGE_INCREMENT_SMALL = 0.25,
      NUDGE_INCREMENT_LARGE = 1;

  function UI( butter ){

    var _visibility = true,
        _uiConfig = butter.config,
        _uiOptions = _uiConfig.value( "ui" ),
        _this = this;

    EventManagerWrapper( _this );

    this.contentStateLocked = false;

    this.tray = new Tray();
    this.header = new Header( butter, _uiConfig );

    var _toggler = new Toggler( function ( e ) {
          butter.ui.visible = !butter.ui.visible;
          _toggler.state = !_toggler.state;
        }, "Show/Hide Timeline" );

    this.tray.rootElement.appendChild( _toggler.element );

    if ( _uiOptions.enabled ) {
      if ( _uiOptions.onLeaveDialog ) {
        UnloadDialog( butter );
      }
      document.body.classList.add( "butter-header-spacing" );
      document.body.classList.add( "butter-tray-spacing" );
      butter.listen( "mediaadded", function( e ){
        e.data.createView();
      });
    }

    this.loadIcons = function( icons, resourcesDir ) {
      var icon, img, div;

      for ( icon in icons ) {
        if ( icons.hasOwnProperty( icon ) ) {
          img = new Image();
          img.id = icon + "-icon";
          img.src = resourcesDir + icons[ icon ];

          // We can't use "display: none", since that makes it
          // invisible, and thus not load.  Opera also requires
          // the image be in the DOM before it will load.
          div = document.createElement( "div" );
          div.setAttribute( "data-butter-exclude", "true" );
          div.className = "butter-image-preload";

          div.appendChild( img );
          document.body.appendChild( div );
        }
      }
    };

    this.load = function( onReady ){
      if( _uiOptions.enabled ){
        var loadOptions = {};

        // Determine if we should load a pre-built CSS file for Butter (e.g.,
        // the deployment case, post `node make`), or whether we need to load
        // the LESS file directly and parse it into CSS (e.g., the dev case).
        if( _uiConfig.value( "cssRenderClientSide" ) ){
          loadOptions.type = "less";
          loadOptions.url = BUTTER_LESS_FILE;
        } else {
          loadOptions.type = "css";
          loadOptions.url = BUTTER_CSS_FILE;
        }

        butter.loader.load( [ loadOptions ], function(){
          // icon preloading needs css to be loaded first
          _this.loadIcons( _uiConfig.value( "icons" ), _uiConfig.value( "dirs" ).resources || "" );
          onReady();
        });
        
        _this.tray.attachToDOM();
      }
      else{
        onReady();
      }
    };

    Object.defineProperties( this, {
      enabled: {
        get: function() {
          return _uiOptions.enabled;
        }
      },
      visible: {
        enumerable: true,
        get: function(){
          return _visibility;
        },
        set: function( val ){
          if( _visibility !== val ){
            _visibility = val;
            if( _visibility ){
              document.body.classList.remove( "tray-minimized" );
              this.tray.rootElement.classList.remove( "minimized" );
              _this.dispatch( "uivisibilitychanged", true );
            }
            else {
              document.body.classList.add( "tray-minimized" );
              this.tray.rootElement.classList.add( "minimized" );
              _this.dispatch( "uivisibilitychanged", true );
            }
          }
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
        e.preventDefault();

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
            nextTrack,

            //copy this selectedEvents because it will change inside loop
            selectedEvents = butter.selectedEvents.slice();

        if ( selectedEvents.length ) {
          e.preventDefault();
        }

        for( var i = 0, seLength = selectedEvents.length; i < seLength; i++ ) {
          trackEvent = selectedEvents[ i ];
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
            nextTrack,

            //copy this selectedEvents because it will change inside loop
            selectedEvents = butter.selectedEvents.slice();

        if ( selectedEvents.length ) {
          e.preventDefault();
        }

        for( var i = 0, seLength = selectedEvents.length; i < seLength; i++ ) {
          trackEvent = selectedEvents[ i ];
          track = trackEvent.track;
          nextTrack = orderedTracks[ orderedTracks.indexOf( track ) + 1 ];
          if( nextTrack ) {
            track.removeTrackEvent( trackEvent );
            nextTrack.addTrackEvent( trackEvent );
          } // if
        } // for
      }, // down key
      27: function( e ) { // esc key
        butter.deselectAllTrackEvents();
      }, // esc key
      8: function( e ) { // del key
        if( butter.selectedEvents.length ) {
          e.preventDefault();
          for( var i = 0; i < butter.selectedEvents.length; i++ ) {
            butter.selectedEvents[ i ].track.removeTrackEvent( butter.selectedEvents[ i ] );
          } // for
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
          butter.deselectAllTrackEvents();
          orderedTrackEvents[ index ].selected = true;
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
        _this.tray.toggleLoadingSpinner( true );
      },
      stop: function(){
        _this.tray.toggleLoadingSpinner( false );
      }
    };

    _this.loadIndicator.start();

    butter.listen( "ready", function(){
      _this.loadIndicator.stop();
      _this.visible = true;
      _toggler.visible = true;
      if( _uiConfig.value( "ui" ).enabled !== false ){
        _this.header.attachToDOM();
      }
    });

    _this.dialogDir = butter.config.value( "dirs" ).dialogs || "";

  } //UI

  UI.__moduleName = "ui";

  return UI;

});
