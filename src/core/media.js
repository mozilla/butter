/*! This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

/**
 * Document: Media
 *
 * Provides Media functionality to Butter.
 *
 * @structure Module
 * @api public
 */
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

  /**
   * Document: Media::Media
   *
   * Supplies access to Popcorn and the Butter Tracks and TrackEvents
   * that comprise a Popcorn experience for one media element (one set of urls).
   *
   * @param {Dictionary} mediaOptions Initialization options, such as name, url, and target.
   * @structure Class
   * @api public
   */
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

    /**
     * Document: Media::Media::destroy
     *
     * Disengages this Media object from use by severing link to Popcorn.
     * 
     * @structure Member Function
     * @api public
     */
    this.destroy = function(){
      _popcornWrapper.unbind();
    };

    /**
     * Document: Media::Media::clear
     *
     * Removes all tracks from this Media object.
     * 
     * @structure Member Function
     * @api public
     */
    this.clear = function(){
      while( _tracks.length > 0 ){
        _this.removeTrack( _tracks[ 0 ] );
      }
    };

    /**
     * Document: Media::Media::ensureNewTrackIsTrack
     *
     * Ensures that the provided object is a Track object. If it isn't,
     * a new Track object is created and returned. Otherwise, the original
     * object is returned.
     *
     * @param {Track|Object} track Track object to inspect.
     * @structure Member Function
     * @return {Track} A Track object
     * @api private
     */
    function ensureNewTrackIsTrack( track ) {
      if ( !( track instanceof Track ) ) {
        track = new Track( track );
      }
      return track;
    }

    /**
     * Document: Media::Media::setupNewTrack
     *
     * Prepares a Track for use with this Media by setting up chain listeners,
     * storing a reference to the Track, and providing access to a Popcorn wrapper.
     * 
     * @param {Track} track Track object to setup.
     * @structure Member Function
     * @api private
     */
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

    /**
     * Document: Media::Media::addNewTrackTrackEvents
     *
     * Loops through TrackEvents on a each Track, dispatching a `trackeventadded` event. This functionality
     * is used to notify other objects when a Track gets re-inserted or re-added to a Media object, since there
     * may be TrackEvents on a Track before it is added.
     *
     * @param {Track} track Track object from which TrackEvents are read.
     * @structure Member Function
     * @dispatch trackeventadded
     * @api private
     */
    function addNewTrackTrackEvents( track ) {
      var trackEvents = track.trackEvents;
      if ( trackEvents.length > 0 ) {
        for ( var i=0, l=trackEvents.length; i<l; ++i ) {
          track.dispatch( "trackeventadded", trackEvents[ i ] );
        }
      }
    }

    /**
     * Document: Media::Media::addTrack
     *
     * Adds a Track object to this Media object _in order_.
     *
     * @param {Track|Object} track Track to be added. If _track_ is an basic object, it will be converted to a Track.
     * @structure Member Function
     * @dispatch trackadded, trackorderchanged
     * @api public
     */
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

    /**
     * Document: Media::Media::insertTrackBefore
     *
     * Inserts a Track object before another Track object already attached to this Media object.
     * Order is preserved.
     *
     * @param {Track} otherTrack Reference Track in front of which the new track will be added.
     * @param {Track|Object} newTrack Track to be added. If _track_ is an basic object, it will be converted to a Track.
     * @structure Member Function
     * @dispatch trackadded, trackorderchanged
     * @api public
     */
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

    /**
     * Document: Media::Media::getTrackById
     *
     * Loops over all Tracks and returns the first (if any) that has an id equal to that which is provided.
     * 
     * @param {String} id Id of Track to find.
     * @structure Member Function
     * @api public
     */
    this.getTrackById = function( id ) {
      for ( var i = 0, l = _tracks.length; i < l; ++i ) {
        if ( _tracks[ i ].id === id ) {
          return _tracks[ i ];
        }
      }
    };

    /**
     * Document: Media::Media::removeTrack
     *
     * Removes a Track from this Media object. 
     *
     * @param {Track} track Track to remove.
     * @structure Member Function
     * @dispatch trackremoved, trackeventremoved
     * @api public
     */
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
        }
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
      }
    };

    /**
     * Document: Media::Media::cleanUpEmptyTracks
     *
     * Removes Tracks which contain no TrackEvents.
     *
     * @structure Member Function
     * @api public
     */
    this.cleanUpEmptyTracks = function() {
      var oldTracks = _tracks.slice();
      for( var i = oldTracks.length - 1; i >= 0; --i ) {
        if ( oldTracks[ i ].trackEvents.length === 0 && _tracks.length > 1 ) {
          _this.removeTrack( oldTracks[ i ] );
        }
      }
    };

    /**
     * Document: Media::Media::findTrackWithTrackEventId
     *
     * Checks each Track for the existence of a TrackEvent with a specific id.
     *
     * @param {String} id Id of TrackEvent to look for.
     * @structure Member Function
     * @api public
     */
    this.findTrackWithTrackEventId = function( id ){
      for( var i=0, l=_tracks.length; i<l; ++i ){
        var te = _tracks[ i ].getTrackEventById( id );
        if( te ){
          return {
            track: _tracks[ i ],
            trackEvent: te
          };
        }
      }
    };

    /**
     * Document: Media::Media::getManifest
     *
     * Returns the Popcorn manifest for the specified plugin type.
     *
     * @param {String} type Type of Popcorn plugin; e.g. text, footnote, googlemap
     * @structure Member Function
     * @api public
     */
    this.getManifest = function( type ) {
      return _registry[ type ];
    };

    /**
     * Document: Media::Media::setupContent
     *
     * Begins the process of initializing Popcorn with the URL given to this Media object.
     *
     * @structure Member Function
     * @api public
     */
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

    /**
     * Document: Media::Media::onReady
     *
     * Calls the provided callback function when this Media object is ready to use. If this Media is not immediately ready,
     * the callback will be called after the _mediaready_ event is fired.
     *
     * @param {Function} callback Callback to execute when ready.
     * @structure Member Function
     * @api public
     */
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

    /**
     * Document: Media::Media::pause
     *
     * Pauses the attached media; proxied through Popcorn using PopcornWrapper.
     *
     * @param {Function} callback Callback to execute when ready.
     * @structure Member Function
     * @api public
     */
    this.pause = function(){
      _popcornWrapper.pause();
    };

    /**
     * Document: Media::Media::play
     *
     * Plays the attached media; proxied through Popcorn using PopcornWrapper.
     *
     * @param {Function} callback Callback to execute when ready.
     * @structure Member Function
     * @api public
     */
    this.play = function(){
      _popcornWrapper.play();
    };

    /**
     * Document: Media::Media::generatePopcornString
     *
     * Uses the current state of this Media object to generate a string representing the complete setup of
     * a Popcorn environment containing all the TrackEvent contents attached to Tracks on this Media object.
     *
     * @param {Dictionary} callbacks Named callbacks to run for different stages of string generation (see PopcornWrapper).
     * @param {Dictionary} scripts Named scripts to insert at different stages of string generation (see PopcornWrapper).
     * @structure Member Function
     * @return {String} A string representing a complete Popcorn environment mirroring the functionality of this Media object.
     * @api public
     */
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

    /**
     * Document: Media::Media::compareTrackOrder
     *
     * Helper function for sorting Tracks by their order.
     *
     * @param {Track} a A Track to compare with another.
     * @param {Track} b A Track to compare with another.
     * @structure Member Function
     * @api public
     */
    function compareTrackOrder( a, b ) {
      return a.order - b.order;
    }

    /**
     * Document: Media::Media::sortTracks
     *
     * Sorts attached Tracks based on their order property using `compareTrackOrder`.
     *
     * @param {Boolean} suppressEvent If `true`, _trackorderchanged_ event is not dispatched.
     * @structure Member Function
     * @dispatch trackorderchanged
     * @api public
     */
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

    /**
     * Document: Media::Media::getNextTrack
     *
     * Returns the next Track object with respect to Track order. If the specified Track is the last
     * Track, _null_ is returned.
     *
     * @param {Track} currentTrack Reference Track. The Track after _currentTrack_ will be returned.
     * @structure Member Function
     * @return {Track|null} The next Track.
     * @api public
     */
    this.getNextTrack = function( currentTrack ) {
      var trackIndex = _orderedTracks.indexOf( currentTrack );
      if ( trackIndex > -1 && trackIndex < _orderedTracks.length - 1 ) {
        return _orderedTracks[ trackIndex + 1 ];
      }
      return null;
    };

    /**
     * Document: Media::Media::getLastTrack
     *
     * Returns the previous Track object with respect to Track order. If the specified Track is the
     * first Track, _null_ is returned.
     *
     * @param {Track} currentTrack Reference Track. The Track before _currentTrack_ will be returned.
     * @structure Member Function
     * @return {Track|null} The next Track.
     * @api public
     */
    this.getLastTrack = function( currentTrack ) {
      var trackIndex = _orderedTracks.indexOf( currentTrack );
      if ( trackIndex > 0 ) {
        return _orderedTracks[ trackIndex - 1 ];
      }
      return null;
    };

    /**
     * Document: Media::Media::findNextAvailableTrackFromTimes
     *
     * Returns a Track with an available space between the specified start and end times. If no such
     * Track exists, _null_ is returned.
     *
     * @param {Number} start Low bound of time window to search for.
     * @param {Number} end High bound of time window to search for.
     * @structure Member Function
     * @return {Track|null} A Track with space available between the specified times.
     * @api public
     */
    this.findNextAvailableTrackFromTimes = function( start, end ) {
      for ( var i = 0, l = _orderedTracks.length; i < l; ++i ) {
        if ( !_orderedTracks[ i ].findOverlappingTrackEvent( start, end ) ) {
          return _orderedTracks[ i ];
        }
      }
      return null;
    };

    /**
     * Document: Media::Media::forceEmptyTrackSpaceAtTime
     *
     * Searches for a space on the specified Track between the given times. If the Track does not
     * have space available, a new Track is added after the specified Track.
     *
     * @param {Track} track Reference Track used to conduct an initial search. A new Tracks is added after this one when necessary.
     * @param {Number} start Low bound of time window to search for.
     * @param {Number} end High bound of time window to search for.
     * @param {TrackEvent} ignoreTrackEvent Optional. When specified, this TrackEvent is ignored during a search.
     * @structure Member Function
     * @return {Track} A Track with available space between the specified times.
     * @api public
     */
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

    /**
     * Document: Media::Media::fixTrackEventBounds
     *
     * Checks TrackEvents on Tracks to ensure that they have valid start and end times, 0 -> duration.
     * If a TrackEvent is found to have an invalid start or end time, it is removed.
     *
     * @structure Member Function
     * @api public
     */
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

    /**
     * Document: Media::Media::sanitizeUrl
     *
     * Internally, URLs are decorated with a unique butteruid. This function strips it. Useful for exporting.
     *
     * @structure Member Function
     * @return {String} Sanitized url.
     * @api public
     */
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
      /**
       * Document: Media::Media::ended
       *
       * Safely wraps Popcorn's `ended()` getter function, reporting the "ended" state for this Media object.
       *
       * @structure Property
       * @return {Boolean} If Popcorn is not initialized, or the media it wraps has not ended, `false` is returned. Otherwise, true.
       * @access read-only
       */
      ended: {
        enumerable: true,
        get: function(){
          if( _popcornWrapper.popcorn ){
            return _popcornWrapper.popcorn.ended();
          }
          return false;
        }
      },

      /**
       * Document: Media::Media::url
       *
       * Url used to initialize Popcorn. Whenever this property changes, Popcorn is re-initialized.
       *
       * @structure Property
       * @dispatch mediacontentchanged
       * @return {String} String containing comma-delimited urls to be passed to Popcorn for initialization.
       * @access read-write
       */
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

      /**
       * Document: Media::Media::target
       *
       * Target for Popcorn media. Whenever this property changes, Popcorn is re-initialized.
       *
       * @structure Property
       * @dispatch mediatargetchanged
       * @return {String} Id of the element Popcorn will use for its media source.
       * @access read-write
       */
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

      /**
       * Document: Media::Media::muted
       *
       * Mute state of this Media object.
       *
       * @structure Property
       * @return {Boolean} True if muted, false otherwise.
       * @access read-write
       */
      muted: {
        enumerable: true,
        get: function(){
          return _popcornWrapper.muted;
        },
        set: function( val ){
          _popcornWrapper.muted = val;
        }
      },

      /**
       * Document: Media::Media::ready
       *
       * Ready state of this Media object.
       *
       * @structure Property
       * @return {Boolean} True if media is in the ready state; false otherwise.
       * @access read-only
       */
      ready:{
        enumerable: true,
        get: function(){
          return _ready;
        }
      },

      /**
       * Document: Media::Media::name
       *
       * Name of this Media object.
       *
       * @structure Property
       * @return {String}
       * @access read-only
       */
      name: {
        get: function(){
          return _name;
        },
        enumerable: true
      },

      /**
       * Document: Media::Media::id
       *
       * Id of this Media object.
       *
       * @structure Property
       * @return {String}.
       * @access read-only
       */
      id: {
        get: function(){
          return _id;
        },
        enumerable: true
      },

      /**
       * Document: Media::Media::tracks
       *
       * Array of Tracks attached to this Media object. Not ordered.
       *
       * @structure Property
       * @return {Array} Array of Tracks.
       * @access read-only
       */
      tracks: {
        get: function(){
          return _tracks;
        },
        enumerable: true
      },

      /**
       * Document: Media::Media::orderedTracks
       *
       * Ordered array of Tracks attached to this Media object. Should always be ordered.
       *
       * @structure Property
       * @return {Array} Array of Tracks.
       * @access read-only
       */
      orderedTracks: {
        get: function() {
          return _orderedTracks;
        },
        enumerable: true
      },

      /**
       * Document: Media::Media::currentTime
       *
       * Current time of this Media and underlying Popcorn object. Safe proxy for Popcorn.
       *
       * @structure Property
       * @dispatch mediatimeupdate
       * @return {Number} Current time of Popcorn media.
       * @access read-write
       */
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

      /**
       * Document: Media::Media::duration
       *
       * Duration of this Media. __Rarely needs to be set manually__.
       *
       * @structure Property
       * @dispatch mediadurationchanged
       * @return {Number} Length of media in seconds.
       * @access read-write
       */
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

      /**
       * Document: Media::Media::json
       *
       * JSON object representing the current state of this Media object.
       *
       * @structure Property
       * @return {JSON} Portable state of this object.
       * @access read-write
       */
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

      /**
       * Document: Media::Media::registry
       *
       * Shortcut to Popcorn plugin registry.
       *
       * @structure Property
       * @return {Dictionary}.
       * @access read-write
       */
      registry: {
        get: function(){
          return _registry;
        },
        set: function( val ){
          _registry = val;
        },
        enumerable: true
      },

      /**
       * Document: Media::Media::popcorn
       *
       * PopcornWrapper object housing an instance of Popcorn.
       *
       * @structure Property
       * @return {PopcornWrapper}.
       * @access read-only
       */
      popcorn: {
        enumerable: true,
        get: function(){
          return _popcornWrapper;
        }
      },

      /**
       * Document: Media::Media::paused
       *
       * Paused state of this Media object.
       *
       * @structure Property
       * @return {Boolean} True if paused, false otherwise.
       * @access read-write
       */
      paused: {
        enumerable: true,
        get: function(){
          return _popcornWrapper.paused;
        },
        set: function( val ){
          _popcornWrapper.paused = val;
        }
      },

      /**
       * Document: Media::Media::volume
       *
       * Volume of this Media object.
       *
       * @structure Property
       * @return {Number}.
       * @access read-write
       */
      volume: {
        enumerable: true,
        get: function(){
          return _popcornWrapper.volume;
        },
        set: function( val ){
          _popcornWrapper.volume = val;
        }
      },

      /**
       * Document: Media::Media::popcornOptions
       *
       * Options object used to initialize Popcorn media.
       *
       * @structure Property
       * @dispatch mediapopcornsettingschanged
       * @return {Dictionary}.
       * @access read-write
       */
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

    /**
     * Document: Media::Media::retrieveSrc
     *
     * Checks to see if there are any child source elements and uses them if neccessary.
     *
     * @param {DOMElement} targetElement Element to check for a source.
     * @structure Member Function
     * @api public
     */
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