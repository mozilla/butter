/**********************************************************************************

Copyright (C) 2011 by Mozilla Foundation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

**********************************************************************************/

define( [ "core/logger", "core/eventmanager", "core/trackevent" ], function( Logger, EventManager, TrackEvent ) {

  var __guid = 0;

  var Track = function( options ){
    options = options || {};

    var _trackEvents = [],
        _id = "Track" + __guid++,
        _target = options.target,
        _logger = new Logger( _id ),
        _em = new EventManager( this ),
        _name = options.name || _id,
        _this = this;

    Object.defineProperties( this, {
      target: {
        enumerable: true,
        get: function() {
          return _target;
        },
        set: function( val ) {
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
        get: function() {
          return _name;
        }
      },
      id: {
        enumerable: true,
        configurable: false,
        get: function() {
          return _id;
        }
      },
      json: {
        enumerable: true,
        get: function() {
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
        set: function( importData ) {
          if ( importData.name ) {
            name = importData.name;
          }
          if ( importData.trackEvents ) {
            var importTrackEvents = importData.trackEvents;
            for ( var i=0, l=importTrackEvents.length; i<l; ++i ) {
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
        get: function() {
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
        trackEvent.track = undefined;
        _em.dispatch( "trackeventremoved", trackEvent );
        return trackEvent;
      } //if

    }; //removeEvent

  }; //Track

  return Track;

}); //define
