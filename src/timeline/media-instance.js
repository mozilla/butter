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
          "./trackliner",
          "./track",
        ],
        function(
          $,
          $ui,
          TrackEvent, 
          Track, 
          EventManager,
          TrackLiner,
          TrackMap ){

  function MediaInstance( media ){
    var _this = this,
        _media = media,
        _em = new EventManager( this ),
        _container = document.createElement( "div" ),
        _tracksContainer = document.createElement( "div" ),
        _trackliner,
        _tracks = {},
        _initialized = false,
        _zoom = 1;

    _container.className = "butter-timeline-media";
    _container.id = "butter-timeline-media-" + media.id;
    _tracksContainer.className = "butter-timeline-tracks";
    _tracksContainer.id = "butter-timeline-tracks-" + media.id;

    function addTrack( bTrack ){
      var track;
      track = _tracks[ bTrack.id ];
      if( !track ){
        track = new TrackMap( _media, bTrack, _trackliner );
        track.zoom = _zoom;
      } //if
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
          _tracks[ bTrack.id ].destroy();
          delete _tracks[ bTrack.id ];
        } //if
      });

      _trackliner.listen( "trackadded", function( event ){
        var fromUI = event.data;
        if( fromUI ){
          var tlTrack = event.data.track;
          bTrack = new Track();
          _tracks[ bTrack.id ] = new TrackMap( _media, bTrack, _trackliner, tlTrack );
          _media.addTrack( bTrack );
        } //if
      }); //trackadded

      _trackliner.listen( "trackremoved", function( event ){
        _media.removeTrack( event.data.track );
      }); //trackremoved

      _container.appendChild( _tracksContainer );
      _initialized = true;
      _em.dispatch( "ready" );

    }); //mediaready

    this.destroy = function() {
      _container.parentNode.removeChild( _container );
    }; //destroy

    this.hide = function() {
      _container.style.display = "none";
    }; //hide

    this.show = function() {
      _container.style.display = "block";
    }; //show

    Object.defineProperties( this, {
      zoom: {
        enumerable: true,
        get: function(){
          return _zoom;
        },
        set: function( val ){
          _zoom = val;
          for( var t in _tracks ){
            if( _tracks.hasOwnProperty( t ) ){
              _tracks[ t ].zoom = _zoom;
            } //if
          } //for
        }
      },
      element: {
        enumerable: true,
        configurable: false,
        get: function(){
          return _container;
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

    _this.zoom = 100;

  } //MediaInstance

  return MediaInstance;

});

