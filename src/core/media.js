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
  define( [
      "core/logger", 
      "core/eventmanager", 
      "core/track" ], 
    function( Logger, EventManager, Track ) {

    var Media = function ( options ) {
      options = options || {};

      var tracks = [],
          id = "Media" + Media.guid++,
          logger = new Logger( id ),
          em = new EventManager( { logger: logger } ),
          name = options.name || id + Date.now(),
          url,
          target,
          registry,
          currentTime = 0,
          duration = 0,
          that = this;

      em.apply( "Media", this );

      Object.defineProperty( this, "url", {
        get: function() {
          return url;
        },
        set: function( val ) {
          if ( url !== val ) {
            url = val;
            em.dispatch( "mediacontentchanged", that );
          }
        }
      });

      Object.defineProperty( this, "target", {
        get: function() {
          return target;
        },
        set: function( val ) {
          if ( target !== val ) {
            target = val;
            em.dispatch( "mediatargetchanged", that );
          }
        }
      });

      Object.defineProperty( this, "name", {
        get: function() {
          return name;
        }
      });

      Object.defineProperty( this, "id", {
        get: function() {
          return id;
        }
      });

      Object.defineProperty( this, "tracks", {
        get: function() {
          return tracks;
        }
      });

      Object.defineProperty( this, "currentTime", {
        get: function() {
          return currentTime;
        },
        set: function( time ) {
          if ( time !== undefined ) {
            currentTime = time;
            if ( currentTime < 0 ) {
              currentTime = 0;
            }
            if ( currentTime > duration ) {
              currentTime = duration;
            } //if
            em.dispatch( "mediatimeupdate", that );
          } //if
        }
      });

      Object.defineProperty( this, "duration", {
        get: function() {
          return duration;
        },
        set: function( time ) {
          if ( time ) {
            duration = time;
            logger.log( "duration changed to " + duration );
            em.dispatch( "mediadurationchanged", that );
          }
        }
      });

      this.addTrack = function ( track ) {
        if ( !( track instanceof Track ) ) {
          track = new Track( track );
        } //if
        tracks.push( track );
        track.listen( "tracktargetchanged", em.repeat );
        track.listen( "trackeventadded", em.repeat );
        track.listen( "trackeventremoved", em.repeat );
        track.listen( "trackeventupdated", em.repeat );
        em.dispatch( "trackadded", track );
        var trackEvents = track.trackEvents;
        if ( trackEvents.length > 0 ) {
          for ( var i=0, l=trackEvents.length; i<l; ++i ) {
            track.dispatch( "trackeventadded", trackEvents[ i ] );
          } //for
        } //if
        return track;
      }; //addTrack

      this.getTrack = function ( track ) {
        for ( var i=0, l=tracks.length; i<l; ++i ) {
          if (  ( track.id !== undefined && tracks[ i ].id === track.id ) ||
                ( track.name && tracks[ i ].name === track.name ) ||
                tracks[ i ] === track ) {
            return tracks[ i ];
          } //if
        } //for
        return undefined;
      }; //getTrack

      this.removeTrack = function ( track ) {
        if ( typeof(track) === "string" ) {
          track = that.getTrack( { name: track } );
        } //if
        var idx = tracks.indexOf( track );
        if ( idx > -1 ) {
          tracks.splice( idx, 1 );
          var events = track.trackEvents;
          for ( var i=0, l=events.length; i<l; ++i ) {
            em.dispatch( "trackeventremoved", events[i] );
          } //for
          track.unlisten( "tracktargetchanged", em.repeat );
          track.unlisten( "trackeventadded", em.repeat );
          track.unlisten( "trackeventremoved", em.repeat );
          track.unlisten( "trackeventupdated", em.repeat );
          em.dispatch( "trackremoved", track );
          return track;
        } //if
        return undefined;    
      }; //removeTrack


      Object.defineProperty( this, "json", {
        get: function() {
          var exportJSONTracks = [];
          for ( var i=0, l=tracks.length; i<l; ++i ) {
            exportJSONTracks.push( tracks[ i ].json );
          }
          return {
            id: id,
            name: name,
            url: url,
            target: target,
            duration: duration,
            tracks: exportJSONTracks
          };
        },
        set: function( importData ) {
          if ( importData.name ) {
            name = importData.name;
          }
          if ( importData.target ) {
            that.target = importData.target;
          }
          if ( importData.url ) {
            that.url = importData.url;
          }
          if ( importData.tracks ) {
            var importTracks = importData.tracks;
            for ( var i=0, l=importTracks.length; i<l; ++i ) {
              var newTrack = new Track();
              newTrack.json = importTracks[ i ];
              that.addTrack( newTrack );
            }
          }
        }
      }); //json

      Object.defineProperty( this, "registry", {
        get: function() {
          return registry;
        },
        set: function( val ) {
          registry = val;
        }
      });

      this.getManifest = function( name ) {
        return registry[ name ];
      }; //getManifest

      if ( options.url ) {
        this.url = options.url;
      }
      if ( options.target ) {
        this.target = options.target;
      }

    }; //Media
    Media.guid = 0;

    return Media;

  });
})();
