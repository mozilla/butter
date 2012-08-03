/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function() {
  define( [
            "core/logger",
            "core/eventmanager",
            "core/track",
            "core/popcorn-wrapper",
            "core/views/media-view"
          ],
          function( Logger, EventManagerWrapper, Track, PopcornWrapper, MediaView ){

    var MEDIA_ELEMENT_SAFETY_POLL_INTERVAL = 500,
        MEDIA_ELEMENT_SAFETY_POLL_ATTEMPTS = 10;

    var __guid = 0;

    var Media = function ( mediaOptions ) {
      mediaOptions = mediaOptions || {};

      EventManagerWrapper( this );

      var _tracks = [],
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
          _view,
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
              playing: function(){
                _mediaUpdateInterval = setInterval( function(){
                  _currentTime = _popcornWrapper.currentTime;
                }, 10 );
                _this.dispatch( "mediaplaying" );
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
                var te = _tracks[ i ].trackEvents;
                for( var j = 0, k = te.length; j < k; j++ ) {
                  // should call _popcornWrapper.updateEvent( te[ j ] ) circuitously
                  te[ j ].update();
                }
              }
              if( _view ){
                _view.update();
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
            constructing: function(){
              if( _view ){
                _view.update();
              }
            },
            timeout: function(){
              _this.dispatch( "mediatimeout" );
              _this.dispatch( "mediafailed", "timeout" );
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

      this.createView = function(){
        if ( !_view ) {
          _view = new MediaView( this, {
            onDropped: onDroppedOnView
          });
        }
      };

      this.destroy = function(){
        _popcornWrapper.unbind();
        if ( _view ) {
          _view.destroy();
        }
      };

      this.clear = function(){
        while( _tracks.length > 0 ){
          _this.removeTrack( _tracks[ 0 ] );
        }
      };

      function onDroppedOnView( e ){
        _this.dispatch( "trackeventrequested", e );
      }

      function onTrackEventAdded( e ){
        var trackEvent = e.data;
        _popcornWrapper.updateEvent( trackEvent );
        trackEvent._popcornWrapper = _popcornWrapper;
      } //onTrackEventAdded

      function onTrackEventRemoved( e ){
        var trackEvent = e.data;
        _popcornWrapper.destroyEvent( trackEvent );
        trackEvent._popcornWrapper = null;
      } //onTrackEventRemoved

      this.addTrack = function ( track ) {
        if ( !( track instanceof Track ) ) {
          track = new Track( track );
        } //if
        track.order = _tracks.length;
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
        track.listen( "trackeventadded", onTrackEventAdded );
        track.listen( "trackeventremoved", onTrackEventRemoved );
        _this.dispatch( "trackadded", track );
        track.setPopcornWrapper( _popcornWrapper );
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
            events[ i ].selected = false;
            track.dispatch( "trackeventremoved", events[ i ] );
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
          track.unlisten( "trackeventadded", onTrackEventAdded );
          track.unlisten( "trackeventremoved", onTrackEventRemoved );
          _this.dispatch( "trackremoved", track );
          track._media = null;
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
        if ( _url && _url.indexOf( "," ) > -1 ) {
          _url = _url.split( "," );
        }
        if ( _url && _target ){
          _popcornWrapper.prepare( _url, _target, _popcornOptions, _this.popcornCallbacks, _this.popcornScripts );
        }
        if ( _view ) {
          _view.update();
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
              _this.dispatch( "mediadurationchanged", _this );
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
            return _view;
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
