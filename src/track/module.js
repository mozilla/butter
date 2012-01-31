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

  define( [ "core/logger", "core/eventmanager" ], function( Logger, EventManager ) {

    var TrackEditor = function( butter, options ) {
      if ( !options ) {
        throw new Error( "invalid arguments" );
      }

      if ( !options.target ) {
        throw new Error( "must supply a target" );
      }
      var target = document.getElementById( options.target ) || options.target,
          that = this;

      var Editor = function( track ) {
        var target = document.getElementById( options.target ) || options.target,
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

        console.log( "THIS SHOULD ONLY HAPPEN ONCE" );
        Object.defineProperties( this, {
          track: {
            get: function() {
              return track;
            },
            configurable: true
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

