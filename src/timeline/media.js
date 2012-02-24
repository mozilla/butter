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
          "./zoombar"
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
          ZoomBar ){

  const ZOOM_FACTOR = 100;

  function MediaInstance( media ){
    var _this = this,
        _media = media,
        _em = new EventManager( this ),
        _root = document.createElement( "div" ),
        _container = document.createElement( "div" ),
        _tracksContainer = document.createElement( "div" ),
        _trackliner,
        _tracks = {},
        _selectedTracks = [],
        _initialized = false,
        _hScrollBar,
        _vScrollBar,
        _timebar = new TimeBar( _root, _media, _tracksContainer ),
        _zoombar = new ZoomBar( _root, zoomCallback ),
        _zoom = 1;

    _root.className = "butter-timeline-media";
    _root.id = "butter-timeline-media-" + media.id;
    _container.className = "butter-timeline-media-container";
    _tracksContainer.className = "butter-timeline-tracks";
    _tracksContainer.id = "butter-timeline-tracks-" + media.id;

    function zoomCallback( zoomLevel ){
      var nextZoom = ( 1 + zoomLevel ) * ZOOM_FACTOR;
      if( nextZoom !== _zoom ){
        _zoom = nextZoom;
        _trackliner.zoom = _zoom;
        updateUI();
      } //if
    } //zoomCallback

    function onTrackEventRequested( e ){
      var newTrack = e.currentTarget,
          eventId = e.data.event,
          newStart = Number( e.data.start ),
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
        newTrack.track.addTrackEvent( trackEvent );

        trackEvent.update( { start: newStart, end: newEnd } );
      } else {
        trackEvent = e.data.track.addTrackEvent({
          popcornOptions: {
            start: newStart,
            end: newStart + 1
          },
          type: e.data.type
        });
      }
    } //onTrackEventRequested

    function onTrackEventSelected( e ){
      var trackEvent = e.trackEvent,
          originalEvent = e.originalEvent;

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
    } //onTrackEventSelected

    function addTrack( bTrack ){
      var track;
      track = _tracks[ bTrack.id ];
      if( !track ){
        track = new TrackController( _media, bTrack, _trackliner, null, {
          select: onTrackEventSelected
        });
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

      _trackliner.listen( "trackadded", function( event ){
        var fromUI = event.data;
        if( fromUI ){
          var tlTrack = event.data.track;
          bTrack = new Track();
          _tracks[ bTrack.id ] = new TrackController( _media, bTrack, _trackliner, tlTrack, {
            select: onTrackEventSelected
          });
          _media.addTrack( bTrack );
        } //if
      }); //trackadded

      _container.appendChild( _tracksContainer );
      _root.appendChild( _container );

      _hScrollBar = new Scrollbars.Horizontal( _container, _tracksContainer ),
      _vScrollBar = new Scrollbars.Vertical( _container, _tracksContainer ),

      _trackliner.zoom = _zoom;
      _trackliner.duration = _media.duration;

      updateUI();

      _initialized = true;
      _em.dispatch( "ready" );

    }); //mediaready

    this.destroy = function() {
      _root.parentNode.removeChild( _root );
    }; //destroy

    this.hide = function() {
      _root.style.display = "none";
    }; //hide

    this.show = function() {
      _root.style.display = "block";
    }; //show

    function updateUI() {
      if( _trackliner ){
        _trackliner.zoom = _zoom;
        _timebar.update( _zoom );
        _hScrollBar.update();
        _vScrollBar.update();
        _zoombar.update();
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
          return _root;
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
      }
    });

  } //MediaInstance

  return MediaInstance;

});

