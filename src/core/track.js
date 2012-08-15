/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [
          "./eventmanager",
          "./trackevent",
          "./views/track-view"
        ],
        function(
          EventManagerWrapper,
          TrackEvent,
          TrackView
        ){

  var __guid = 0,
      Track;

  Track = function( options ) {
    options = options || {};

    var _trackEvents = [],
        _target = options.target,
        _id = "" + __guid++,
        _name = options.name || "Layer" + _id,
        _view = new TrackView( _id, this ),
        _popcornWrapper = null,
        _this = this;

    _this._media = null;
    _this.order = 0;
    /*
     * ghost stores a reference to the current track's ghost.
     * A ghost track is created when a trackevent overlaps another trackevent and there is
     * no room for a ghost trackevent to exist.
     */
    _this.ghost = null;

    EventManagerWrapper( _this );

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
        _trackEvents[ i ].setPopcornWrapper( newPopcornWrapper );
      }
    };

    this.updateTrackEvents = function() {
      for ( var i = 0, l = _trackEvents.length; i < l; i++ ) {
        _trackEvents[ i ].update();
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
            for( var i=0, l=importTrackEvents.length; i<l; ++i ){
              var newTrackEvent = new TrackEvent();
              newTrackEvent.json = importTrackEvents[ i ];
              _this.addTrackEvent( newTrackEvent );
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

    this.addTrackEvent = function ( trackEvent ) {
      var oldSelected = trackEvent ? !!trackEvent.selected : false;

      // Never absorb a track object. Only create new ones.
      // Keeps track->trackevent ownership simple! :)
      trackEvent = new TrackEvent( trackEvent, _this, _popcornWrapper );

      // Update the trackevent with defaults (if necessary)
      trackEvent.update( trackEvent.popcornOptions, true );

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

      _this.dispatch( "trackeventadded", trackEvent );

      return trackEvent;
    }; //addTrackEvent

    /*
     * Method removeTrackEvent
     *
     * @param {Object} trackEvent: The trackEvent to be removed from this track
     * @param {Boolean} expectingTrackEvent: if true means we should not remove this track if it is empty as we are expecting a new trackEvent soon. This mostly comes in to play when adding/removing ghost trackEvents.
     */
    this.removeTrackEvent = function( trackEvent, expectingTrackEvent ){
      var idx = _trackEvents.indexOf( trackEvent );
      if ( idx > -1 ) {
        _trackEvents.splice( idx, 1 );
        _this.unchain( trackEvent, [
          "trackeventupdated",
          "trackeventselected",
          "trackeventdeselected"
        ]);
        _view.removeTrackEvent( trackEvent );
        trackEvent.unbind();
        _this.dispatch( "trackeventremoved", trackEvent );
        if ( !_trackEvents.length && !expectingTrackEvent ) {
          _this._media.removeTrack( _this );
        }
        return trackEvent;
      }
    };

    this.deselectEvents = function( except ){
      for( var i=0, l=_trackEvents.length; i<l; ++i ){
        if( _trackEvents[ i ] !== except ){
          _trackEvents[ i ].selected = false;
        } //if
      } //for
    }; //deselectEvents

  }; //Track

  return Track;

}); //define
