(function( Popcorn ) {

  // hack to load custom controls.
  // we monkey patch smart so we can gain access to p.media.
  // we build the controls on top of p.media.
  // we also need to run this script before DOMContentLoaded,
  // and after popcorn is loaded. This is why it is in the body.
  // deal with it.
  if ( !Popcorn ) {

    return;
  }

  var smart = Popcorn.smart;

  Popcorn.smart = function() {

    var p = smart.apply( null, arguments ),
        controls = document.getElementById( "butter-controls" ),
        // variables
        muteButton, playButton, currentTimeDialog,
        durationDialog, timebar, progressBar, bigPlayButton,
        scrubber, seeking, playStateCache, active,
        // functions
        bigPlayClicked, activate, deactivate,
        togglePlay, mouseMove, mouseUp, mouseDown;

    if ( !controls ) {

      return p;
    }

    muteButton = document.getElementById( "controls-mute" );
    playButton = document.getElementById( "controls-play" );
    currentTimeDialog = document.getElementById( "controls-currenttime" );
    durationDialog = document.getElementById( "controls-duration" );
    timebar = document.getElementById( "controls-timebar" );
    progressBar = document.getElementById( "controls-progressbar" );
    bigPlayButton = document.getElementById( "controls-big-play-button" );
    scrubber = document.getElementById( "controls-scrubber" );
    seeking = false;
    playStateCache = false;
    active = false;

    p.controls( false );

    if ( bigPlayButton ) {

      bigPlayButton.classList.add( "controls-ready" );

      bigPlayClicked = function() {

        p.media.removeEventListener( "play", bigPlayClicked, false );
        bigPlayButton.removeEventListener( "mouseup", bigPlayClicked, false );
        bigPlayButton.classList.remove( "controls-ready" );
        p.media.addEventListener( "mouseover", activate, false );
        p.paused && p.play();
      };

      bigPlayButton.addEventListener( "mouseup", bigPlayClicked, false );
      p.media.addEventListener( "play", bigPlayClicked, false );
    }

    controls.classList.add( "controls-ready" );

    activate = function() {

      active = true;
      controls.classList.add( "controls-active" );
    };

    deactivate = function() {

      active = false;
      !seeking && controls.classList.remove( "controls-active" );
    };

    p.media.addEventListener( "mouseout", deactivate, false );
    controls.addEventListener( "mouseover", activate, false );
    controls.addEventListener( "mouseout", deactivate, false );

    togglePlay = function( e ) {

      if ( e.button !== 0 ) {

        return;
      }

      if ( p.paused() ) {

        p.play();
      } else {

        p.pause();
      }
    };

    p.media.addEventListener( "mouseup", togglePlay, false );

    if ( playButton ) {

      playButton.addEventListener( "mouseup", togglePlay, false );

      p.on( "play", function() {

        playButton.classList.remove( "controls-paused" );
        playButton.classList.add( "controls-playing" );
      });
      p.on( "pause", function() {

        playButton.classList.remove( "controls-playing" );
        playButton.classList.add( "controls-paused" );
      });
    }

    if ( muteButton ) {

      muteButton.addEventListener( "mouseup", function( e ) {

        if ( e.button !== 0 ) {

          return;
        }

        if ( p.muted() ) {

          p.unmute();
        } else {

          p.mute();
        }
      }, false );

      p.on( "volumechange", function() {

        if ( p.muted() ) {

          muteButton.classList.remove( "controls-unmuted" );
          muteButton.classList.add( "controls-muted" );
        } else {

          muteButton.classList.remove( "controls-muted" );
          muteButton.classList.add( "controls-unmuted" );
        }
      });
    }

    if ( durationDialog ) {

      p.on( "durationchange", function() {

        var timeStamp = new Date( 1970, 0, 1 ),
            time = p.duration(),
            seconds;

        timeStamp.setSeconds( Math.round( time ) );
        seconds = timeStamp.toTimeString().substr( 0, 8 );

        durationDialog.innerHTML = seconds;
      });
    }

    if ( timebar ) {

      mouseMove = function( e ) {

        var position = e.clientX - timebar.getBoundingClientRect().left;

        e.preventDefault();

        if ( position < 0 ) {

          position = 0;
        } else if ( position > timebar.offsetWidth ) {

          position = timebar.offsetWidth;
        }

        if ( progressBar ) {

          progressBar.style.width = position + "px";
        }

        if ( scrubber ) {

          scrubber.style.left = position - ( scrubber.offsetWidth / 2 ) + "px";
        }

        p.currentTime( position / timebar.offsetWidth * 100 * p.duration() / 100 );
      };

      mouseUp = function( e ) {

        if ( e.button !== 0 ) {

          return;
        }

        e.preventDefault();
        seeking = false;
        !active && deactivate();
        playStateCache && p.play();
        window.removeEventListener( "mouseup", mouseUp, false );
        window.removeEventListener( "mousemove", mouseMove, false );
      };

      mouseDown = function( e ) {

        var position = e.clientX - timebar.getBoundingClientRect().left;

        if ( e.button !== 0 ) {

          return;
        }

        e.preventDefault();
        seeking = true;
        playStateCache = !p.paused();
        p.pause();
        window.addEventListener( "mouseup", mouseUp, false );
        window.addEventListener( "mousemove", mouseMove, false );

        if ( progressBar ) {

          progressBar.style.width = position + "px";
        }

        if ( scrubber ) {

          scrubber.style.left = position - ( scrubber.offsetWidth / 2 ) + "px";
        }

        p.currentTime( position / timebar.offsetWidth * 100 * p.duration() / 100 );
      };

      timebar.addEventListener( "mousedown", mouseDown, false );

      p.on( "timeupdate", function() {

        var timeStamp = new Date( 1970, 0, 1 ),
            time = p.currentTime(),
            seconds,
            width = ( time / p.duration() * 100 * timebar.offsetWidth / 100 );

        if ( progressBar ) {

          progressBar.style.width = width + "px";
        }

        if ( scrubber ) {

          scrubber.style.left = width - ( scrubber.offsetWidth / 2 ) + "px";
        }

        timeStamp.setSeconds( Math.round( time ) );
        seconds = timeStamp.toTimeString().substr( 0, 8 );

        if ( currentTimeDialog ) {

          currentTimeDialog.innerHTML = seconds;
        }
      });
    }

    return p;
  };
}( window.Popcorn ));

