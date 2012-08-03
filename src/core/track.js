/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [
          "./logger",
          "./eventmanager",
          "./trackevent",
          "./views/track-view"
        ],
        function(
          Logger,
          EventManagerWrapper,
          TrackEvent,
          TrackView
        ){

  var __guid = 0;

  var Track = function( options ){
    options = options || {};

    var _trackEvents = [],
        _id = "Layer" + __guid++,
        _target = options.target,
        _logger = new Logger( _id ),
        _name = options.name || _id,
        _order = 0,
        _view = new TrackView( this ),
        _popcornWrapper = null,
        _this = this;

    _this._media = null;

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

    Object.defineProperties( this, {
      view: {
        enumerable: true,
        configurable: false,
        get: function(){
          return _view;
        }
      },
      order: {
        enumerable: true,
        get: function(){
          return _order;
        },
        set: function( val ){
          var i, l;
          _order = val;
          _this.dispatch( "trackorderchanged", _order );
          for ( i = 0, l = _trackEvents.length; i < l; i++ ) {
            _trackEvents[ i ].update();
          }
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
          } //for
          _logger.log( "target changed: " + val );
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
        configurable: false,
        get: function(){
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

    this.addTrackEvent = function ( trackEvent ){
      if( !( trackEvent instanceof TrackEvent ) ){
        trackEvent = new TrackEvent( trackEvent );
      }
      trackEvent._track = _this;
      trackEvent.update( trackEvent.popcornOptions, true );
      if( _target ){
        trackEvent.target = _target;
      } //if
      _trackEvents.push( trackEvent );
      trackEvent.track = _this;
      _this.chain( trackEvent, [
        "trackeventupdated",
        "trackeventselected",
        "trackeventdeselected"
      ]);
      _view.addTrackEvent( trackEvent );
      trackEvent.track = _this;
      trackEvent.setPopcornWrapper( _popcornWrapper );
      _this.dispatch( "trackeventadded", trackEvent );
      return trackEvent;
    }; //addTrackEvent

    this.removeTrackEvent = function( trackEvent ){
      var idx = _trackEvents.indexOf( trackEvent );
      if ( idx > -1 ) {
        _trackEvents.splice( idx, 1 );
        _this.unchain( trackEvent, [
          "trackeventupdated",
          "trackeventselected",
          "trackeventdeselected"
        ]);
        _view.removeTrackEvent( trackEvent );
        trackEvent._track = null;
        trackEvent.setPopcornWrapper( null );
        _this.dispatch( "trackeventremoved", trackEvent );
        return trackEvent;
      } //if

    }; //removeEvent

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
