/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [
          "external/jquery/jquery",
          "external/jquery-ui/jquery-ui.min",
          "core/trackevent",
          "core/track",
          "core/eventmanager",
          "./trackliner/trackliner",
          "./track-controller",
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
          TrackLiner,
          TrackController,
          Scrollbars,
          TimeBar,
          ZoomBar,
          Status,
          TrackHandles ){

  var ZOOM_FACTOR = 100;

  function MediaInstance( butter, media ){
    var _this = this,
        _media = media,
        _em = new EventManager( this ),
        _rootElement = document.createElement( "div" ),
        _container = document.createElement( "div" ),
        _tracksContainer = document.createElement( "div" ),
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
        _trackHandles = new TrackHandles( _media, _tracksContainer ),
        _trackEventHighlight = butter.config.ui.trackEventHighlight || "click",
        _zoom = 1;

    _rootElement.className = "media-instance";
    _rootElement.id = "media-instance" + media.id;
    _container.className = "media-container";
    _tracksContainer.className = "tracks-container";
    _tracksContainer.id = "tracks-container-" + media.id;

    function zoomCallback( zoomLevel ){
      var nextZoom = ( 1 + zoomLevel ) * ZOOM_FACTOR;
      if( nextZoom !== _zoom ){
        _zoom = nextZoom;
        _trackliner.zoom = _zoom;
        updateUI();
      } //if
    } //zoomCallback

    function fabricateTrackEvent( newTrack, eventId, start, type ){
      var newStart = Number( start ),
          corn,
          newEnd,
          trackEvent;

      //try to remove the trackevent from all known tracks
      for( var tId in _tracks ){
        if( _tracks.hasOwnProperty( tId ) ){
          trackEvent = _tracks[ tId ].track.getTrackEventById( eventId );
          if( trackEvent ){
            _tracks[ tId ].track.removeTrackEvent( trackEvent );
            break;
          } //if
        } //if
      } //for

      if( trackEvent ) {
        corn = trackEvent.popcornOptions;

        //then, add it to the correct one
        newEnd = corn.end - corn.start + newStart;
        newTrack.addTrackEvent( trackEvent );

        trackEvent.update( { start: newStart, end: newEnd } );
      }
      else{

        var defaultTarget = butter.defaultTarget;
        if( !defaultTarget && butter.targets.length > 0 ){
          defaultTarget = butter.targets[ 0 ];
        } //if

        trackEvent = newTrack.addTrackEvent({
          popcornOptions: {
            start: newStart,
            end: newStart + 1,
            target: defaultTarget.elementID
          },
          type: type
        });

        if( defaultTarget ){
          defaultTarget.view.blink();
        } //if

      } //if

    } //fabricateTrackEvent

    function onTrackEventRequested( e ){
      fabricateTrackEvent( e.data.track, e.data.event, e.data.start, e.data.type );
    } //onTrackEventRequested

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
      var trackEvent = e.trackEvent,
          corn = trackEvent.popcornOptions,
          originalEvent = e.originalEvent;

      if( _trackEventHighlight === "click" && corn.target ){
        blinkTarget( corn.target );
      } //if

      if( trackEvent.selected === true && originalEvent.shiftKey && _selectedTracks.length > 1 ){
        trackEvent.selected = false;
      }
      else {
        trackEvent.selected = true;
        if( !originalEvent.shiftKey ){
          for( var t in _tracks ){
            if( _tracks.hasOwnProperty( t ) ){
              _tracks[ t ].deselectEvents( trackEvent );
            } //if
          } //for
          _selectedEvents = [ trackEvent ];
        }
        else {
          _selectedEvents.push( trackEvent );
        } //if
      } //if
    } //onTrackEventSelected

    function addTrack( bTrack ){
      var track;
      track = _tracks[ bTrack.id ];
      if( !track ){
        track = new TrackController( _media, bTrack, _trackliner, null, {
          mousedown: onTrackEventMouseDown,
          mouseover: _trackEventHighlight === "hover" ? onTrackEventMouseOver : undefined,
          mouseout: onTrackEventMouseOut === "hover" ? onTrackEventMouseOut: undefined
        });
        bTrack.order = Object.keys( _tracks ).length;
        _tracks[ bTrack.id ] = track;
        track.zoom = _zoom;
      } //if
      track.listen( "trackeventrequested", onTrackEventRequested );
    } //addTrack

    _media.listen( "mediaready", function(){
      _zoom = 100;
      _zoombar.update( 0 );

      var tracks = _media.tracks;

      _trackliner = new TrackLiner({
        element: _tracksContainer,
        dynamicTrackCreation: true,
        scale: 1,
        duration: _media.duration
      });

      for( var i = 0, tlength = tracks.length; i < tlength; i++ ){
        addTrack( tracks[ i ] );
      } //add Tracks

      _media.listen( "trackadded", function( e ){
        addTrack( e.data );
      });

      _media.listen( "trackremoved", function( event ){
        if( event.target !== "timeline" ){
          var bTrack = event.data;
          _tracks[ bTrack.id ].view.unlisten( "trackeventrequested", onTrackEventRequested );
          _tracks[ bTrack.id ].destroy();
          delete _tracks[ bTrack.id ];
        } //if
      });

      _trackliner.listen( "trackrequested", function( e ){
        var element = e.data.ui.draggable[ 0 ],
            left = element.offsetLeft,
            start,
            id = element.getAttribute( "butter-trackevent-id" ),
            trackRect = _trackliner.element.getBoundingClientRect(),
            left = id ? left : ( e.data.event.clientX - trackRect.left );

        start = left / trackRect.width * _media.duration;

        var type = element.id.split( "-" );
        if( type.length === 3 ){
          type = type[ 2 ];
        } //if

        var track = _media.addTrack();
        fabricateTrackEvent( track, id, start, type );
      }); //trackadded

      _hScrollBar = new Scrollbars.Horizontal( _tracksContainer ),
      _vScrollBar = new Scrollbars.Vertical( _tracksContainer ),

      _container.appendChild( _tracksContainer );
      _container.appendChild( _hScrollBar.element );
      _container.appendChild( _vScrollBar.element );
      _container.appendChild( _timebar.element );
      _container.appendChild( _status.statusElement );
      _container.appendChild( _status.muteElement );
      _rootElement.appendChild( _trackHandles.element );
      _rootElement.appendChild( _zoombar.element );
      _rootElement.appendChild( _container );

      _trackliner.zoom = _zoom;
      _trackliner.duration = _media.duration;

      updateUI();

      _initialized = true;
      _em.dispatch( "ready" );

    }); //mediaready

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
      if( _trackliner ){
        _trackliner.zoom = _zoom;
        _timebar.update( _zoom );
        _hScrollBar.update();
        _vScrollBar.update();
        _zoombar.update();
        _trackHandles.update();
      } //if
    } //updateUI

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

