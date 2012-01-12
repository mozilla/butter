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

  define( [ "core/logger", "core/eventmanager", "core/trackevent", "comm/comm", "trackLiner/trackLiner" ], function( Logger, EventManager, TrackEvent, Comm ) {

    var Timeline = function( butter, options ) {

      var mediaInstances = {},
          currentMediaInstance,
          target = document.getElementById( options.target ) || options.target;

      this.findAbsolutePosition = function ( obj ) {

        var curleft = curtop = 0;

        if ( obj.offsetParent ) {

          do {

            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
          } while ( obj = obj.offsetParent );
        }

        //returns an array
        return [ curleft, curtop ];
      };

      this.moveFrameLeft = function( event ) {

        if ( butter.targettedEvent ) {

          event.preventDefault();

          var cornOptions = butter.targettedEvent.popcornOptions,
              inc = event.shiftKey ? 2.5 : 0.25;

          if ( cornOptions.start > inc ) {

            cornOptions.start -= inc;

            if ( !event.ctrlKey && !event.metaKey ) {

              cornOptions.end -= inc;
            }
          } else {

            if ( !event.ctrlKey ) {

              cornOptions.end = cornOptions.end - cornOptions.start;
            }

            cornOptions.start = 0;
          }

          butter.targettedEvent.update( cornOptions );
        }
      };

      this.moveFrameRight = function( event ) {

        if ( butter.targettedEvent ) {

          event.preventDefault();

          var cornOptions = butter.targettedEvent.popcornOptions,
              inc = event.shiftKey ? 2.5 : 0.25;

          if ( cornOptions.end < butter.duration - inc ) {

            cornOptions.end += inc;

            if ( !event.ctrlKey && !event.metaKey ) {

              cornOptions.start += inc;
            }
          } else {

            if ( !event.ctrlKey ) {

              cornOptions.start += butter.duration - cornOptions.end;
            }

            cornOptions.end = butter.duration;
          }

          butter.targettedEvent.update( cornOptions );
        }
      };

      // Convert an SMPTE timestamp to seconds
      this.smpteToSeconds = function( smpte ) {

        var t = smpte.split( ":" );

        if ( t.length === 1 ) {

          return parseFloat( t[ 0 ], 10 );
        }

        if ( t.length === 2 ) {

          return parseFloat( t[ 0 ], 10 ) + parseFloat( t[ 1 ] / 12, 10 );
        }

        if ( t.length === 3 ) {

          return parseInt( t[ 0 ] * 60, 10 ) + parseFloat( t[ 1 ], 10 ) + parseFloat( t[ 2 ] / 12, 10 );
        }

        if ( t.length === 4 ) {

          return parseInt( t[ 0 ] * 3600, 10 ) + parseInt( t[ 1 ] * 60, 10 ) + parseFloat( t[ 2 ], 10 ) + parseFloat( t[ 3 ] / 12, 10 );
        }
      }; //smpteToSeconds

      this.secondsToSMPTE = function( time ) {

        var timeStamp = new Date( 1970,0,1 ),
            seconds;

        timeStamp.setSeconds( time );

        seconds = timeStamp.toTimeString().substr( 0, 8 );

        if ( seconds > 86399 )  {

          seconds = Math.floor( (timeStamp - Date.parse("1/1/70") ) / 3600000) + seconds.substr(2);

        }
        return seconds;
      }; //secondsToSMPTE
      
      var createContainer = function() {

        var container = document.createElement( "div" );

        container.style.width = "100%";
        container.style.height = "100%";
        container.style.position = "relative";
        container.style.MozUserSelect = "none";
        container.style.webkitUserSelect = "none";
        container.style.oUserSelect = "none";
        container.style.userSelect = "none";
        container.id = "timeline-container";

        return container;
      };

      var MediaInstance = function( media ) {

        // capturing self to be used inside element event listeners
        var self = this;
        
        this.initialized = false;
        
        target.appendChild( this.container = createContainer() );

        this.tracks = document.createElement( "div" );
        this.tracks.style.width = "100%";
        this.tracks.style.height = "100%";
        this.tracks.id = "tracks-container";

        this.init = function() {
        
          this.initialized = true;
          this.duration = media.duration;

          this.trackLine = new TrackLiner({
            element: this.tracks,
            dynamicTrackCreation: true,
            scale: 1,
            duration: this.duration
          });

          this.trackLine.listen( "trackupdated", function( event ) {

            var track = event.data.track,
                index = event.data.index;

            currentMediaInstance.butterTracks[ track.id ].newPos = index;
            butter.dispatch( "trackmoved", currentMediaInstance.butterTracks[ track.id ] );
          });

          this.trackLine.listen( "trackadded", function( event ) {

            var trackLinerTrack = event.data.track,
                butterTrack = currentMediaInstance.butterTracks[ trackLinerTrack.id ];

            // track is being created by trackLiner
            if ( !butterTrack ) {

              butterTrack = new Butter.Track();

              // make a function for this
              currentMediaInstance.trackLinerTracks[ butterTrack.id ] = trackLinerTrack;
              currentMediaInstance.butterTracks[ trackLinerTrack.id ] = butterTrack;

              butter.addTrack( butterTrack );
            }
          });

          this.trackLine.listen( "trackremoved", function( event ) {

            butter.removeTrack( event.data.track, "timeline" );
          });

          this.trackLine.listen( "trackeventupdated", function( e ) {

            if ( e.data.ui ) {
              var trackLinerTrack = e.data.track,
                  butterTrack = currentMediaInstance.butterTracks[ trackLinerTrack.id ],
                  trackLinerTrackEvent = e.data.trackEvent,
                  butterTrackEvent = currentMediaInstance.butterTrackEvents[ trackLinerTrackEvent.element.id ];

              var cornOptions = butterTrackEvent.popcornOptions;
              cornOptions.start = Math.max( 0, trackLinerTrackEvent.options.left / currentMediaInstance.container.offsetWidth * currentMediaInstance.duration );
              cornOptions.end = Math.max( 0, ( trackLinerTrackEvent.options.left + trackLinerTrackEvent.options.width ) / currentMediaInstance.container.offsetWidth * currentMediaInstance.duration );

              if ( trackLinerTrack.id !== currentMediaInstance.trackLinerTracks[ butterTrackEvent.track.id ].id ) {

                currentMediaInstance.trackLinerTrackEvents[ butterTrackEvent.id ] = trackLinerTrackEvent;
                currentMediaInstance.butterTrackEvents[ trackLinerTrackEvent.element.id ] = butterTrackEvent;

                butterTrackEvent.track.removeTrackEvent( butterTrackEvent );
                butterTrack.addTrackEvent( butterTrackEvent );
              }
              
              butterTrackEvent.update( cornOptions );
            } //if
          });

          this.trackLine.listen( "trackeventadded", function( e ) {

            if ( e.data.ui ) {

              var trackLinerTrack = e.data.track,
                  butterTrack = currentMediaInstance.butterTracks[ trackLinerTrack.id ],
                  trackLinerTrackEvent = e.data.trackEvent,
                  butterTrackEvent = currentMediaInstance.butterTrackEvents[ trackLinerTrackEvent.element.id ],
                  name = e.data.name;

              if ( !butterTrackEvent ) {

                var start = trackLinerTrackEvent.options.left / currentMediaInstance.container.offsetWidth * currentMediaInstance.duration,
                    end = start + ( trackLinerTrackEvent.options.width / currentMediaInstance.container.offsetWidth * currentMediaInstance.duration ),
                    type = e.data.trackEvent.element.children[ 0 ].title || e.data.trackEvent.options.innerHTML;

                butterTrackEvent = new Butter.TrackEvent({
                  popcornOptions: {
                    start: start,
                    end: end },
                  type: type
                });

                // make a function for this
                currentMediaInstance.trackLinerTrackEvents[ butterTrackEvent.id ] = trackLinerTrackEvent;
                currentMediaInstance.butterTrackEvents[ trackLinerTrackEvent.element.id ] = butterTrackEvent;

                butter.addTrackEvent( butterTrack, butterTrackEvent );
              }
            }
          });

          this.trackLine.listen( "trackeventclicked", function( e ) {

            var track = e.data.track,
                trackLinerTrackEvent = e.data.trackEvent,
                butterTrackEvent = currentMediaInstance.butterTrackEvents[ trackLinerTrackEvent.element.id ];

            butter.targettedEvent = butterTrackEvent;
          });

          this.trackLine.listen( "trackeventdoubleclicked", function( e ) {

            var trackLinerTrack = e.data.track,
                butterTrack = currentMediaInstance.butterTracks[ trackLinerTrack.id ],
                trackLinerTrackEvent = e.data.trackEvent,
                butterTrackEvent = currentMediaInstance.butterTrackEvents[ trackLinerTrackEvent.element.id ];

            if ( butter.eventeditor ) {

              butter.eventeditor.editTrackEvent( butterTrackEvent );
            }
          });

          this.butterTracks = {};
          this.trackLinerTracks = {};
          this.butterTrackEvents = {};
          this.trackLinerTrackEvents = {};
          this.container.appendChild( this.tracks );
        };

        this.destroy = function() {

          target.removeChild( this.container );
        };

        this.hide = function() {

          this.container.style.display = "none";
        };

        this.show = function() {

          this.container.style.display = "block";
        };
        
        this.media = media;
      };
      
      var addTrack = function( track ) {

        if( !currentMediaInstance.trackLine ) {

          return;
        }
      };

      butter.listen( "trackadded", function( event ) {
      
        if ( !currentMediaInstance ) {

          return;
        }

        var butterTrack = event.data,
            trackLinerTrack = currentMediaInstance.trackLinerTracks[ butterTrack.id ];

        // track is being created by butter
        if ( !trackLinerTrack ) {

          trackLinerTrack = currentMediaInstance.trackLine.createTrack();

          // make a function for this
          currentMediaInstance.trackLinerTracks[ butterTrack.id ] = trackLinerTrack;
          currentMediaInstance.butterTracks[ trackLinerTrack.id ] = butterTrack;

          currentMediaInstance.trackLine.addTrack( trackLinerTrack );
        }
      });

      butter.listen( "trackremoved", function( event ) {

        if ( event.target !== "timeline" ) {

          var track = event.data,
              trackLinerTrack = currentMediaInstance.trackLinerTracks[ track.id ],
              trackEvents = trackLinerTrack.trackEvents,
              trackEvent;

          currentMediaInstance.trackLine.removeTrack( trackLinerTrack );

          delete currentMediaInstance.butterTracks[ trackLinerTrack.id ];
          delete currentMediaInstance.trackLinerTracks[ track.id ];
        }
      });

      var addTrackEvent = function( trackEvent ) {

        if( !currentMediaInstance.trackLinerTracks ) {

          return;
        }

        var trackLinerTrackEvent = currentMediaInstance.trackLinerTracks[ trackEvent.track.id ].createTrackEvent( trackEvent );

        currentMediaInstance.trackLinerTrackEvents[ trackEvent.id ] = trackLinerTrackEvent;
        currentMediaInstance.butterTrackEvents[ trackLinerTrackEvent.element.id ] = trackEvent;
      };

      butter.listen( "trackeventadded", function( e ) {
      
        if ( !currentMediaInstance ) {

          return;
        }

        var butterTrack = e.data.track,
            trackLinerTrack = currentMediaInstance.trackLinerTracks[ butterTrack.id ],
            butterTrackEvent = e.data,
            trackLinerTrackEvent = currentMediaInstance.trackLinerTrackEvents[ butterTrackEvent.id ];

        if ( !trackLinerTrackEvent ) {

          var corn = butterTrackEvent.popcornOptions,
              start = corn.start,
              end = corn.end,
              width = Math.max( 3, ( end - start ) / currentMediaInstance.duration * trackLinerTrack.getElement().offsetWidth ),
              left = start / currentMediaInstance.duration * trackLinerTrack.getElement().offsetWidth;

          trackLinerTrackEvent = trackLinerTrack.createTrackEvent({
            width: width,
            left: left,
            innerHTML: butterTrackEvent.type
          });

          currentMediaInstance.trackLinerTrackEvents[ butterTrackEvent.id ] = trackLinerTrackEvent;
          currentMediaInstance.butterTrackEvents[ trackLinerTrackEvent.element.id ] = butterTrackEvent;

          trackLinerTrack.addTrackEvent( trackLinerTrackEvent );
        }

        butter.targettedEvent = butterTrackEvent;
      });

      butter.listen( "trackeventremoved", function( event ) {

        var trackEvent = event.data,
            trackLinerTrackEvent = currentMediaInstance.trackLinerTrackEvents[ trackEvent.id ],
            trackLinerTrack = currentMediaInstance.trackLine.getTrack( trackLinerTrackEvent.trackId );

        trackLinerTrack && trackLinerTrack.removeTrackEvent( trackLinerTrackEvent.element.id );

        delete currentMediaInstance.butterTrackEvents[ trackLinerTrackEvent.element.id ];
        delete currentMediaInstance.trackLinerTrackEvents[ trackEvent.id ];
      });

      butter.listen( "mediaadded", function( event ) {
        
        mediaInstances[ event.data.id ] = new MediaInstance( event.data );

        function mediaChanged( event ) {

          if ( currentMediaInstance !== mediaInstances[ event.data.id ] ) {

            currentMediaInstance && currentMediaInstance.hide();
            currentMediaInstance = mediaInstances[ event.data.id ];
            currentMediaInstance && currentMediaInstance.show();
            butter.dispatch( "timelineready", {}, "timeline" );
          }
        }

        function mediaReady ( event ) {

          var mi = mediaInstances[ event.data.id ];

          if ( !mi.initialized ) {

            mi.init();
            
            var media = event.data,
                tracks = media.tracks;
            
            for ( var i = 0, tlength = tracks.length; i < tlength; i++ ) {

              var t = tracks[ i ],
                  trackEvents = t.trackEvents;
              
              addTrack( t );
              
              for ( var j = 0, teLength = trackEvents.length; j < teLength; j++ ) {

                addTrackEvent( trackEvents [ j ] );
              } // add Track Events per Track
            } //add Tracks

            butter.dispatch( "timelineready", {}, "timeline" );
          }
        };

        function mediaRemoved( event ) {
        
          if ( mediaInstances[ event.data.id ] ) {

            mediaInstances[ event.data.id ].destroy();
          }

          delete mediaInstances[ event.data.id ];

          if ( currentMediaInstance && ( event.data.id === currentMediaInstance.media.id ) ) {

            currentMediaInstance = undefined;
          }

          butter.unlisten( "mediachanged", mediaChanged );
          butter.unlisten( "mediaremoved", mediaRemoved );
          butter.unlisten( "mediaready", mediaReady );
        }

        butter.listen( "mediachanged", mediaChanged );
        butter.listen( "mediaremoved", mediaRemoved );
        butter.listen( "mediaready", mediaReady );
      });


      butter.listen( "trackeventupdated", function( e ) {

        // accounting for new events changed from butter
        var butterTrackEvent = e.data
            trackLinerTrackEvent = currentMediaInstance.trackLinerTrackEvents[ butterTrackEvent.id ],
            corn = butterTrackEvent.popcornOptions,
            start = corn.start,
            end = corn.end;

        trackLinerTrackEvent.options.left = start / currentMediaInstance.duration * target.offsetWidth;
        trackLinerTrackEvent.options.width = Math.max( 3, ( end - start ) / currentMediaInstance.duration * target.offsetWidth );

        currentMediaInstance.trackLine.getTrack( trackLinerTrackEvent.trackId ).updateTrackEvent( trackLinerTrackEvent );
      });

      this.currentTimeInPixels = function( pixel ) {

        if ( pixel != null) {

          butter.currentTime = pixel / currentMediaInstance.container.offsetWidth * currentMediaInstance.duration;
          butter.dispatch( "mediatimeupdate", currentMediaInstance.media, "timeline" );
        } //if

        return butter.currentTime / currentMediaInstance.duration * ( currentMediaInstance.container.offsetWidth );
      };

      var trackLinerEvent,
          butterTrackEvent,
          start,
          end,
          corn,
          originalWidth = target.offsetWidth,
          currentZoom = 1;

      this.zoom = function( detail ) {

        if ( originalWidth === 0 ) {

          //in case target is invisible or something first
          originalWidth = target.offsetWidth;
        }

        if ( detail < 0 && currentZoom < 6 ) {

          currentZoom++;
        } else if ( detail > 0 && currentZoom > 1 ) {

          currentZoom--;
        }

        target.style.width = originalWidth * currentZoom + "px";

        for ( var i in currentMediaInstance.trackLinerTrackEvents ) {

          trackLinerEvent = currentMediaInstance.trackLinerTrackEvents[ i ];
          butterTrackEvent = currentMediaInstance.butterTrackEvents[ trackLinerEvent.element.id ];
          corn = butterTrackEvent.popcornOptions,
          start = corn.start;
          end = corn.end;

          trackLinerEvent.element.style.width = Math.max( 3, ( end - start ) / currentMediaInstance.duration * target.offsetWidth ) + "px";
          trackLinerEvent.element.style.left = start / currentMediaInstance.duration * target.offsetWidth + "px";
        }

        return currentZoom;
      };
    }; //Timeline

    return {
      name: "timeline",
      init: function( butter, options ) {

        return new Timeline( butter, options );
      }
    };
  }); //define
})();

