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

(function() {
  define( [ "core/logger", "core/eventmanager", "core/trackevent" ], function( Logger, EventManager, TrackEvent ) {

    var Track = function ( options ) {
      options = options || {};

      var trackEvents = [],
          id = "Track" + Track.guid++,
          target = options.target,
          logger = new Logger( id ),
          em = new EventManager( { logger: logger } ),
          that = this;

      options = options || {};
      var name = options.name || 'Track' + Date.now();

      em.apply( "Track", this );

      Object.defineProperty( this, "target", {
        get: function() {
          return target;
        },
        set: function( val ) {
          target = val;
          em.dispatch( "tracktargetchanged", that );
          for( var i=0, l=trackEvents.length; i<l; i++ ) {
            trackEvents[ i ].target = val;
            trackEvents[ i ].update({ target: val });
          } //for
          logger.log( "target changed: " + val );
        }
      }); //target

      Object.defineProperty( this, "name", {
        get: function() {
          return name;
        }
      }); //name

      Object.defineProperty( this, "id", {
        get: function() {
          return id;
        }
      }); //id

      Object.defineProperty( this, "json", {
        get: function() {
          var exportJSONTrackEvents = [];
          for ( var i=0, l=trackEvents.length; i<l; ++i ) {
            exportJSONTrackEvents.push( trackEvents[ i ].json );
          }
          return {
            name: name,
            id: id,
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
              that.addTrackEvent( newTrackEvent );
            }
          }
        }
      }); //json

      this.getTrackEvent = function ( trackEvent ) {
        for ( var i=0, l=trackEvents.length; i<l; ++i) {
          if (  ( trackEvent.id !== undefined && trackEvents[ i ].id === trackEvent.id ) || 
                ( trackEvent.name && trackEvents[ i ].name === trackEvent.name ) ||
                trackEvents[ i ].name === trackEvent ) {
            return trackEvents[i];
          } //if
        } //for
      }; //getTrackEvent

      Object.defineProperty( this, "trackEvents", {
        get: function() {
          return trackEvents;
        }
      }); //trackEvents

      this.addTrackEvent = function ( trackEvent ) {
        if ( !( trackEvent instanceof TrackEvent ) ) {
          trackEvent = new TrackEvent( trackEvent );
        } //if
        if ( target ) {
          trackEvents.target = target;
        } //if
        trackEvents.push( trackEvent );
        trackEvent.track = that;
        trackEvent.listen( "trackeventupdated", em.repeat );
        em.dispatch( "trackeventadded", trackEvent );
        return trackEvent;
      }; //addTrackEvent

      this.removeTrackEvent = function( trackEvent ) {
        if ( typeof(trackEvent) === "string" ) {
          trackEvent = that.getTrackEvent( trackEvent );
        } //if

        var idx = trackEvents.indexOf( trackEvent );

        if ( idx > -1 ) {
          trackEvents.splice( idx, 1 );
          trackEvent.track = undefined;
          trackEvent.unlisten( "trackeventupdated", em.repeat );
          em.dispatch( "trackeventremoved", trackEvent );
        } //if

      }; //removeEvent

    }; //Track
    Track.guid = 0;

    return Track;

  }); //define
})();
