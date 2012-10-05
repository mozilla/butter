/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/trackevent", "core/track", "core/eventmanager",
          "./track-container", "util/scrollbars", "./timebar",
          "./status", "./trackhandles", "./super-scrollbar",
          "util/lang", "text!layouts/media-instance.html" ],
  function( TrackEvent, Track, EventManager,
            TrackContainer, Scrollbars, TimeBar,
            Status, TrackHandles, SuperScrollbar,
            LangUtils, MEDIA_INSTANCE_LAYOUT ) {

  var DEFAULT_BOUNDS = [ 0, 0.5 ];

  function MediaInstance( butter, media ) {

    var _bounds = DEFAULT_BOUNDS;

    function setContainerBounds( left, right ) {
      if ( _bounds[0] !== left || _bounds[1] !== right ) {
        _bounds = [ left, right ];
        _tracksContainer.setViewportBounds( left, right );
        updateUI();
      }
    }

    var _this = this,
        _media = media,
        _rootElement = LangUtils.domFragment( MEDIA_INSTANCE_LAYOUT, ".media-instance" ),
        _tracksContainer = new TrackContainer( butter, media, _rootElement ),
        _container = _rootElement.querySelector( ".media-container" ),
        _mediaStatusContainer = _rootElement.querySelector( ".media-status-container" ),
        _superScrollbar = new SuperScrollbar( _tracksContainer.element, _tracksContainer.container, setContainerBounds, _media ),
        _vScrollBar = new Scrollbars.Vertical( _tracksContainer.element, _tracksContainer.container ),
        _shrunken = false,
        _timebar = new TimeBar( butter, _media, butter.ui.tray.statusArea, _tracksContainer ),
        _trackHandles = new TrackHandles( butter, _media, _rootElement, _tracksContainer ),
        _trackEventHighlight = butter.config.value( "ui" ).trackEventHighlight || "click",
        _currentMouseDownTrackEvent,
        _status;

    _status = new Status( _media, butter.ui.tray.statusArea );

    _tracksContainer.setVerticalScrollbar( _vScrollBar );

    EventManager.extend( _this );

    function onEditorMinimized( e ) {
      _timebar.update();
      _tracksContainer.update();
      _superScrollbar.resize();
    }

    window.addEventListener( "resize", function() {
      _vScrollBar.update();
      _timebar.update();
      _superScrollbar.resize();
    }, false );

    function onMediaTimeUpdate() {
      // Move the viewport to be centered around the scrubber
      _tracksContainer.followCurrentTime();
      // Align the timebar again to remove jitter
      // TODO: this is expensive, and only fixes 50% of the problem
      _timebar.update();
    }

    _media.listen( "mediaplaying", function(){
      // Make sure the viewport contains the scrubber
      _tracksContainer.snapTo( _media.currentTime );
      // Listen for timeupdate to attempt to center the viewport around the scrubber
      _media.listen( "mediatimeupdate", onMediaTimeUpdate );
    });

    _media.listen( "mediapause", function(){
      // Make sure the viewport contains the scrubber
      _tracksContainer.snapTo( _media.currentTime );
      // Stop listening for timeupdates so that the user can scroll around freely
      _media.unlisten( "mediatimeupdate", onMediaTimeUpdate );
    });

    function blinkTarget( target ){
      if( target !== _media.target ){
        target = butter.getTargetByType( "elementID", target );
        if( target ){
          target.view.blink();
        }
      }
      else {
        _media.view.blink();
      }
    }

    function onTrackEventMouseOver( e ){
      var trackEvent = e.trackEvent,
          corn = trackEvent.popcornOptions;

      if( corn.target ){
        blinkTarget( corn.target );
      }
    }

    function onTrackEventMouseOut( e ){
    }

    function onTrackEventMouseUp( e ){
      if( _currentMouseDownTrackEvent && _trackEventHighlight === "click" ){
        var corn = _currentMouseDownTrackEvent.popcornOptions;
        if( corn.target ){
          blinkTarget( corn.target );
        }
      }
    }

    function onTrackEventDragStarted( e ){
      _currentMouseDownTrackEvent = null;
    }

    function onTrackEventMouseDown( e ){
      var trackEvent = e.data.trackEvent,
          originalEvent = e.data.originalEvent,
          isHandle = originalEvent.target.classList.contains( "handle" );

      _currentMouseDownTrackEvent = trackEvent;

      if ( !isHandle ) {
        trackEvent.selected = true;
      }

      if( !originalEvent.shiftKey && !isHandle ){
        var tracks = _media.tracks;
        for( var t in tracks ){
          if( tracks.hasOwnProperty( t ) ){
            tracks[ t ].deselectEvents( trackEvent );
          }
        }
      }
    }

    function onMediaReady(){
      _bounds = DEFAULT_BOUNDS;
      _tracksContainer.setViewportBounds( _bounds[ 0 ], _bounds[ 1 ] );
      updateUI();
      _this.dispatch( "ready" );
    }

    function onMediaReadyFirst(){
      _media.unlisten( "mediaready", onMediaReadyFirst );
      _media.listen( "mediaready", onMediaReady );

      _container.appendChild( _tracksContainer.element );
      _rootElement.appendChild( _superScrollbar.element );
      _container.appendChild( _vScrollBar.element );
      _rootElement.appendChild( _trackHandles.element );

      butter.ui.tray.setMediaInstance( _rootElement );

      _media.listen( "trackeventremoved", function( e ){
        var trackEvent = e.data;
        trackEvent.view.unlisten( "trackeventdragstarted", onTrackEventDragStarted );
        trackEvent.view.unlisten( "trackeventmouseup", onTrackEventMouseUp );
        trackEvent.view.unlisten( "trackeventmousedown", onTrackEventMouseDown );
        if( _trackEventHighlight === "hover" ){
          trackEvent.view.unlisten( "trackeventmouseover", onTrackEventMouseOver );
          trackEvent.view.unlisten( "trackeventmouseout", onTrackEventMouseOut );
        }
      });

      function onTrackEventAdded( e ){
        var trackEvent = e.data;
        trackEvent.view.listen( "trackeventdragstarted", onTrackEventDragStarted );
        trackEvent.view.listen( "trackeventmouseup", onTrackEventMouseUp );
        trackEvent.view.listen( "trackeventmousedown", onTrackEventMouseDown );
        if( _trackEventHighlight === "hover" ){
          trackEvent.view.listen( "trackeventmouseover", onTrackEventMouseOver );
          trackEvent.view.listen( "trackeventmouseout", onTrackEventMouseOut );
        }
      }

      function onTrackAdded( e ){
        var track = e.data;
        track.view.listen( "plugindropped", onPluginDropped );
        track.view.listen( "trackeventmousedown", onTrackEventMouseDown );
        if( _trackEventHighlight === "hover" ){
          track.view.listen( "trackeventmouseover", onTrackEventMouseOver );
          track.view.listen( "trackeventmouseout", onTrackEventMouseOut );
        }

        var existingEvents = track.trackEvents;
        for( var i=0; i<existingEvents.length; ++i ){
          onTrackEventAdded({
            data: existingEvents[ i ]
          });
        }

      }

      var existingTracks = _media.tracks;
      for( var i=0; i<existingTracks.length; ++i ){
        onTrackAdded({
          data: existingTracks[ i ]
        });
      }

      _media.listen( "trackadded", onTrackAdded );
      _media.listen( "trackeventadded", onTrackEventAdded );

      _media.listen( "trackremoved", function( e ){
        var track = e.data;
        track.view.unlisten( "plugindropped", onPluginDropped );
        track.view.unlisten( "trackeventmousedown", onTrackEventMouseDown );
        if( _trackEventHighlight === "hover" ){
          track.view.unlisten( "trackeventmouseover", onTrackEventMouseOver );
          track.view.unlisten( "trackeventmouseout", onTrackEventMouseOut );
        }
      });

      onMediaReady();
    }

    _media.listen( "mediaready", onMediaReadyFirst );

    butter.editor.listen( "editorminimized", onEditorMinimized );

    function onPluginDropped( e ) {
      var type = e.data.type,
          track = e.data.track,
          start = e.data.start,
          trackEvent;

      trackEvent = butter.generateSafeTrackEvent( type, start, track );
      butter.editor.editTrackEvent( trackEvent );
    }

    this.destroy = function() {
      if ( _rootElement.parentNode ) {
        _rootElement.parentNode.removeChild( _rootElement );
      }
      if( _mediaStatusContainer && _mediaStatusContainer.parentNode ){
        _mediaStatusContainer.parentNode.removeChild( _mediaStatusContainer );
      }
      butter.editor.unlisten( "editorminimized", onEditorMinimized );
    };

    this.hide = function() {
      _rootElement.style.display = "none";
    };

    this.show = function() {
      _rootElement.style.display = "block";
    };

    function updateUI() {
      if( _media.duration ){
        _tracksContainer.update();
        _timebar.update();
        _vScrollBar.update();
        _superScrollbar.update();
        _trackHandles.update();
      }
    }

    butter.listen( "ready", function(){
      updateUI();
    });

    Object.defineProperties( this, {
      element: {
        enumerable: true,
        configurable: false,
        get: function(){
          return _rootElement;
        }
      },
      media: {
        enumerable: true,
        configurable: false,
        get: function(){
          return _media;
        }
      },
      shrunken: {
        enumerable: true,
        configurable: false,
        get: function(){
          return _shrunken;
        },
        set: function( val ){
          if( val !== _shrunken ){
            _shrunken = val;

          }
        }
      }
    });

  }

  return MediaInstance;

});

