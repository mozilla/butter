/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

/**$
 * Track
 *
 * Butter Track
 *
 * @type module
 */
define( [ "./eventmanager", "./trackevent", "./views/track-view" ],
        function( EventManager, TrackEvent, TrackView ){

  var __guid = 0,
      NAME_PREFIX = "Layer ";

  /**$
   * Track::Track
   *
   * A container for TrackEvents which preserves and facilitates order among other Track objects.
   *
   * @type class
   * @param {Dictionary} options Initialization options:
   *    - target {String} Optional. Target to suggest to TrackEvents as they are added to this Track. See `Track::Track::target`.
   */
  function Track( options ) {
    options = options || {};

    var _trackEvents = [],
        _target = options.target,
        _id = "" + __guid++,
        _view = new TrackView( _id, this ),
        _popcornWrapper = null,
        _this = this,
        _order = 0,
        _name = NAME_PREFIX + _order;

    _this._media = null;

    /*
     * ghost stores a reference to the current track's ghost.
     * A ghost track is created when a trackevent overlaps another trackevent and there is
     * no room for a ghost trackevent to exist.
     */
    _this.ghost = null;

    EventManager.extend( _this );

    /**$
     * Track::Track::setPopcornWrapper
     *
     * Sets the PopcornWrapper object. Subsequently, PopcornWrapper can be used to directly manipulate Popcorn track events.
     *
     * @param {Object} newPopcornWrapper PopcornWrapper object or null
     * @type member function
     * @api public
     */
    this.setPopcornWrapper = function ( newPopcornWrapper ) {
      _popcornWrapper = newPopcornWrapper;
      for ( var i = 0, l = _trackEvents.length; i < l; ++i ){
        _trackEvents[ i ].bind( _this, newPopcornWrapper );
      }
    };

    /**$
     * Track::Track::updateTrackEvents
     *
     * Updates each constituent TrackEvent without specifying new options. Usually, this has the effect of simply
     * causing a 'trackeventupdated' event to be propagated if subtle updates around Butter are necessary.
     *
     * @type member function
     * @api public
     */
    this.updateTrackEvents = function() {
      var trackEvents = _trackEvents.slice();
      for ( var i = 0, l = trackEvents.length; i < l; i++ ) {
        trackEvents[ i ].update();
      }
    };

    Object.defineProperties( this, {
      /**$
       * Track::Track::view
       *
       * TrackEventView object associated with this Track.
       *
       * @type property
       * @return {TrackEventView}
       */
      view: {
        enumerable: true,
        configurable: false,
        get: function(){
          return _view;
        }
      },

      /**$
       * Track::Track::target
       *
       * The target object for this Track. When specified, TrackEvents have the option of using this property to decide their own target.
       *
       * @type property
       * @event tracktargetchanged
       * @return {String} Current target identifier.
       */
      target: {
        enumerable: true,
        get: function(){
          return _target;
        },
        set: function( val ){
          _target = val;
          _this.dispatch( "tracktargetchanged", _this );
          for( var i=0, l=_trackEvents.length; i<l; i++ ) {
            _trackEvents[ i ].target = val;
            _trackEvents[ i ].update({ target: val });
          }
        }
      },

      /**$
       * Track::Track::name
       *
       * Name of this Track.
       *
       * @type property
       * @event tracknamechanged
       * @return {String}
       */
      name: {
        enumerable: true,
        get: function(){
          return _name;
        },
        set: function( name ) {
          _name = name;
          _this.dispatch( "tracknamechanged", _this );
        }
      },

      /**$
       * Track::Track::id
       *
       * Unique identifier for this Track.
       *
       * @type property
       * @return {String}
       */
      id: {
        enumerable: true,
        get: function() {
          return _id;
        }
      },

      /**$
       * Track::Track::json
       *
       * Portable JSON description for this Track. JSON is constructed lazily, so each access of this property will roll up data
       * from this Track into a new object (so use sparingly). When set, internal changes to this Track will occur to reflect the input JSON.
       *
       * @type property
       * @return {JSON}
       */
      json: {
        enumerable: true,
        get: function(){
          var exportJSONTrackEvents = [];
          for ( var i=0, l=_trackEvents.length; i<l; ++i ) {
            exportJSONTrackEvents.push( _trackEvents[ i ].json );
          }
          return {
            name: _name,
            id: _id,
            trackEvents: exportJSONTrackEvents
          };
        },
        set: function( importData ){
          if( importData.name ){
            _name = importData.name;
          }
          if( importData.trackEvents ){
            var importTrackEvents = importData.trackEvents;
            if ( Array.isArray( importTrackEvents ) ) {
              for( var i = 0, l = importTrackEvents.length; i < l; ++i ) {
                _this.addTrackEvent( importTrackEvents[ i ] );
              }
            } else if ( console ) {
              console.warn( "Ignored imported track event data. Must be in an Array." );
            }
          }
        }
      },

      /**$
       * Track::Track::trackEvents
       *
       * Array of TrackEvents attached to this Track. This property provides a direct pointer to the private `_trackEvents` variable.
       * Manipulating the contents of the returned array may cause unexpected or undefined behaviour.
       *
       * @type property
       * @return {Array}
       */
      trackEvents: {
        enumerable: true,
        configurable: false,
        get: function(){
          return _trackEvents;
        }
      },

      /**$
       * Track::Track::order
       *
       * Order of this Track with respect to other Tracks on the parent Media object. Media's `sortTracks` function uses the value of
       * this property to sort the Track objects it holds. This should almost always be used in coorperation with `sortTracks`.
       *
       * @type property
       * @see Media::Media::sortTracks
       * @return {Number}
       */
      order: {
        enumerable: true,
        get: function() {
          return _order;
        },
        set: function( val ) {
          _order = val;
          _name = NAME_PREFIX + val;
        }
      }
    });

    /**$
     * Track::Track::getTrackEventById
     *
     * Attempts to find a TrackEvent in the collection of TrackEvent objects attached to this Track by comparing id's of
     * constituent TrackEvents to the specified `id` argument.
     *
     * @param {String} id TrackEvent identifier to search for.
     * @type member function
     * @return {TrackEvent|null}
     * @api public
     */
    this.getTrackEventById = function( id ){
      for ( var i=0, l=_trackEvents.length; i<l; ++i) {
        if( _trackEvents[ i ].id === id ) {
          return _trackEvents[ i ];
        }
      }
    };

    /**$
     * Track::Track::getTrackEventByName
     *
     * Attempts to find a TrackEvent in the collection of TrackEvent objects attached to this Track by comparing names of
     * constituent TrackEvents to the specified `name` argument.
     *
     * @param {String} name TrackEvent identifier to search for.
     * @type member function
     * @return {TrackEvent|null}
     * @api public
     */
    this.getTrackEventByName = function( name ){
      for ( var i=0, l=_trackEvents.length; i<l; ++i) {
        if( _trackEvents[ i ].name === name ) {
          return _trackEvents[ i ];
        }
      }
    };

    /**$
     * Track::Track::trackEventUpdateNotificationHandler
     *
     * Handles update notifications from TrackEvents to prevent overlapping. When overlapping occurs, this handler will
     * attempt to resolve it by using an empty space on the next track or adding a completely new track.
     *
     * @param {Notification} notification Notification object from observer subscription.
     * @see Observer::Notification
     * @type member function
     * @api private
     */
    function trackEventUpdateNotificationHandler( notification ) {
      var trackEvent = notification.origin,
          updateOptions = notification.data,
          currentOptions = trackEvent.popcornOptions,
          start = updateOptions.start || updateOptions.start === 0 ? updateOptions.start : currentOptions.start,
          end = updateOptions.end || updateOptions.end === 0 ? updateOptions.end : currentOptions.end,
          destinationTrack,
          nextTrack;

      // If the update will cause this event to overlap with another ...
      if ( trackEvent.track.findOverlappingTrackEvent( start, end, trackEvent ) ) {
        // reject the update by cancelling the notifiction;
        notification.cancel( "trackevent-overlap" );

        // remove the incriminating trackEvent to avoid conflicts;
        _this.removeTrackEvent( trackEvent );

        // find another track for the trackEvent to live on;
        nextTrack = _this._media.getNextTrack( _this );
        destinationTrack = nextTrack ? _this._media.forceEmptyTrackSpaceAtTime( nextTrack, start, end ) : _this._media.addTrack();

        // update the track with the updateOptions that were first issued;
        trackEvent.update( updateOptions );

        // and, finally, place the track in its new home.
        destinationTrack.addTrackEvent( trackEvent );
      }
    }

    /**$
     * Track::Track::addTrackEvent
     *
     * Attaches a TrackEvent to this Track. Listeners/handlers are applied here, and, if this Track belongs to a Media with a PopcornWrapper,
     * the TrackEvent is bound to that PopcornWrapper, giving it access to Popcorn directly (so it can create/delete Popcorn trackevents).
     *
     * @param {TrackEvent|Object} trackEvent TrackEvent or manifest object to create one. If an non TrackEvent object is passed in, it is
     *                                       assumed to be a dictionary containing options for a new TrackEvent.
     * @type member function
     * @event trackeventadded
     * @return {TrackEvent} The TrackEvent that was provided, or a manifestation of one described by the provided dictionary.
     * @api public
     */
    this.addTrackEvent = function( trackEvent ) {
      var oldSelected = false;

      if ( !( trackEvent instanceof TrackEvent ) ) {
        trackEvent = new TrackEvent( trackEvent );
      } else if ( trackEvent.selected ) {
        // cache the track event's selected state
        oldSelected = true;
        // a selected track event cannot be selected again, so we deselect it
        trackEvent.selected = false;
      }

      if ( trackEvent.track ) {
        throw "TrackEvent still bound to track. Please use `track.removeTrackEvent` first.";
      }

      trackEvent.bind( _this, _popcornWrapper );

      // If the track itself has a target, give it to the trackevent as well.
      if( _target ){
        trackEvent.target = _target;
      }
      // Remember the trackevent
      _trackEvents.push( trackEvent );

      // Listen for a handful of events that affect functionality in and outside of this track.
      _this.chain( trackEvent, [
        "trackeventupdated",
        "trackeventselected",
        "trackeventdeselected"
      ]);

      // Add it to the view.
      _view.addTrackEvent( trackEvent );

      trackEvent.selected = oldSelected;

      trackEvent.subscribe( "update", trackEventUpdateNotificationHandler );

      _this.dispatch( "trackeventadded", trackEvent );

      // Update the trackevent with defaults (if necessary)
      if ( _this._media ) {
        trackEvent.update( trackEvent.popcornOptions, true );
      }

      return trackEvent;
    }; //addTrackEvent

    /**$
     * Track::Track::removeTrackEvent
     *
     * Removes a TrackEvent from this Track.
     *
     * @param {TrackEvent|Object} trackEvent TrackEvent to be removed. Unlick `addTrackEvent`, this must be a TrackEvent object.
     * @type member function
     * @event trackeventremoved
     * @api public
     */
    this.removeTrackEvent = function( trackEvent ) {
      var idx = _trackEvents.indexOf( trackEvent );
      if ( idx > -1 ) {
        _trackEvents.splice( idx, 1 );
        _this.unchain( trackEvent, [
          "trackeventupdated",
          "trackeventselected",
          "trackeventdeselected"
        ]);
        trackEvent.unsubscribe( "update", trackEventUpdateNotificationHandler );
        _view.removeTrackEvent( trackEvent );
        trackEvent.unbind();
        _this.dispatch( "trackeventremoved", trackEvent );
        return trackEvent;
      }
    };

    /**$
     * Track::Track::findOverlappingTrackEvent
     *
     * Finds TrackEvent on attached to this Track that overlaps with the window defined by the start and end times provided.
     *
     * @param {Number|TrackEvent} start If a TrackEvent, start and end times are derived from this argument.
     *                                  Otherwise, a Number representing the beginning of the time window used to search.
     * @param {Number|TrackEvent} end If the `start` parameter (above) is a TrackEvent, this parameter is interpretted as the `ignoreTrackEvent` parameter (below).
     *                                Otherwise, a Number representing the end of time window used to search.
     * @param {TrackEvent} ignoreTrackEvent Optional. TrackEvent which should be ignored during search.
     * @type member function
     * @return {TrackEvent|null} A TrackEvent that overlaps with the specified time window. `null` if no such TrackEvent exists.
     * @usage t.findOverlappingTrackEvent(start, end, ignoreTrackEvent); or t.findOverlappingTrackEvent(trackEvent, ignoreTrackEvent);
     * @api public
     */
    this.findOverlappingTrackEvent = function( start, end, ignoreTrackEvent ) {
      var trackEvent, popcornOptions;

      // If a TrackEvent was passed in, we can derive the rest from less arguments.
      if ( start instanceof TrackEvent ) {
        // If only two args were passed in, treat the last one as ignoreTrackEvent.
        if ( arguments.length === 2 ) {
          ignoreTrackEvent = end;
        }

        // Sort out the args again.
        trackEvent = start;
        start = trackEvent.popcornOptions.start;
        end = trackEvent.popcornOptions.end;
      }

      // loop over all the trackevents for this track and see if we overlap
      for ( var i = 0, l = _trackEvents.length; i < l; i++ ) {
        trackEvent = _trackEvents[ i ];
        popcornOptions = trackEvent.popcornOptions;
        // if a trackevent overlaps and it's not a ghost...
        if (  trackEvent !== ignoreTrackEvent &&
              !trackEvent.view.isGhost &&
              !( start > popcornOptions.end || end < popcornOptions.start ) ) {
          return trackEvent;
        }
      }
      return null;
    };

    /**$
     * Track::Track::deselectEvents
     *
     * Deselects all attached TrackEvents setting the `selected` property of each to false.
     *
     * @param {TrackEvent} except TrackEvent to ignore.
     * @type member function
     * @api public
     */
    this.deselectEvents = function( except ){
      for( var i=0, l=_trackEvents.length; i<l; ++i ){
        if( _trackEvents[ i ] !== except ){
          _trackEvents[ i ].selected = false;
        }
      }
    };

  }

  return Track;

});
