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
          "./track",
          "./scrollbars",
        ],
        function(
          $,
          $ui,
          TrackEvent, 
          Track, 
          EventManager,
          TrackLiner,
          TrackView,
          Scrollbars ){

  function MediaInstance( media ){
    var _this = this,
        _media = media,
        _em = new EventManager( this ),
        _root = document.createElement( "div" ),
        _container = document.createElement( "div" ),
        _tracksContainer = document.createElement( "div" ),
        _trackliner,
        _tracks = {},
        _initialized = false,
        _hScrollBar,
        _vScrollBar,
        _zoom = 1;

    _root.className = "butter-timeline-media";
    _root.id = "butter-timeline-media-" + media.id;
    _container.className = "butter-timeline-media-container";
    _tracksContainer.className = "butter-timeline-tracks";
    _tracksContainer.id = "butter-timeline-tracks-" + media.id;

    function onTrackEventRequested( e ){
      var newTrack = e.currentTarget,
          eventId = e.data.event,
          newStart = e.data.start,
          trackEvent;

      //try to remove the trackevent from all known tracks
      for( var tId in _tracks ){
        if( _tracks.hasOwnProperty( tId ) ){
          trackEvent = trackEvent || _tracks[ tId ].track.removeTrackEvent( eventId );
        } //if
      } //for

      var corn = trackEvent.popcornOptions,
          newEnd = corn.end - corn.start + newStart;

      //then, add it to the correct one
      if( trackEvent ){
        newTrack.track.addTrackEvent( trackEvent );
      } //if

      trackEvent.update( { start: newStart, end: newEnd } );
    } //onTrackEventRequested

    function addTrack( bTrack ){
      var track;
      track = _tracks[ bTrack.id ];
      if( !track ){
        track = new TrackView( _media, bTrack, _trackliner );
        _tracks[ bTrack.id ] = track;
        track.zoom = _zoom;
      } //if
      track.listen( "trackeventrequested", onTrackEventRequested );
    } //addTrack

    _media.listen( "mediaready", function(){
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
          _tracks[ bTrack.id ] = new TrackView( _media, bTrack, _trackliner, tlTrack );
          _media.addTrack( bTrack );
        } //if
      }); //trackadded

      _container.appendChild( _tracksContainer );
      _root.appendChild( _container );

      _hScrollBar = new Scrollbars.Horizontal( _container, _tracksContainer ),
      _hScrollBar = new Scrollbars.Vertical( _container, _tracksContainer ),

      _trackliner.zoom = _zoom;
      _trackliner.duration = _media.duration;
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

    Object.defineProperties( this, {
      zoom: {
        enumerable: true,
        get: function(){
          return _zoom;
        },
        set: function( val ){
          _zoom = val;
          if( _trackliner ){
            _trackliner.zoom = _zoom;
          }
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

    _this.zoom = 200;

  } //MediaInstance

  return MediaInstance;

});

