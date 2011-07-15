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

    var container = document.createElement( "div" ),
        tracks = document.createElement( "div" ),
        target = document.getElementById( options.target ) || options.target,
        trackLine = new TrackLiner({
          element: tracks,
          dynamicTrackCreation: true,
          scale: 1,
          duration: options.duration,
          restrictToKnownPlugins: true
        }),
        lastTrack,
        butterTracks = {},
        trackLinerTracks = {},
        butterTrackEvents = {},
        trackLinerTrackEvents = {},
        b = this;

    container.style.width = "100%";
    container.style.position = "relative";
    tracks.style.width = "100%";
    target.appendChild( container );

    trackLine.plugin( "butterapp", {
      // called when a new track is created
      setup: function( track, trackEventObj, event, ui ) {

        // setup for data-trackliner-type
        if ( ui ) {

          var trackLinerTrack = track;

          // if the track is not registered in butter
          // remove it, and call b.addTrack
          if ( !butterTracks[ track.id() ] ) {

            trackLine.removeTrack( trackLinerTrack );

            b.addTrack( new Butter.Track() );
            trackLinerTrack = lastTrack;
          }
          lastTrack = trackLinerTrack;

          var start = trackEventObj.left / container.offsetWidth * options.duration,
              end = start + 4;

          b.addTrackEvent( butterTracks[ lastTrack.id() ], new Butter.TrackEvent({ popcornOptions: {start: start, end: end }, type: ui.draggable[ 0 ].id }) );
        // setup for createTrackEvent()
        } else {

          var start = trackEventObj.popcornOptions.start,
              end = trackEventObj.popcornOptions.end,
              width = ( end - start ) / options.duration * track.getElement().offsetWidth,
              left = start / options.duration * track.getElement().offsetWidth;

          return { left: left, innerHTML: trackEventObj.type, width: width };
        }
      },
      // called when an existing track is moved
      moved: function( track, trackEventObj, event, ui ) {

        var trackLinerTrack = track;

        trackEventObj.options.popcornOptions.start = trackEventObj.element.offsetLeft / container.offsetWidth * options.duration;
        trackEventObj.options.popcornOptions.end = ( trackEventObj.element.offsetLeft + trackEventObj.element.offsetWidth ) / container.offsetWidth * options.duration;

        // if the track is not registered in butter
        // remove it, and call b.addTrack
        if ( !butterTracks[ track.id() ] ) {

          trackLine.removeTrack( trackLinerTrack );

          b.addTrack( new Butter.Track() );
          trackLinerTrack = lastTrack;
        }
        lastTrack = trackLinerTrack;

        b.addTrackEvent( butterTracks[ trackLinerTrack.id() ], new Butter.TrackEvent( trackEventObj.options ) );
        b.removeTrackEvent( butterTracks[ trackLinerTrack.id() ], trackEventObj.options );
      },
      // called when a track event is clicked
      click: function ( track, trackEventObj, event, ui ) {},
      // called when a track event is double clicked
      dblclick: function( track, trackEventObj, event, ui ) {

        b.editTrackEvent && b.editTrackEvent( trackEventObj.options );
      }
    });

    var scrubberClicked = false;

    var scrubber = document.createElement( "div" );
    scrubber.style.height = "100%";
    scrubber.style.width = "1px";
    scrubber.style.position = "absolute";
    scrubber.style.top = "0";
    scrubber.style.left = "0";
    scrubber.style.zIndex = "9000";
    scrubber.style.backgroundColor = "red";

    var timeline = document.createElement( "canvas" );
    timeline.style.height = "25px";
    timeline.style.width = container.offsetWidth + "px";
    timeline.height = "25";
    timeline.width = container.offsetWidth;

    var context = timeline.getContext( "2d" ),
        inc = container.offsetWidth / options.duration / 4,
        heights = [ 10, 4, 7, 4 ],
        textWidth = context.measureText( secondsToSMPTE( 5 ) ).width,
        lastTimeDisplayed = -textWidth / 2;

    // translate will make the time ticks thin
    //context.translate( 0.5, 0.5 );
    context.beginPath();

    for ( var i = 1, l = options.duration * 4; i < l; i++ ) {

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

    var userInteract = document.createElement( "div" );
    userInteract.style.position = "absolute";
    userInteract.style.top = "0";
    userInteract.style.left = "0";
    userInteract.style.height = timeline.style.height;
    userInteract.style.width = "100%";
    userInteract.style.zIndex = "9001";
    container.style.MozUserSelect = "none";
    container.style.webkitUserSelect = "none";
    container.style.oUserSelect = "none";
    container.style.userSelect = "none";

    var scrollLeft = 0;

    document.addEventListener( "mousemove", function( event ) {

      if ( scrubberClicked ) {

        if ( event.pageX > ( container.offsetLeft - scrollLeft ) && event.pageX < ( ( container.offsetLeft - scrollLeft ) + container.offsetWidth ) ) {

          scrubber.style.left = ( event.pageX - ( container.offsetLeft - scrollLeft ) );
          b.currentTime( ( event.pageX - ( container.offsetLeft - scrollLeft ) + container.scrollLeft ) / container.offsetWidth * options.duration );
        } else {

          if ( event.pageX <= ( container.offsetLeft - scrollLeft ) ) {

            scrubber.style.left = 0;
            b.currentTime( 0 );
          } else {

            scrubber.style.left = container.offsetWidth;
            b.currentTime( options.duration );
          }
        }
      }
    }, false );
    userInteract.addEventListener( "mousemove", function( event ) {

      scrollLeft = event.rangeParent.scrollLeft;
    }, false );
    userInteract.addEventListener( "mousedown", function( event ) {

      scrubberClicked = true;
      scrubber.style.left = ( event.pageX - ( container.offsetLeft - event.rangeParent.scrollLeft ) );
      b.currentTime( ( event.pageX - ( container.offsetLeft - scrollLeft ) + container.scrollLeft ) / container.offsetWidth * options.duration );
    }, false );
    document.addEventListener( "mouseup", function() {

      scrubberClicked = false;
    }, false );

    container.appendChild( scrubber );
    container.appendChild( userInteract );
    container.appendChild( timeline );
    container.appendChild( tracks );

    this.listen( "trackeventadded", function( trackEvent ) {

      var trackLinerTrackEvent = lastTrack.createTrackEvent( "butterapp", trackEvent );
      trackLinerTrackEvents[ trackEvent.getId() ] = trackLinerTrackEvent;
      butterTrackEvents[ trackLinerTrackEvent.element.id ] = trackEvent;
    });

    this.listen( "timeupdate", function() {

      scrubber.style.left = b.currentTime() / options.duration * container.offsetWidth;
    });

    this.listen( "trackadded", function( track ) {

      var trackLinerTrack = trackLine.createTrack();
      trackLinerTracks[ track.getId() ] = trackLinerTrack;
      lastTrack = trackLinerTrack;
      butterTracks[ trackLinerTrack.id() ] = track;
    });

    this.listen( "trackeventremoved", function( trackEvent ) {

      var trackLinerTrackEvent = trackLinerTrackEvents[ trackEvent.getId() ],
          trackLinerTrack = trackLine.getTrack( trackLinerTrackEvent.trackId );
      lastTrack = trackLinerTrack;
      trackLinerTrack && trackLinerTrack.removeTrackEvent( trackLinerTrackEvent.element.id );
      delete butterTrackEvents[ trackLinerTrackEvent.element.id ];
      delete trackLinerTrackEvents[ trackEvent.getId() ];
    });
  }
});

