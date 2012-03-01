/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function() {

  define( [ "core/logger", "core/eventmanager" ], function( Logger, EventManager ) {

    var TrackEditor = function( butter, options ) {

      var Editor = function( track ) {
        var target = document.getElementById( "butter-plugin" ), 
            that = this;
        butter.listen( "trackremoved", function( event ) {
          if ( event.data === track ) {
            that.close();
          }
        }); //ontrackremoved

        track.listen( "tracktargetchanged", function() {
          target = document.getElementById( track.target );
        });

        this.close = function() {
        }; //close

        this.remove = function() {
          butter.removeTrack( track );
        }; //remove

        this.clear = function() {
          var trackEvents = track.trackEvents;

          while ( trackEvents.length ) {
            butter.removeTrackEvent( track, trackEvents[ 0 ] );
          } //while
        }; //clear

        Object.defineProperties( this, {
          track: {
            get: function() {
              return track;
            }
          }, //track
          json: {
            get: function() {
              return track.json;
            },
            set: function( val ) {
              that.clear();
              track.json = val;

              var trackEvents = JSON.parse( val ).trackEvents;
              for ( var i = 0, l = trackEvents.length; i < l; i++ ) {
                track.addTrackEvent( new Butter.TrackEvent({ popcornOptions: trackEvents[ i ].popcornOptions, type: trackEvents[ i ].type }) )
              }
            }
          }, //json
          target: {
            get: function() {
              return track.target;
            },
            set: function( val ) {
              track.target = val;
              butter.dispatch( "trackupdated", track );
            }
          } //target
        });

      }; //Editor

      this.Editor = Editor;

    }; //TrackEditor

    return TrackEditor;

  });
}());

