/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "./eventmanager", "./trackevent", "./views/track-view" ],
        function( EventManager, TrackEvent, TrackView ){

  var __guid = 0,
      NAME_PREFIX = "Layer ",
      Track;

  Track = function( options ) {
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

    /**
     * Member: setPopcornWrapper
     *
     * Sets the PopcornWrapper object. Subsequently, PopcornWrapper can be used to directly manipulate Popcorn track events.
     *
     * @param {Object} newPopcornWrapper: PopcornWrapper object or null
     */
    this.setPopcornWrapper = function ( newPopcornWrapper ) {
      _popcornWrapper = newPopcornWrapper;
      for ( var i = 0, l = _trackEvents.length; i < l; ++i ){
        _trackEvents[ i ].bind( _this, newPopcornWrapper );
      }
    };

    this.updateTrackEvents = function() {
      var trackEvents = _trackEvents.slice();
      for ( var i = 0, l = trackEvents.length; i < l; i++ ) {
        trackEvents[ i ].update();
      }
    };

    Object.defineProperties( this, {
      view: {
        enumerable: true,
        configurable: false,
        get: function(){
          return _view;
        }
      },
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
      id: {
        enumerable: true,
        get: function() {
          return _id;
        }
      },
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
      trackEvents: {
        enumerable: true,
        configurable: false,
        get: function(){
          return _trackEvents;
        }
      },
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

    this.getTrackEventById = function( id ){
      for ( var i=0, l=_trackEvents.length; i<l; ++i) {
        if( _trackEvents[ i ].id === id ) {
          return _trackEvents[ i ];
        } //if
      } //for
    }; //getTrackEventById

    this.getTrackEventByName = function( name ){
      for ( var i=0, l=_trackEvents.length; i<l; ++i) {
        if( _trackEvents[ i ].name === name ) {
          return _trackEvents[ i ];
        } //if
      } //for
    }; //getTrackEventByName

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

    /*
     * Method removeTrackEvent
     *
     * @param {Object} trackEvent: The trackEvent to be removed from this track
     */
    this.removeTrackEvent = function( trackEvent, preventRemove ) {
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
        trackEvent.unbind( preventRemove );
        _this.dispatch( "trackeventremoved", trackEvent );
        return trackEvent;
      }
    };

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
              !( start >= popcornOptions.end || end <= popcornOptions.start ) ) {
          return trackEvent;
        }
      }
      return null;
    };

    this.deselectEvents = function( except ){
      var trackEvent;
      for ( var i = 0, l = _trackEvents.length; i < l; ++i ) {
        trackEvent = _trackEvents[ i ];
        if( trackEvent !== except && trackEvent.selected ){
          trackEvent.selected = false;
        } //if
      } //for
    }; //deselectEvents

  }; //Track

  return Track;

}); //define
