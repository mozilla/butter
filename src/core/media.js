/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function() {
  define( [
            "core/logger", 
            "core/eventmanager", 
            "core/track",
            "core/popcorn-wrapper",
            "ui/page-element"
          ], 
          function( Logger, EventManager, Track, PopcornWrapper, PageElement ){

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
          _pageElement,
          _registry,
          _currentTime = 0,
          _duration = 0,
          _popcornOptions = mediaOptions.popcornOptions,
          _mediaUpdateInterval,
          _view,
          _popcornWrapper = new PopcornWrapper( _id, {
            popcornEvents: {
              muted: function(){
                _em.dispatch( "mediamuted", _this );
              },
              unmuted: function(){
                _em.dispatch( "mediaunmuted", _this );
              },
              volumechange: function(){
                _em.dispatch( "mediavolumechange", _popcornWrapper.volume );
              },
              timeupdate: function(){
                _currentTime = _popcornWrapper.currentTime;
                _em.dispatch( "mediatimeupdate", _this );
              },
              pause: function(){
                clearInterval( _mediaUpdateInterval );
                _em.dispatch( "mediapause" );
              },
              playing: function(){
                _mediaUpdateInterval = setInterval( function(){
                  _currentTime = _popcornWrapper.currentTime;
                }, 10 );
                _em.dispatch( "mediaplaying" );
              },
              timeout: function(){
              }
            },
            prepare: function(){
              _this.duration = _popcornWrapper.duration;
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
        _popcornWrapper.updateEvent( trackEvent );
      } //onTrackEventAdded

      function onTrackEventUpdated( e ){
        var trackEvent = e.target;
        _popcornWrapper.updateEvent( trackEvent );
      } //onTrackEventUpdated

      function onTrackEventRemoved( e ){
        var trackEvent = e.data;
        _popcornWrapper.destroyEvent( trackEvent );
      } //onTrackEventRemoved

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
          "trackeventselected",
          "trackeventdeselected",
          "trackeventeditrequested"
        ]);
        track.popcorn = _popcornWrapper;
        track.listen( "trackeventadded", onTrackEventAdded );
        track.listen( "trackeventupdated", onTrackEventUpdated );
        track.listen( "trackeventremoved", onTrackEventRemoved );
        _em.dispatch( "trackadded", track );
        var trackEvents = track.trackEvents;
        if ( trackEvents.length > 0 ) {
          for ( var i=0, l=trackEvents.length; i<l; ++i ) {
            track.dispatch( "trackeventadded", trackEvents[ i ] );
          } //for
        } //if
        return track;
      }; //addTrack

      this.getTrackById = function( id ){
        for( var i=0, l=_tracks.length; i<l; ++i ){
          if( _tracks[ i ].id === id ){
            return _tracks[ i ];
          } //if
        } //for
      }; //getTrackById

      this.removeTrack = function ( track ) {
        var idx = _tracks.indexOf( track );
        if ( idx > -1 ) {
          _tracks.splice( idx, 1 );
          var events = track.trackEvents;
          for ( var i=0, l=events.length; i<l; ++i ) {
            track.dispatch( "trackeventremoved", events[ i ] );
          } //for
          _em.unrepeat( track, [
            "tracktargetchanged",
            "trackeventadded",
            "trackeventremoved",
            "trackeventupdated",
            "trackeventselected",
            "trackeventdeselected",
            "trackeventeditrequested"
          ]);
          track.unlisten( "trackeventadded", onTrackEventAdded );
          track.unlisten( "trackeventupdated", onTrackEventUpdated );
          track.unlisten( "trackeventremoved", onTrackEventRemoved );
          _em.dispatch( "trackremoved", track );
          return track;
        } //if
      }; //removeTrack

      this.findTrackWithTrackEventId = function( id ){
        for( var i=0, l=_tracks.length; i<l; ++i ){
          var te = _tracks[ i ].getTrackEventById( id );
          if( te ){
            return {
              track: _tracks[ i ],
              trackEvent: te
            };
          }
        } //for
      }; //findTrackWithTrackEventId

      this.getManifest = function( name ) {
        return _registry[ name ];
      }; //getManifest

      function setupContent(){
        if( _url && _target ){
          _popcornWrapper.prepare( _url, _target, _popcornOptions );
        } //if
        if( _pageElement ){
          _pageElement.destroy();
        } //if
        _pageElement = new PageElement( _target, {
          drop: function( event, ui ){
            if( event.currentTarget === _this ) {
              _em.dispatch( "trackeventrequested", {
                event: event,
                target: _this,
                ui: ui
              });
            }//if
          }
        },
        {
          highlightClass: "butter-media-highlight"
        });
      } //setupContent

      this.pause = function(){
        _popcornWrapper.pause();
      }; //pause

      this.play = function(){
        _popcornWrapper.play();
      } //play

      Object.defineProperties( this, {
        view: {
          enumerable: true,
          get: function(){
            return _view;
          }
        },
        url: {
          get: function() {
            return _url;
          },
          set: function( val ) {
            if ( _url !== val ) {
              _url = val;
              _popcornWrapper.clear( _target );
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
              _popcornWrapper.clear( _target );
              _target = val;
              setupContent();
              _em.dispatch( "mediatargetchanged", _this );
            }
          },
          enumerable: true
        },
        muted: {
          enumerable: true,
          get: function(){
            return _popcornWrapper.muted;
          },
          set: function( val ){
            _popcornWrapper.muted = val;
          }
        },
        name: {
          get: function(){
            return _name;
          },
          enumerable: true
        },
        id: {
          get: function(){
            return _id;
          },
          enumerable: true
        },
        tracks: {
          get: function(){
            return _tracks;
          },
          enumerable: true
        },
        currentTime: {
          get: function(){
            return _currentTime;
          },
          set: function( time ){
            if( time !== undefined ){
              _currentTime = time;
              if( _currentTime < 0 ){
                _currentTime = 0;
              }
              if( _currentTime > _duration ){
                _currentTime = _duration;
              } //if
              _popcornWrapper.currentTime = _currentTime;
              _em.dispatch( "mediatimeupdate", _this );
            } //if
          },
          enumerable: true
        },
        duration: {
          get: function(){
            return _duration;
          },
          set: function( time ){
            if( time ){
              _duration = time;
              _logger.log( "duration changed to " + _duration );
              _em.dispatch( "mediadurationchanged", _this );
            }
          },
          enumerable: true
        },
        json: {
          get: function(){
            var exportJSONTracks = [];
            for( var i=0, l=_tracks.length; i<l; ++i ){
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
          set: function( importData ){
            if( importData.name ) {
              _name = importData.name;
            }
            if( importData.target ){
              _this.target = importData.target;
            }
            if( importData.url ){
              _this.url = importData.url;
            }
            if( importData.tracks ){
              var importTracks = importData.tracks;
              for( var i=0, l=importTracks.length; i<l; ++i ){
                var newTrack = new Track();
                newTrack.json = importTracks[ i ];
                _this.addTrack( newTrack );
              }
            }
          },
          enumerable: true
        },
        registry: {
          get: function(){
            return _registry;
          },
          set: function( val ){
            _registry = val;
          },
          enumerable: true
        },
        popcorn: {
          enumerable: true,
          get: function(){
            return _popcornWrapper;
          }
        },
        paused: {
          enumerable: true,
          get: function(){
            return _popcornWrapper.paused;
          },
          set: function( val ){
            _popcornWrapper.paused = val;
          }
        },
        volume: {
          enumerable: true,
          get: function(){
            return _popcornWrapper.volume;
          },
          set: function( val ){
            _popcornWrapper.volume = val;
          }
        },
        view: {
          enumerable: true,
          get: function(){
            return _pageElement;
          }
        },
        popcornString: {
          enumerable: true,
          get: function(){
            return _popcornWrapper.generatePopcornString( _popcornOptions, _url, _target );
          }
        }
      });

      setupContent();

    }; //Media

    return Media;

  });
})();
