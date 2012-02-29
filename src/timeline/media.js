/**********************************************************************************

Copyright (C) 2012 by Mozilla Foundation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

**********************************************************************************/

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
      } else {
        trackEvent = newTrack.addTrackEvent({
          popcornOptions: {
            start: newStart,
            end: newStart + 1
          },
          type: type
        });
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

    function onTrackEventMouseDown( e ){
      var trackEvent = e.trackEvent,
          corn = trackEvent.popcornOptions,
          originalEvent = e.originalEvent;

      if( originalEvent.ctrlKey && corn.target ){
        if( corn.target !== "Media Element" ){
          var target = butter.getTargetByType( "elementID", corn.target )
          if( target ){
            target.view.blink();
          } //if
          return;
        }
        else {
          _media.view.blink();
        } //if
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
          mousedown: onTrackEventMouseDown
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

