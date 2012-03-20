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
          EventManager,
          TrackEvent,
          TrackView
        ){

  var __guid = 0;

  var Track = function( options ){
    options = options || {};

    var _trackEvents = [],
        _id = "Track" + __guid++,
        _target = options.target,
        _logger = new Logger( _id ),
        _em = new EventManager( this ),
        _name = options.name || _id,
        _order = options.order || 0,
        _view = new TrackView( this ),
        _this = this;

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
          _order = val;
          _em.dispatch( "trackorderchanged", _order );
        }
      },
      target: {
        enumerable: true,
        get: function(){
          return _target;
        },
        set: function( val ){
          _target = val;
          _em.dispatch( "tracktargetchanged", _this );
          for( var i=0, l=_trackEvents.length; i<l; i++ ) {
            _trackEvents[ i ].target = val;
            _trackEvents[ i ].update({ target: val });
          } //for
          _logger.log( "target changed: " + val );
        }
      },
      name: {
        enumerable: true,
        configurable: false,
        get: function(){
          return _name;
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
            name = importData.name;
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
      } //if
      if( _target ){
        _trackEvents.target = _target;
      } //if
      _trackEvents.push( trackEvent );
      trackEvent.track = _this;
      _em.repeat( trackEvent, [
        "trackeventupdated",
        "trackeventselected",
        "trackeventdeselected",
        "trackeventeditrequested"
      ]);
      _view.addTrackEvent( trackEvent );
      trackEvent.track = _this;
      _em.dispatch( "trackeventadded", trackEvent );
      return trackEvent;
    }; //addTrackEvent

    this.removeTrackEvent = function( trackEvent ){
      var idx = _trackEvents.indexOf( trackEvent );
      if ( idx > -1 ) {
        _trackEvents.splice( idx, 1 );
        trackEvent.track = undefined;
        _em.unrepeat( trackEvent, [
          "trackeventupdated",
          "trackeventselected",
          "trackeventdeselected",
          "trackeventeditrequested"
        ]);
        _view.removeTrackEvent( trackEvent );
        trackEvent.track = undefined;
        _em.dispatch( "trackeventremoved", trackEvent );
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
