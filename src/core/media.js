/*! This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

(function() {
  define( [
            "core/logger",
            "core/eventmanager",
            "core/track",
            "core/popcorn-wrapper",
            "util/uri"
          ],
          function( Logger, EventManager, Track, PopcornWrapper, URI ) {

    var MEDIA_ELEMENT_SAFETY_POLL_INTERVAL = 500,
        MEDIA_ELEMENT_SAFETY_POLL_ATTEMPTS = 10;

    var __guid = 0;

    var Media = function ( mediaOptions ) {
      mediaOptions = mediaOptions || {};

      EventManager.extend( this );

      var _tracks = [],
          _orderedTracks = [],
          _id = "Media" + __guid++,
          _logger = new Logger( _id ),
          _name = mediaOptions.name || _id,
          _url = mediaOptions.url,
          _ready = false,
          _target = mediaOptions.target,
          _registry,
          _currentTime = 0,
          _duration = -1,
          _popcornOptions = mediaOptions.popcornOptions,
          _mediaUpdateInterval,
          _this = this,
          _popcornWrapper = new PopcornWrapper( _id, {
            popcornEvents: {
              muted: function(){
                _this.dispatch( "mediamuted", _this );
              },
              unmuted: function(){
                _this.dispatch( "mediaunmuted", _this );
              },
              volumechange: function(){
                _this.dispatch( "mediavolumechange", _popcornWrapper.volume );
              },
              timeupdate: function(){
                _currentTime = _popcornWrapper.currentTime;
                _this.dispatch( "mediatimeupdate", _this );
              },
              pause: function(){
                clearInterval( _mediaUpdateInterval );
                _this.dispatch( "mediapause" );
              },
              play: function(){
                _mediaUpdateInterval = setInterval( function(){
                  _currentTime = _popcornWrapper.currentTime;
                }, 10 );
                _this.dispatch( "mediaplay" );
              },
              ended: function(){
                _this.dispatch( "mediaended" );
              },
              seeked: function(){
                _this.dispatch( "mediaseeked" );
              }
            },
            prepare: function(){
              _this.duration = _popcornWrapper.duration;
              _ready = true;
              for( var i = 0, l = _tracks.length; i < l; i++ ) {
                _tracks[ i ].updateTrackEvents();
              }

              // If the target element has a `data-butter-media-controls` property,
              // set the `controls` attribute on the corresponding media element.
              var targetElement = document.getElementById( _target );
              if (  targetElement &&
                    targetElement.getAttribute( "data-butter-media-controls" ) ) {
                _popcornWrapper.popcorn.controls( true );
              }

              _this.dispatch( "mediaready" );
            },
            timeout: function(){
              _this.dispatch( "mediatimeout" );
            },
            fail: function( e ){
              _this.dispatch( "mediafailed", "error" );
            },
            playerTypeRequired: function( type ){
              _this.dispatch( "mediaplayertyperequired", type );
            },
            setup: {
              target: _target,
              url: _url
            },
            makeVideoURLsUnique: mediaOptions.makeVideoURLsUnique
          });

      this.popcornCallbacks = null;
      this.popcornScripts = null;
      this.maxPluginZIndex = 0;

      this.destroy = function(){
        _popcornWrapper.unbind();
      };

      this.clear = function(){
        while( _tracks.length > 0 ){
          _this.removeTrack( _tracks[ 0 ] );
        }
      };

      function ensureNewTrackIsTrack( track ) {
        if ( !( track instanceof Track ) ) {
          track = new Track( track );
        }
        return track;
      }

      function setupNewTrack( track ) {
        track._media = _this;
        _tracks.push( track );
        _this.chain( track, [
          "tracktargetchanged",
          "trackeventadded",
          "trackeventremoved",
          "trackeventupdated",
          "trackeventselected",
          "trackeventdeselected"
        ]);
        track.setPopcornWrapper( _popcornWrapper );
      }

      function addNewTrackTrackEvents( track ) {
        var trackEvents = track.trackEvents;
        if ( trackEvents.length > 0 ) {
          for ( var i=0, l=trackEvents.length; i<l; ++i ) {
            track.dispatch( "trackeventadded", trackEvents[ i ] );
          }
        }
      }

      this.addTrack = function ( track ) {
        track = ensureNewTrackIsTrack( track );

        if ( track._media ) {
          throw "Track already belongs to a Media object. Use `media.removeTrack` prior to this function.";
        }

        // Sort tracks first, so we can guarantee their ordering
        _this.sortTracks( true );

        // Give new track last order since it's newest
        track.order = _tracks.length;

        setupNewTrack( track );

        // Simply add the track onto the ordered tracks array
        _orderedTracks.push( track );

        _this.dispatch( "trackadded", track );
        _this.dispatch( "trackorderchanged", _orderedTracks );

        addNewTrackTrackEvents( track );

        return track;
      };

      this.insertTrackBefore = function( otherTrack, newTrack ) {
        newTrack = ensureNewTrackIsTrack( newTrack );

        if ( newTrack._media ) {
          throw "Track already belongs to a Media object. Use `media.removeTrack` prior to this function.";
        }

        // Sort tracks first, so we can guarantee their ordering
        _this.sortTracks( true );

        var idx = _orderedTracks.indexOf( otherTrack );

        if ( idx > -1 ) {
          // Give new track last order since it's newest
          newTrack.order = _tracks.length;

          // Insert new track
          _orderedTracks.splice( idx, 0, newTrack );

          // Fix all the order properties on subsequent tracks
          for ( var i = idx, l = _orderedTracks.length; i < l; ++i ) {
            _orderedTracks[ i ].order = i;
          }

          setupNewTrack( newTrack );

          _this.dispatch( "trackadded", newTrack );
          _this.dispatch( "trackorderchanged", _orderedTracks );

          addNewTrackTrackEvents( newTrack );

          return newTrack;
        }
        else {
          throw "inserTrackBefore must be passed a valid relative track.";
        }
      };

      this.getTrackById = function( id ) {
        for ( var i = 0, l = _tracks.length; i < l; ++i ) {
          if ( _tracks[ i ].id === id ) {
            return _tracks[ i ];
          }
        }
      };

      this.removeTrack = function ( track ) {
        var idx = _tracks.indexOf( track ),
            trackEvent;
        if ( idx > -1 ) {
          _tracks.splice( idx, 1 );
          var events = track.trackEvents;
          for ( var i=0, l=events.length; i<l; ++i ) {
            trackEvent = events[ i ];
            trackEvent.selected = false;
            trackEvent.unbind();
            track.dispatch( "trackeventremoved", trackEvent );
          } //for
          _this.unchain( track, [
            "tracktargetchanged",
            "trackeventadded",
            "trackeventremoved",
            "trackeventupdated",
            "trackeventselected",
            "trackeventdeselected"
          ]);
          track.setPopcornWrapper( null );
          _this.sortTracks();
          track._media = null;
          _this.dispatch( "trackremoved", track );
          return track;
        } //if
      }; //removeTrack

      this.cleanUpEmptyTracks = function() {
        var oldTracks = _tracks.slice();
        for( var i = oldTracks.length - 1; i >= 0; --i ) {
          if ( oldTracks[ i ].trackEvents.length === 0 && _tracks.length > 1 ) {
            _this.removeTrack( oldTracks[ i ] );
          }
        }
      };

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
        // In the case of URL being a string, check that it doesn't follow our format for
        // Null Video (EG #t=,200). Without the check it incorrectly will splice on the comma.
        if ( _url && _url.indexOf( "#t" ) !== 0 && _url.indexOf( "," ) > -1 ) {
          _url = _url.split( "," );
        }
        if ( _url && _target ){
          _popcornWrapper.prepare( _url, _target, _popcornOptions, _this.popcornCallbacks, _this.popcornScripts );
        }
      }

      this.setupContent = setupContent;

      this.onReady = function( callback ){
        function onReady( e ){
          callback( e );
          _this.unlisten( "mediaready", onReady );
        }
        if( _ready ){
          callback();
        }
        else{
          _this.listen( "mediaready", onReady );
        }
      };

      this.pause = function(){
        _popcornWrapper.pause();
      }; //pause

      this.play = function(){
        _popcornWrapper.play();
      };

      this.generatePopcornString = function( callbacks, scripts ){
        var popcornOptions = _popcornOptions || {};

        callbacks = callbacks || _this.popcornCallbacks;
        scripts = scripts || _this.popcornScripts;

        var collectedEvents = [];
        for ( var i = 0, l = _tracks.length; i < l; ++i ) {
          collectedEvents = collectedEvents.concat( _tracks[ i ].trackEvents );
        }

        /* TODO: determine if we need to turn on frameAnimation or not before calling generatePopcornString
         * for now we default to off when exporting by setting frameAnimation to false. This should be handled in #1370.
         */
        popcornOptions.frameAnimation = false;
        return _popcornWrapper.generatePopcornString( popcornOptions, _url, _target, null, callbacks, scripts, collectedEvents );
      };

      function compareTrackOrder( a, b ) {
        return a.order - b.order;
      }

      this.sortTracks = function( suppressEvent ) {
        _orderedTracks = _tracks.slice();
        _orderedTracks.sort( compareTrackOrder );
        for ( var i = 0, l = _orderedTracks.length; i < l; ++i ) {
          _orderedTracks[ i ].order = i;
          _orderedTracks[ i ].updateTrackEvents();
        }
        if ( !suppressEvent ) {
          _this.dispatch( "trackorderchanged", _orderedTracks );
        }
      };

      this.getNextTrack = function( currentTrack ) {
        var trackIndex = _orderedTracks.indexOf( currentTrack );
        if ( trackIndex > -1 && trackIndex < _orderedTracks.length - 1 ) {
          return _orderedTracks[ trackIndex + 1 ];
        }
        return null;
      };

      this.getLastTrack = function( currentTrack ) {
        var trackIndex = _orderedTracks.indexOf( currentTrack );
        if ( trackIndex > 0 ) {
          return _orderedTracks[ trackIndex - 1 ];
        }
        return null;
      };

      this.findNextAvailableTrackFromTimes = function( start, end ) {
        for ( var i = 0, l = _orderedTracks.length; i < l; ++i ) {
          if ( !_orderedTracks[ i ].findOverlappingTrackEvent( start, end ) ) {
            return _orderedTracks[ i ];
          }
        }
        return null;
      };

      this.forceEmptyTrackSpaceAtTime = function( track, start, end, ignoreTrackEvent ) {
        var nextTrack;

        if ( track.findOverlappingTrackEvent( start, end, ignoreTrackEvent ) ) {
          nextTrack = _this.getNextTrack( track );
          if ( nextTrack ) {
            if ( nextTrack.findOverlappingTrackEvent( start, end, ignoreTrackEvent ) ) {
              return _this.insertTrackBefore( nextTrack );
            }
            else {
              return nextTrack;
            }
          }
          else {
            return this.addTrack();
          }
        }

        return track;
      };

      this.fixTrackEventBounds = function() {
        var i, j,
            tracks, tracksLength,
            trackEvents, trackEventsLength,
            trackEvent, trackEventOptions,
            start, end;

        tracks = _orderedTracks.slice();

        // loop through all tracks
        for ( i = 0, tracksLength = tracks.length; i < tracksLength; i++ ) {
          trackEvents = tracks[ i ].trackEvents.slice();

          // loop through all track events
          for ( j = 0, trackEventsLength = trackEvents.length; j < trackEventsLength; j++ ) {
            trackEvent = trackEvents[ j ];
            trackEventOptions = trackEvent.popcornOptions;
            start = trackEventOptions.start;
            end = trackEventOptions.end;

            // check if track event if out of bounds
            if ( end > _duration  ) {
              // remove offending track event
              trackEvent.track.removeTrackEvent( trackEvent );
            }
          }
        }
      };

      // Internally we decorate URLs with a unique butteruid, strip it when exporting
      function sanitizeUrl() {
        var sanitized;

        function sanitize( url ) {
          return URI.stripUnique( url ).toString();
        }

        // Deal with url being single or array of multiple
        if ( Array.isArray( _url ) ) {
          sanitized = [];
          _url.forEach( function( url ) {
            sanitized.push( sanitize( url ) );
          });
          return sanitized;
        }
        else {
          return sanitize( _url );
        }
      }

      Object.defineProperties( this, {
        ended: {
          enumerable: true,
          get: function(){
            if( _popcornWrapper.popcorn ){
              return _popcornWrapper.popcorn.ended();
            }
            return false;
          }
        },
        url: {
          enumerable: true,
          get: function() {
            return _url;
          },
          set: function( val ) {
            if ( _url !== val ) {
              _url = val;
              _ready = false;
              _popcornWrapper.clear( _target );
              setupContent();
              _this.dispatch( "mediacontentchanged", _this );
            }
          }
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
              _this.dispatch( "mediatargetchanged", _this );
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
        ready:{
          enumerable: true,
          get: function(){
            return _ready;
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
        orderedTracks: {
          get: function() {
            return _orderedTracks;
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
              _this.dispatch( "mediatimeupdate", _this );
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
              _this.fixTrackEventBounds();
              _this.dispatch( "mediadurationchanged", _this );
            }
          },
          enumerable: true
        },
        json: {
          get: function() {
            var exportJSONTracks = [];
            for ( var i = 0, l = _orderedTracks.length; i < l; ++i ) {
              exportJSONTracks.push( _orderedTracks[ i ].json );
            }
            return {
              id: _id,
              name: _name,
              url: sanitizeUrl(),
              target: _target,
              duration: _duration,
              controls: _popcornWrapper.popcorn ? _popcornWrapper.popcorn.controls() : false,
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
              if( Array.isArray( importTracks ) ) {
                for ( var i = 0, l = importTracks.length; i < l; ++i ) {
                  var newTrack = new Track();
                  newTrack.json = importTracks[ i ];
                  _this.addTrack( newTrack );
                  newTrack.updateTrackEvents();
                }
              } else if ( console ) {
                console.warn( "Ignoring imported track data. Must be in an Array." );
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
        popcornOptions: {
          enumerable: true,
          get: function(){
            return _popcornOptions;
          },
          set: function( val ){
            _popcornOptions = val;
            _this.dispatch( "mediapopcornsettingschanged", _this );
            setupContent();
          }
        }
      });

      // check to see if we have any child source elements and use them if neccessary
      function retrieveSrc( targetElement ) {
        var url = "";

        if ( targetElement.children ) {
          var children = targetElement.children;
          url = [];
          for ( var i = 0, il = children.length; i < il; i++ ) {
            if ( children[ i ].nodeName === "SOURCE" ) {
              url.push( children[ i ].src );
            }
          }
        }
        return !url.length ? targetElement.currentSrc : url;
      }

      // There is an edge-case where currentSrc isn't set yet, but everything else about the video is valid.
      // So, here, we wait for it to be set.
      var targetElement = document.getElementById( _target ),
          mediaSource = _url,
          attempts = 0,
          safetyInterval;

      if ( targetElement && [ "VIDEO", "AUDIO" ].indexOf( targetElement.nodeName ) > -1 ) {
        mediaSource = mediaSource || retrieveSrc( targetElement );
        if ( !mediaSource ) {
          safetyInterval = setInterval(function() {
            mediaSource = retrieveSrc( targetElement );
            if ( mediaSource ) {
              _url = mediaSource ;
              setupContent();
              clearInterval( safetyInterval );
            } else if ( attempts++ === MEDIA_ELEMENT_SAFETY_POLL_ATTEMPTS ) {
              clearInterval( safetyInterval );
            }
          }, MEDIA_ELEMENT_SAFETY_POLL_INTERVAL );
        // we already have a source, lets make sure we update it
        } else {
          _url = mediaSource;
        }
      }

    }; //Media

    return Media;

  });
}());
