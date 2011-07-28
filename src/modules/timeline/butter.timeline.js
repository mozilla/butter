Butter.registerModule( "timeline", {
  setup: function( options ) {

    // Convert an SMPTE timestamp to seconds
    var smpteToSeconds = function( smpte ) {
      var t = smpte.split(":");

      if ( t.length === 1 ) {
        return parseFloat( t[0], 10 );
      }

      if (t.length === 2) {
        return parseFloat( t[0], 10 ) + parseFloat( t[1] / 12, 10 );
      }

      if (t.length === 3) {
        return parseInt( t[0] * 60, 10 ) + parseFloat( t[1], 10 ) + parseFloat( t[2] / 12, 10 );
      }

      if (t.length === 4) {
        return parseInt( t[0] * 3600, 10 ) + parseInt( t[1] * 60, 10 ) + parseFloat( t[2], 10 ) + parseFloat( t[3] / 12, 10 );
      }
    },
    secondsToSMPTE = function( time ) {

      var timeStamp = new Date( 1970,0,1 ),
          seconds;

      timeStamp.setSeconds( time );

      seconds = timeStamp.toTimeString().substr( 0, 8 );

      if ( seconds > 86399 )  {

        seconds = Math.floor( (timeStamp - Date.parse("1/1/70") ) / 3600000) + seconds.substr(2);

      }
      return seconds;
    };

    var scrubberClicked = false,
        scrollLeft = 0;

    var MediaInstance = function( media ) {

      // capturing self to be used inside element event listeners
      var self = this;

      this.container = document.createElement( "div" );
      this.container.style.width = "100%";
      this.container.style.position = "relative";
      this.container.style.MozUserSelect = "none";
      this.container.style.webkitUserSelect = "none";
      this.container.style.oUserSelect = "none";
      this.container.style.userSelect = "none";

      target.appendChild( this.container );

      this.tracks = document.createElement( "div" );
      this.tracks.style.width = "100%";

      this.init = function() {

        this.duration = b.duration();

        this.trackLine = new TrackLiner({
          element: this.tracks,
          dynamicTrackCreation: true,
          scale: 1,
          duration: this.duration, // to do. get this from the media
          restrictToKnownPlugins: true
        });

        //this.lastTrack;
        this.butterTracks = {};
        this.trackLinerTracks = {};
        this.butterTrackEvents = {};
        this.trackLinerTrackEvents = {};

        this.timeline = document.createElement( "canvas" );
        this.timeline.style.height = "25px";
        this.timeline.style.width = this.container.offsetWidth + "px";
        this.timeline.height = "25";
        this.timeline.width = this.container.offsetWidth;

        this.scrubber = document.createElement( "div" );
        this.scrubber.style.height = "100%";
        this.scrubber.style.width = "1px";
        this.scrubber.style.position = "absolute";
        this.scrubber.style.top = "0";
        this.scrubber.style.left = "0";
        this.scrubber.style.zIndex = this.timeline.style.zIndex + 1;
        this.scrubber.style.backgroundColor = "red";

        this.userInteract = document.createElement( "div" );
        this.userInteract.style.position = "absolute";
        this.userInteract.style.top = "0";
        this.userInteract.style.left = "0";
        this.userInteract.style.height = this.timeline.style.height;
        this.userInteract.style.width = "100%";
        this.userInteract.style.zIndex = this.scrubber.style.zIndex + 1;

        this.userInteract.addEventListener( "mousemove", function( event ) {

          scrollLeft = event.rangeParent.scrollLeft;
        }, false );
        this.userInteract.addEventListener( "mousedown", function( event ) {

          scrubberClicked = true;
          self.scrubber.style.left = ( event.pageX - ( self.container.offsetLeft - event.rangeParent.scrollLeft ) );
          b.currentTime( ( event.pageX - ( self.container.offsetLeft - scrollLeft ) + self.container.scrollLeft ) / self.container.offsetWidth * this.duration );
        }, false );

        this.container.appendChild( this.scrubber );
        this.container.appendChild( this.userInteract );
        this.container.appendChild( this.timeline );
        this.container.appendChild( this.tracks );

        var context = this.timeline.getContext( "2d" ),
            inc = this.container.offsetWidth / this.duration / 4,
            heights = [ 10, 4, 7, 4 ],
            textWidth = context.measureText( secondsToSMPTE( 5 ) ).width,
            lastTimeDisplayed = -textWidth / 2;

        // translate will make the time ticks thin
        context.translate( 0.5, 0.5 );
        context.beginPath();

        for ( var i = 1, l = this.duration * 4; i < l; i++ ) {

          var position = i * inc;

          context.moveTo( -~position, 0 );
          context.lineTo( -~position, heights[ i % 4 ] );

          if ( i % 4 === 0 && ( position - lastTimeDisplayed ) > textWidth ) {

            lastTimeDisplayed = position;
            context.fillText( secondsToSMPTE( i / 4 ), -~position - ( textWidth / 2 ), 21 );
          }
        }
        context.stroke();
        context.closePath();
      };

      this.hide = function() {

        this.container.style.display = "none";
      };

      this.show = function() {

        this.container.style.display = "block";
      };
    };

    var mediaInstances = [],
        currentMediaInstance,
        target = document.getElementById( options.target ) || options.target,
        b = this;

    TrackLiner.plugin( "butterapp", {
      // called when a new track is created
      setup: function( track, trackEventObj, event, ui ) {

        // setup for data-trackliner-type
        if ( ui ) {

          var trackLinerTrack = track;

          // if the track is not registered in butter
          // remove it, and call b.addTrack
          if ( !currentMediaInstance.butterTracks[ track.id() ] ) {

            currentMediaInstance.trackLine.removeTrack( trackLinerTrack );

            b.addTrack( new Butter.Track() );
            trackLinerTrack = currentMediaInstance.lastTrack;
          }
          currentMediaInstance.lastTrack = trackLinerTrack;

          var start = trackEventObj.left / currentMediaInstance.container.offsetWidth * currentMediaInstance.duration,
              end = start + 4;

          b.addTrackEvent( currentMediaInstance.butterTracks[ currentMediaInstance.lastTrack.id() ], new Butter.TrackEvent({ popcornOptions: {start: start, end: end }, type: ui.draggable[ 0 ].id }) );
        // setup for createTrackEvent()
        } else {

          var start = trackEventObj.popcornOptions.start,
              end = trackEventObj.popcornOptions.end,
              width = ( end - start ) / currentMediaInstance.duration * track.getElement().offsetWidth,
              left = start / currentMediaInstance.duration * track.getElement().offsetWidth;

          return { left: left, innerHTML: trackEventObj.type, width: width };
        }
      },
      // called when an existing track is moved
      moved: function( track, trackEventObj, event, ui ) {

        var trackLinerTrack = track;

        trackEventObj.options.popcornOptions.start = trackEventObj.element.offsetLeft / currentMediaInstance.container.offsetWidth * currentMediaInstance.duration;
        trackEventObj.options.popcornOptions.end = ( trackEventObj.element.offsetLeft + trackEventObj.element.offsetWidth ) / currentMediaInstance.container.offsetWidth * currentMediaInstance.duration;

        // if the track is not registered in butter
        // remove it, and call b.addTrack
        if ( !currentMediaInstance.butterTracks[ track.id() ] ) {

          currentMediaInstance.trackLine.removeTrack( trackLinerTrack );

          b.addTrack( new Butter.Track() );
          trackLinerTrack = currentMediaInstance.lastTrack;
          trackLinerTrack.addTrackEvent( trackEventObj );
        }
        currentMediaInstance.lastTrack = trackLinerTrack;

        b.trigger( "trackeventupdated", trackEventObj.options );
      },
      // called when a track event is clicked
      click: function ( track, trackEventObj, event, ui ) {},
      // called when a track event is double clicked
      dblclick: function( track, trackEventObj, event, ui ) {

        b.editTrackEvent && b.editTrackEvent( trackEventObj.options );
      }
    });

    document.addEventListener( "mousemove", function( event ) {

      if ( scrubberClicked ) {

        if ( event.pageX > ( currentMediaInstance.container.offsetLeft - scrollLeft ) && event.pageX < ( ( currentMediaInstance.container.offsetLeft - scrollLeft ) + currentMediaInstance.container.offsetWidth ) ) {

          currentMediaInstance.scrubber.style.left = ( event.pageX - ( currentMediaInstance.container.offsetLeft - scrollLeft ) );
          b.currentTime( ( event.pageX - ( currentMediaInstance.container.offsetLeft - scrollLeft ) + currentMediaInstance.container.scrollLeft ) / currentMediaInstance.container.offsetWidth * currentMediaInstance.duration );
        } else {

          if ( event.pageX <= ( currentMediaInstance.container.offsetLeft - scrollLeft ) ) {

            currentMediaInstance.scrubber.style.left = 0;
            b.currentTime( 0 );
          } else {

            currentMediaInstance.scrubber.style.left = currentMediaInstance.container.offsetWidth;
            b.currentTime( currentMediaInstance.duration );
          }
        }
      }
    }, false );
    document.addEventListener( "mouseup", function() {

      scrubberClicked = false;
    }, false );

    this.listen( "timeupdate", function() {

      currentMediaInstance.scrubber.style.left = b.currentTime() / currentMediaInstance.duration * currentMediaInstance.container.offsetWidth;
    });

    this.listen( "trackadded", function( event ) {

      var track = event.data;
      var trackLinerTrack = currentMediaInstance.trackLine.createTrack();
      currentMediaInstance.trackLinerTracks[ track.getId() ] = trackLinerTrack;
      currentMediaInstance.lastTrack = trackLinerTrack;
      currentMediaInstance.butterTracks[ trackLinerTrack.id() ] = track;
    });

    this.listen( "trackremoved", function( event ) {

      var track = event.data;
      var trackLinerTrack = currentMediaInstance.trackLinerTracks[ track.getId() ],
          trackEvents = trackLinerTrack.getTrackEvents(),
          trackEvent;
      for ( trackEvent in trackEvents ) {
        if ( trackEvents.hasOwnProperty( trackEvent ) ) {
          b.removeTrackEvent( track, currentMediaInstance.butterTrackEvents[ trackEvents[ trackEvent ].element.id ] );
        }
      }
      currentMediaInstance.trackLine.removeTrack( trackLinerTrack );
      delete currentMediaInstance.butterTracks[ trackLinerTrack.id() ];
      delete currentMediaInstance.trackLinerTracks[ track.getId() ];
    });

    this.listen( "trackeventadded", function( event ) {

      var trackEvent = event.data;
      var trackLinerTrackEvent = currentMediaInstance.lastTrack.createTrackEvent( "butterapp", trackEvent );
      currentMediaInstance.trackLinerTrackEvents[ trackEvent.getId() ] = trackLinerTrackEvent;
      currentMediaInstance.butterTrackEvents[ trackLinerTrackEvent.element.id ] = trackEvent;
    });

    this.listen( "trackeventremoved", function( event ) {

      var trackEvent = event.data;
      var trackLinerTrackEvent = currentMediaInstance.trackLinerTrackEvents[ trackEvent.getId() ],
          trackLinerTrack = currentMediaInstance.trackLine.getTrack( trackLinerTrackEvent.trackId );
      currentMediaInstance.lastTrack = trackLinerTrack;
      trackLinerTrack && trackLinerTrack.removeTrackEvent( trackLinerTrackEvent.element.id );
      delete currentMediaInstance.butterTrackEvents[ trackLinerTrackEvent.element.id ];
      delete currentMediaInstance.trackLinerTrackEvents[ trackEvent.getId() ];
    });

    this.listen( "mediaadded", function( event ) {

      mediaInstances[ event.data.getId() ] = new MediaInstance( event.data );
    });

    this.listen( "mediaready", function( event ) {

      mediaInstances[ event.data.getId() ].init();
    });

    this.listen( "mediachanged", function( event ) {

      currentMediaInstance && currentMediaInstance.hide();
      currentMediaInstance = mediaInstances[ event.data.getId() ];
      currentMediaInstance && currentMediaInstance.show();
    });

    this.listen( "mediaremoved", function( event ) {

      delete mediaInstances[ event.data.getId() ];
    });

    this.listen( "trackeventupdated", function( event ) {

      var trackEvent = event.data;
      var trackLinerTrackEvent = currentMediaInstance.trackLinerTrackEvents[ trackEvent.getId() ];
          trackLinerTrack = currentMediaInstance.trackLine.getTrack( trackLinerTrackEvent.trackId );
      delete currentMediaInstance.butterTrackEvents[ trackLinerTrackEvent.element.id ];
      trackLinerTrack.removeTrackEvent( trackLinerTrackEvent.element.id );
      trackLinerTrackEvent = trackLinerTrack.createTrackEvent( "butterapp", trackEvent );
      currentMediaInstance.butterTrackEvents[ trackLinerTrackEvent.element.id ] = trackEvent;
      currentMediaInstance.trackLinerTrackEvents[ trackEvent.getId() ] = trackLinerTrackEvent;
    });
  }
});

