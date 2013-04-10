/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

(function() {
  define( [
            "core/logger",
            "core/eventmanager",
            "core/track",
            "core/popcorn-wrapper",
            "util/uri",
            "util/mediatypes"
          ],
          function( Logger, EventManager, Track, PopcornWrapper, URI, MediaTypes ) {

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
          _duration = mediaOptions.duration || -1,
          _popcornOptions = mediaOptions.popcornOptions,
          _mediaUpdateInterval,
          _clipData = {},
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
            fail: function(){
              _this.dispatch( "mediafailed", "error" );
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
        for ( var i = _tracks.length - 1; i >= 0; i-- ) {
          _this.removeTrack( _tracks[ i ] );
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

        var idx = _orderedTracks.indexOf( otherTrack );

        if ( idx > -1 ) {
          // Give new track last order since it's newest
          newTrack.order = idx;

          // Insert new track
          _orderedTracks.splice( idx, 0, newTrack );

          setupNewTrack( newTrack );

          _this.dispatch( "trackadded", newTrack );

          // Sort tracks after added one to update their order.
          _this.sortTracks( idx + 1 );

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
            trackEvent,
            orderedIndex;
        if ( idx > -1 ) {
          _tracks.splice( idx, 1 );
          orderedIndex = _orderedTracks.indexOf( track );
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
          track._media = null;
          _orderedTracks.splice( orderedIndex, 1 );
          _this.dispatch( "trackremoved", track );
          _this.sortTracks( orderedIndex );
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

        return _popcornWrapper.generatePopcornString( popcornOptions, _url, _target, null, callbacks, scripts, collectedEvents );
      };

      function compareTrackOrder( a, b ) {
        return a.order - b.order;
      }

      this.sortTracks = function( startIndex, endIndex ) {
        var i = startIndex || 0,
            l = endIndex || _orderedTracks.length;

        for ( ; i <= l; ++i ) {
          if ( _orderedTracks[ i ] ) {
            _orderedTracks[ i ].order = i;
            _orderedTracks[ i ].updateTrackEvents();
          }
        }

        _orderedTracks.sort( compareTrackOrder );
        _this.dispatch( "trackorderchanged", _orderedTracks );
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

            // check if track event is out of bounds
            if ( end > _duration ) {
              if ( start > _duration ) {
                // remove offending track event
                trackEvent.track.removeTrackEvent( trackEvent );
              } else {
                trackEvent.update({
                  end: _duration
                });
              }
            }
          }
        }
      };

      this.hasTrackEvents = function() {
        for ( var i = 0, l = _tracks.length; i < l; ++i ) {
          if ( _tracks[ i ].trackEvents.length ) {
            return true;
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
        ready: {
          enumerable: true,
          get: function(){
            return _ready;
          }
        },
        clipData: {
          get: function() {
            return _clipData;
          },
          enumerable: true
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
              _duration = +time;
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
              popcornOptions: _popcornOptions,
              controls: _popcornWrapper.popcorn ? _popcornWrapper.popcorn.controls() : false,
              tracks: exportJSONTracks,
              clipData: _clipData
            };
          },
          set: function( importData ){
            var newTrack,
                url,
                i, l,
                fallbacks = [],
                sources = [];

            function doImportTracks() {
              if ( importData.tracks ) {
                var importTracks = importData.tracks;
                if( Array.isArray( importTracks ) ) {
                  for ( i = 0, l = importTracks.length; i < l; ++i ) {
                    newTrack = new Track();
                    newTrack.json = importTracks[ i ];
                    _this.addTrack( newTrack );
                    newTrack.updateTrackEvents();
                  }
                  // Backwards comp for old base media.
                  // Insert previous base media as a sequence event as the last track.
                  if ( importData.url && _duration >= 0 ) {
                    var firstSource;

                    // If sources is a single array and of type null player,
                    // don't bother making a sequence.
                    if ( url.length > 1 || MediaTypes.checkUrl( url[ 0 ] ) !== "null" ) {
                      // grab first source as main source.
                      sources.push( URI.makeUnique( url.shift() ).toString() );
                      for ( i = 0; i < url.length; i++ ) {
                        fallbacks.push( URI.makeUnique( url[ i ] ).toString() );
                      }

                      firstSource = sources[ 0 ];
                      MediaTypes.getMetaData( firstSource, function( data ) {

                        newTrack = new Track();
                        _this.addTrack( newTrack );
                        newTrack.addTrackEvent({
                          type: "sequencer",
                          popcornOptions: {
                            start: 0,
                            end: _duration,
                            source: sources,
                            title: data.title,
                            fallback: fallbacks,
                            duration: _duration,
                            target: "video-container"
                          }
                        });
                        _clipData[ firstSource ] = firstSource;
                      });
                    }
                  }
                } else if ( console ) {
                  console.warn( "Ignoring imported track data. Must be in an Array." );
                }
              }
            }

            if( importData.name ) {
              _name = importData.name;
            }
            if( importData.target ){
              _this.target = importData.target;
            }

            url = importData.url;
            if ( !Array.isArray( url ) ) {
              url = [ url ];
            }

            if ( importData.duration >= 0 ) {
              _duration = importData.duration;
              _this.url = "#t=," + _duration;
              doImportTracks();
            } else {
              MediaTypes.getMetaData( url[ 0 ], function success( data ) {
                _duration = data.duration;
                _this.url = "#t=," + _duration;
                doImportTracks();
              });
            }
            if ( importData.clipData ) {
              var tempClipData = importData.clipData,
                  source;

              // We have changed how we use the clip data by keying differently.
              // This is to prevent duplicate clips being added via the old way by keying them
              // our new way on import.
              for ( var key in tempClipData ) {
                if ( tempClipData.hasOwnProperty( key ) ) {
                  source = tempClipData[ key ];
                  if ( !_clipData[ source ] ) {
                    _clipData[ source ] = source;
                  }
                }
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
