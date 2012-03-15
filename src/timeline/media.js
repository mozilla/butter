/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [
          "external/jquery/jquery",
          "external/jquery-ui/jquery-ui.min",
          "core/trackevent",
          "core/track",
          "core/eventmanager",
          "./track-container",
          "./scrollbars",
          "./timebar",
          "./zoombar",
          "./status",
          "./trackhandles"
        ],
        function(
          $,
          $ui,
          TrackEvent, 
          Track, 
          EventManager,
          TrackContainer,
          Scrollbars,
          TimeBar,
          ZoomBar,
          Status,
          TrackHandles ){

  var INITIAL_ZOOM = 100,
      ZOOM_FACTOR = 100;

  function MediaInstance( butter, media ){
    var _this = this,
        _media = media,
        _em = new EventManager( this ),
        _tracksContainer = new TrackContainer( media ),
        _rootElement = document.createElement( "div" ),
        _container = document.createElement( "div" ),
        _trackliner,
        _tracks = {},
        _selectedTracks = [],
        _initialized = false,
        _hScrollBar,
        _vScrollBar,
        _shrunken = false,
        _timebar = new TimeBar( _media, _tracksContainer ),
        _zoombar = new ZoomBar(  zoomCallback ),
        _status = new Status( _media ),
        _trackHandles = new TrackHandles( _media, _tracksContainer, onTrackOrderChanged ),
        _trackEventHighlight = butter.config.ui.trackEventHighlight || "click",
        _zoom = INITIAL_ZOOM;

    _rootElement.className = "media-instance";
    _rootElement.id = "media-instance" + media.id;
    _container.className = "media-container";

    function onTrackOrderChanged( orderedTracks ){
      _tracksContainer.orderTracks( orderedTracks );
    } //onTrackOrderChanged

    function zoomCallback( zoomLevel ){
      var nextZoom = ( 1 + zoomLevel ) * ZOOM_FACTOR;
      if( nextZoom !== _zoom ){
        _zoom = nextZoom;
        _tracksContainer.zoom = _zoom;
        updateUI();
      } //if
    } //zoomCallback

    _media.listen( "trackeventselected", function( e ){
      _selectedTracks.push( e.target );
    });

    _media.listen( "trackeventdeselected", function( e ){
      _selectedTracks.splice( _selectedTracks.indexOf( e.target ), 1 );
    });

    function blinkTarget( target ){
      if( target !== "Media Element" ){
        var target = butter.getTargetByType( "elementID", target );
        if( target ){
          target.view.blink();
        } //if
      }
      else {
        _media.view.blink();
      } //if
    } //blinkTarget

    function onTrackEventMouseOver( e ){
      var trackEvent = e.trackEvent,
          corn = trackEvent.popcornOptions;

      if( corn.target ){
        blinkTarget( corn.target );
      } //if
    } //onTrackEventMouseOver

    function onTrackEventMouseOut( e ){
    } //onTrackEventMouseOut

    function onTrackEventMouseDown( e ){
      var trackEvent = e.data.trackEvent,
          corn = trackEvent.popcornOptions,
          originalEvent = e.data.originalEvent;

      if( _trackEventHighlight === "click" && corn.target ){
        blinkTarget( corn.target );
      } //if

      if( trackEvent.selected === true && originalEvent.shiftKey && _selectedTracks.length > 1 ){
        trackEvent.selected = false;
      }
      else {
        trackEvent.selected = true;
        if( !originalEvent.shiftKey ){
          var tracks = _media.tracks;
          for( var t in tracks ){
            if( tracks.hasOwnProperty( t ) ){
              tracks[ t ].deselectEvents( trackEvent );
            } //if
          } //for
          _selectedEvents = [ trackEvent ];
        }
        else {
          _selectedEvents.push( trackEvent );
        } //if
      } //if
    } //onTrackEventSelected

    _media.listen( "mediaready", function(){
      _zoombar.update( 0 );

      _tracksContainer.zoom = _zoom;

      var tracks = _media.tracks;
      _hScrollBar = new Scrollbars.Horizontal( _tracksContainer ),
      _vScrollBar = new Scrollbars.Vertical( _tracksContainer ),

      _container.appendChild( _tracksContainer.element );
      _container.appendChild( _hScrollBar.element );
      _container.appendChild( _vScrollBar.element );
      _container.appendChild( _timebar.element );
      _container.appendChild( _status.statusElement );
      _container.appendChild( _status.muteElement );
      _rootElement.appendChild( _trackHandles.element );
      _rootElement.appendChild( _zoombar.element );
      _rootElement.appendChild( _container );

      _media.listen( "trackeventadded", function( e ){
        var trackEvent = e.data;
        trackEvent.view.listen( "trackeventmousedown", onTrackEventMouseDown );
        if( _trackEventHighlight === "hover" ){
          trackEvent.view.listen( "trackeventmouseover", onTrackEventMouseOver );
          trackEvent.view.listen( "trackeventmouseout", onTrackEventMouseOut );
        } //if
      });

      _media.listen( "trackeventremoved", function( e ){
        var trackEvent = e.data;
        trackEvent.view.unlisten( "trackeventmousedown", onTrackEventMouseDown );
        if( _trackEventHighlight === "hover" ){
          trackEvent.view.unlisten( "trackeventmouseover", onTrackEventMouseOver );
          trackEvent.view.unlisten( "trackeventmouseout", onTrackEventMouseOut );
        } //if
      });

      _media.listen( "trackadded", function( e ){
        _vScrollBar.update();
        var track = e.data;
        track.view.listen( "plugindropped", onPluginDropped );
        track.view.listen( "trackeventdropped", onTrackEventDropped );
        track.view.listen( "trackeventmousedown", onTrackEventMouseDown );
        if( _trackEventHighlight === "hover" ){
          track.view.listen( "trackeventmouseover", onTrackEventMouseOver );
          track.view.listen( "trackeventmouseout", onTrackEventMouseOut );
        } //if
      });

      _media.listen( "trackremoved", function( e ){
        _vScrollBar.update();
        var track = e.data;
        track.view.unlisten( "plugindropped", onPluginDropped );
        track.view.unlisten( "trackeventdropped", onTrackEventDropped );
        track.view.listen( "trackeventmousedown", onTrackEventMouseDown );
        if( _trackEventHighlight === "hover" ){
          track.view.listen( "trackeventmouseover", onTrackEventMouseOver );
          track.view.listen( "trackeventmouseout", onTrackEventMouseOut );
        } //if
      });

      updateUI();
      _initialized = true;
      _em.dispatch( "ready" );

    }); //mediaready

    function onPluginDropped( e ){

      var type = e.data.type,
          track = e.data.track,
          start = e.data.start;

      if( start + 1 > _media.duration ){
          start = _media.duration - 1;
      } //if

      var defaultTarget = butter.defaultTarget;
      if( !defaultTarget && butter.targets.length > 0 ){
        defaultTarget = butter.targets[ 0 ];
      } //if

      var trackEvent = track.addTrackEvent({
        popcornOptions: {
          start: start,
          end: start + 1,
          target: defaultTarget.elementID
        },
        type: type
      });

      if( defaultTarget ){
        defaultTarget.view.blink();
      } //if

    } //onPluginDropped

    function onTrackEventDropped( e ){
      var search = _media.findTrackWithTrackEventId( e.data.trackEvent ),
          trackEvent = search.trackEvent,
          corn = trackEvent.popcornOptions;

      search.track.removeTrackEvent( trackEvent );

      var duration = corn.end- corn.start;
      corn.start = e.data.start;
      corn.end = corn.start + duration;

      trackEvent.update( corn );

      e.data.track.addTrackEvent( trackEvent );
    } //onTrackEventDropped


    this.destroy = function() {
      _rootElement.parentNode.removeChild( _rootElement );
      _timebar.destroy();
    }; //destroy

    this.hide = function() {
      _rootElement.style.display = "none";
    }; //hide

    this.show = function() {
      _rootElement.style.display = "block";
    }; //show

    function updateUI() {
      if( _media.duration ){
        _timebar.update( _zoom );
        _hScrollBar.update();
        _vScrollBar.update();
        _zoombar.update();
        _trackHandles.update();
      } //if
    } //updateUI

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
      initialized: {
        enumerable: true,
        configurable: false,
        get: function(){
          return _initialized;
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
            
          } //if
        }
      }
    });

  } //MediaInstance

  return MediaInstance;

});

