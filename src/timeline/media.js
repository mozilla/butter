/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/trackevent", "core/track", "core/eventmanager",
          "./track-container", "util/scrollbars", "./timebar",
          "./zoombar", "./status", "./trackhandles",
          "util/lang", "text!layouts/media-instance.html" ],
  function( TrackEvent, Track, EventManagerWrapper,
            TrackContainer, Scrollbars, TimeBar,
            ZoomBar, Status, TrackHandles,
            LangUtils, MEDIA_INSTANCE_LAYOUT ) {

  var MIN_ZOOM = 300,
      DEFAULT_ZOOM = 0.5;

  function MediaInstance( butter, media ) {
    function onTrackOrderChanged( orderedTracks ) {
      _tracksContainer.orderTracks( orderedTracks );
    }

    function zoomCallback( zoomLevel ) {
      var nextZoom = MIN_ZOOM * zoomLevel + _zoomFactor;
      if ( nextZoom !== _zoom ) {
        _zoom = nextZoom;
        _tracksContainer.zoom = _zoom;
        updateUI();
      }
    }

    var _this = this,
        _media = media,
        _rootElement = LangUtils.domFragment( MEDIA_INSTANCE_LAYOUT ),
        _tracksContainer = new TrackContainer( butter, media, _rootElement ),
        _container = _rootElement.querySelector( ".media-container" ),
        _mediaStatusContainer = _rootElement.querySelector( ".media-status-container" ),
        _hScrollBar = new Scrollbars.Horizontal( _tracksContainer.element, _tracksContainer.container ),
        _vScrollBar = new Scrollbars.Vertical( _tracksContainer.element, _tracksContainer.container ),
        _shrunken = false,
        _timebar = new TimeBar( butter, _media, butter.ui.tray.statusArea, _tracksContainer, _hScrollBar ),
        _zoombar = new ZoomBar( zoomCallback, _rootElement ),
        _trackHandles = new TrackHandles( butter, _media, _rootElement, _tracksContainer, onTrackOrderChanged ),
        _trackEventHighlight = butter.config.value( "ui" ).trackEventHighlight || "click",
        _currentMouseDownTrackEvent,
        _zoomFactor,
        _zoom;

    Status( _media, butter.ui.tray.statusArea );

    _tracksContainer.setScrollbars( _hScrollBar, _vScrollBar );

    EventManagerWrapper( _this );

    function onEditorMinimized( e ) {
      _timebar.update( _zoom );
      _tracksContainer.update();
    }

    function snapToCurrentTime(){
      _tracksContainer.snapTo( _media.currentTime );
      _hScrollBar.update();
    }

    _media.listen( "mediaplaying", snapToCurrentTime );
    _media.listen( "mediapause", snapToCurrentTime );

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
          originalEvent = e.data.originalEvent;

      _currentMouseDownTrackEvent = trackEvent;

      trackEvent.selected = true;
      if( !originalEvent.shiftKey ){
        var tracks = _media.tracks;
        for( var t in tracks ){
          if( tracks.hasOwnProperty( t ) ){
            tracks[ t ].deselectEvents( trackEvent );
          }
        }
      }
    }

    function onMediaReady(){
      _zoomFactor = _container.clientWidth / _media.duration;
      _zoom = DEFAULT_ZOOM;
      _zoombar.zoom( _zoom );
      _tracksContainer.zoom = _zoom;
      updateUI();
      _this.dispatch( "ready" );
    }

    function onMediaReadyFirst(){
      _media.unlisten( "mediaready", onMediaReadyFirst );
      _media.listen( "mediaready", onMediaReady );

      _container.appendChild( _tracksContainer.element );
      _container.appendChild( _hScrollBar.element );
      _container.appendChild( _vScrollBar.element );
      _rootElement.appendChild( _trackHandles.element );
      _rootElement.appendChild( _zoombar.element );

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
        track.view.listen( "trackeventdropped", onTrackEventDropped );
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
        track.view.unlisten( "trackeventdropped", onTrackEventDropped );
        track.view.listen( "trackeventmousedown", onTrackEventMouseDown );
        if( _trackEventHighlight === "hover" ){
          track.view.listen( "trackeventmouseover", onTrackEventMouseOver );
          track.view.listen( "trackeventmouseout", onTrackEventMouseOut );
        }
      });

      onMediaReady();
    }

    _media.listen( "mediaready", onMediaReadyFirst );

    butter.editor.listen( "editorminimized", onEditorMinimized );

    function onPluginDropped( e ){

      var type = e.data.type,
          track = e.data.track,
          start = e.data.start,
          trackEvent;

      if( start + 1 > _media.duration ){
          start = _media.duration - 1;
      }

      var defaultTarget = butter.defaultTarget;
      if( !defaultTarget && butter.targets.length > 0 ){
        defaultTarget = butter.targets[ 0 ];
      }

      trackEvent = track.addTrackEvent({
        popcornOptions: {
          start: start,
          end: start + 1,
          target: defaultTarget.elementID
        },
        type: type
      });

      trackEvent.update();

      if( defaultTarget ){
        defaultTarget.view.blink();
      }

    }

    function onTrackEventDropped( e ){
      var search = _media.findTrackWithTrackEventId( e.data.trackEvent ),
          trackEvent = search.trackEvent,
          corn = trackEvent.popcornOptions;

      search.track.removeTrackEvent( trackEvent );

      var duration = corn.end- corn.start;
      corn.start = e.data.start;
      corn.end = corn.start + duration;

      e.data.track.addTrackEvent( trackEvent );
    }

    this.destroy = function() {
      if ( _rootElement.parentNode ) {
        _rootElement.parentNode.removeChild( _rootElement );
      }
      if( _mediaStatusContainer && _mediaStatusContainer.parentNode ){
        _mediaStatusContainer.parentNode.removeChild( _mediaStatusContainer );
      }
      _timebar.destroy();
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
        _timebar.update( _zoom );
        _hScrollBar.update();
        _vScrollBar.update();
        _zoombar.update();
        _trackHandles.update();
      }
    }

    butter.listen( "ready", function(){
      updateUI();
    });

    _tracksContainer.zoom = _zoom;

    Object.defineProperties( this, {
      zoom: {
        enumerable: true,
        get: function(){
          return _zoom;
        },
        set: function( val ){
          _zoom = val;
          updateUI();
        }
      },
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

