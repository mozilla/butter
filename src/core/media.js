/**********************************************************************************

Copyright (C) 2011 by Mozilla Foundation

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

(function() {
  define( [
            "core/logger", 
            "core/eventmanager", 
            "core/track",
            "core/popcorn"
          ], 
          function( Logger, EventManager, Track, PopcornWrapper ){

    var __guid = 0;

    var Media = function ( mediaOptions ) {
      mediaOptions = mediaOptions || {};

      var _tracks = [],
          _id = "Media" + __guid++,
          _logger = new Logger( _id ),
          _em = new EventManager( this ),
          _name = mediaOptions.name || _id,
          _url = mediaOptions.url,
          _target = mediaOptions.target,
          _registry,
          _currentTime = 0,
          _duration = 0,
          _popcornOptions = mediaOptions.popcornOptions,
          _mediaUpdateInterval,
          _popcorn = new PopcornWrapper( _id, {
            timeupdate: function(){
              _currentTime = _popcorn.currentTime;
              _em.dispatch( "mediatimeupdate", _this );
            },
            pause: function(){
              clearInterval( _mediaUpdateInterval );
              _em.dispatch( "mediapause" );
            },
            playing: function(){
              _mediaUpdateInterval = setInterval( function(){
                _currentTime = _popcorn.currentTime;
              }, 10 );
              _em.dispatch( "mediaplaying" );
            },
            timeout: function(){
            },
            prepare: function(){
              _this.duration = _popcorn.duration;
              _em.dispatch( "mediaready" );
            },
            fail: function(){
            },
            setup: {
              target: _target,
              url: _url
            }
          }),
          _this = this;

      function onTrackEventAdded( e ){
        var newTrack = e.target,
            trackEvent = e.data;
        _popcorn.updateEvent( trackEvent );
      } //onTrackEventAdded

      function onTrackEventUpdated( e ){
        var trackEvent = e.target;
        _popcorn.updateEvent( trackEvent );
      } //onTrackEventUpdated

      this.addTrack = function ( track ) {
        if ( !( track instanceof Track ) ) {
          track = new Track( track );
        } //if
        _tracks.push( track );
        _em.repeat( track, [
          "tracktargetchanged",
          "trackeventadded",
          "trackeventremoved",
          "trackeventupdated",
          "trackeventeditrequested"
        ]);
        track.popcorn = _popcorn;
        track.listen( "trackeventadded", onTrackEventAdded );
        track.listen( "trackeventupdated", onTrackEventUpdated );
        _em.dispatch( "trackadded", track );
        var trackEvents = track.trackEvents;
        if ( trackEvents.length > 0 ) {
          for ( var i=0, l=trackEvents.length; i<l; ++i ) {
            track.dispatch( "trackeventadded", trackEvents[ i ] );
          } //for
        } //if
        return track;
      }; //addTrack

      this.getTrack = function ( track ) {
        for ( var i=0, l=_tracks.length; i<l; ++i ) {
          if (  ( track.id !== undefined && _tracks[ i ].id === track.id ) ||
                ( track.name && _tracks[ i ].name === track.name ) ||
                _tracks[ i ] === track ) {
            return _tracks[ i ];
          } //if
        } //for
        return undefined;
      }; //getTrack

      this.removeTrack = function ( track ) {
        if ( typeof(track) === "string" ) {
          track = _this.getTrack( { name: track } );
        } //if
        var idx = _tracks.indexOf( track );
        if ( idx > -1 ) {
          _tracks.splice( idx, 1 );
          var events = track.trackEvents;
          for ( var i=0, l=events.length; i<l; ++i ) {
            _em.dispatch( "trackeventremoved", events[i] );
          } //for
          _em.unrepeat( track, [
            "tracktargetchanged",
            "trackeventadded",
            "trackeventremoved",
            "trackeventupdated",
            "trackeventeditrequested"
          ]);
          track.unlisten( "trackeventadded", onTrackEventAdded );
          track.unlisten( "trackeventupdated", onTrackEventUpdated );
          _em.dispatch( "trackremoved", track );
          return track;
        } //if
        return undefined;    
      }; //removeTrack

      this.getManifest = function( name ) {
        return _registry[ name ];
      }; //getManifest

      function setupContent(){
        if( _url && _target ){
          _popcorn.prepare( _url, _target );
        } //if
      } //setupContent

      this.pause = function(){
        _popcorn.pause();
      }; //pause

      this.play = function(){
        _popcorn.play();
      } //play

      Object.defineProperties( this, {
        url: {
          get: function() {
            return _url;
          },
          set: function( val ) {
            if ( _url !== val ) {
              _url = val;
              _popcorn.clear();
              setupContent();
              _em.dispatch( "mediacontentchanged", _this );
            }
          },
          enumerable: true
        },
        target: {
          get: function() {
            return _target;
          },
          set: function( val ) {
            if ( _target !== val ) {
              _target = val;
              _popcorn.clear();
              setupContent();
              _em.dispatch( "mediatargetchanged", _this );
            }
          },
          enumerable: true
        },
        name: {
          get: function() {
            return _name;
          },
          enumerable: true
        },
        id: {
          get: function() {
            return _id;
          },
          enumerable: true
        },
        tracks: {
          get: function() {
            return _tracks;
          },
          enumerable: true
        },
        currentTime: {
          get: function() {
            return _currentTime;
          },
          set: function( time ) {
            if ( time !== undefined ) {
              _currentTime = time;
              if ( _currentTime < 0 ) {
                _currentTime = 0;
              }
              if ( _currentTime > _duration ) {
                _currentTime = _duration;
              } //if
              _popcorn.currentTime = _currentTime;
              _em.dispatch( "mediatimeupdate", _this );
            } //if
          },
          enumerable: true
        },
        duration: {
          get: function() {
            return _duration;
          },
          set: function( time ) {
            if ( time ) {
              _duration = time;
              _logger.log( "duration changed to " + _duration );
              _em.dispatch( "mediadurationchanged", _this );
            }
          },
          enumerable: true
        },
        json: {
          get: function() {
            var exportJSONTracks = [];
            for ( var i=0, l=_tracks.length; i<l; ++i ) {
              exportJSONTracks.push( _tracks[ i ].json );
            }
            return {
              id: _id,
              name: _name,
              url: _url,
              target: _target,
              duration: _duration,
              tracks: exportJSONTracks
            };
          },
          set: function( importData ) {
            if ( importData.name ) {
              _name = importData.name;
            }
            if ( importData.target ) {
              _this.target = importData.target;
            }
            if ( importData.url ) {
              _this.url = importData.url;
            }
            if ( importData.tracks ) {
              var importTracks = importData.tracks;
              for ( var i=0, l=importTracks.length; i<l; ++i ) {
                var newTrack = new Track();
                newTrack.json = importTracks[ i ];
                _this.addTrack( newTrack );
              }
            }
          },
          enumerable: true
        },
        registry: {
          get: function() {
            return _registry;
          },
          set: function( val ) {
            _registry = val;
          },
          enumerable: true
        },
        popcorn: {
          enumerable: true,
          get: function(){
            return _popcorn;
          }
        },
        paused: {
          enumerable: true,
          get: function(){
            return _popcorn.paused;
          },
          set: function( val ){
            _popcorn.paused = val;
          }
        }
      });

      setupContent();

    }; //Media

    return Media;

  });
})();
