(function( Popcorn ) {

  // hack to load custom controls.
  // we monkey patch smart so we can gain access to p.media.
  // we build the controls on top of p.media.
  // we also need to run this script before DOMContentLoaded,
  // and after popcorn is loaded. This is why it is in the body.
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
        volume, volumeProgressBar, volumeScrubber, position,
        // functions
        bigPlayClicked, activate, deactivate, volumechange,
        togglePlay, timeMouseMove, timeMouseUp,
        timeMouseDown, volumeMouseMove, volumeMouseUp,
        volumeMouseDown, durationchange, mutechange;

    var ready = function() {

      p.media.removeEventListener( "loadedmetadata", ready, false );

      muteButton = document.getElementById( "controls-mute" );
      playButton = document.getElementById( "controls-play" );
      currentTimeDialog = document.getElementById( "controls-currenttime" );
      durationDialog = document.getElementById( "controls-duration" );
      timebar = document.getElementById( "controls-timebar" );
      progressBar = document.getElementById( "controls-progressbar" );
      bigPlayButton = document.getElementById( "controls-big-play-button" );
      scrubber = document.getElementById( "controls-scrubber" );
      volume = document.getElementById( "controls-volume" );
      volumeProgressBar = document.getElementById( "controls-volume-progressbar" );
      volumeScrubber = document.getElementById( "controls-volume-scrubber" );
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
          if ( p.paused ) {

            p.play();
          }
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
        if ( !seeking ) {

          controls.classList.remove( "controls-active" );
        }
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

        mutechange = function() {

          if ( p.muted() ) {

            muteButton.classList.remove( "controls-unmuted" );
            muteButton.classList.add( "controls-muted" );
          } else {

            muteButton.classList.remove( "controls-muted" );
            muteButton.classList.add( "controls-unmuted" );
          }
        };

        p.on( "volumechange", mutechange );
        mutechange();
      }

      if ( volume ) {

        volumeMouseMove = function( e ) {

          e.preventDefault();

          position = e.clientX - volume.getBoundingClientRect().left;

          if ( position <= 0 ) {

            p.mute();
            position = 0;
          } else if ( position > volume.offsetWidth ) {

            position = volume.offsetWidth;
          } else if ( p.muted() ) {

            p.unmute();
          }

          if ( volumeProgressBar ) {

            volumeProgressBar.style.width = ( position / volume.offsetWidth * 100 ) + "%";
          }

          if ( volumeScrubber ) {

            volumeScrubber.style.left = ( ( position - ( volumeScrubber.offsetWidth / 2 ) ) / volume.offsetWidth * 100 ) + "%";
          }

          p.volume( position / volume.offsetWidth );
        };

        volumeMouseUp = function( e ) {

          if ( e.button !== 0 ) {

            return;
          }

          e.preventDefault();
          window.removeEventListener( "mouseup", volumeMouseUp, false );
          window.removeEventListener( "mousemove", volumeMouseMove, false );
        };

        volumeMouseDown = function( e ) {

          if ( e.button !== 0 ) {

            return;
          }

          position = e.clientX - volume.getBoundingClientRect().left;

          e.preventDefault();
          window.addEventListener( "mouseup", volumeMouseUp, false );
          window.addEventListener( "mousemove", volumeMouseMove, false );

          if ( position === 0 ) {

            p.mute();
          } else if ( p.muted() ) {

            p.unmute();
          }

          if ( volumeProgressBar ) {

            volumeProgressBar.style.width = ( position / volume.offsetWidth * 100 ) + "%";
          }

          if ( volumeScrubber ) {

            volumeScrubber.style.left = ( ( position - ( volumeScrubber.offsetWidth / 2 ) ) / volume.offsetWidth * 100 ) + "%";
          }

          p.volume( position / volume.offsetWidth );
        };

        volume.addEventListener( "mousedown", volumeMouseDown, false );

        volumechange = function() {

          var width;

          if ( p.muted() ) {

            width = 0;
          } else {

            width = p.volume() * volume.offsetWidth;
          }

          if ( width === 0 ) {

            if ( muteButton ) {

              muteButton.classList.remove( "controls-unmuted" );
              muteButton.classList.add( "controls-muted" );
            }
          }

          if ( volumeProgressBar ) {

            volumeProgressBar.style.width = ( width / volume.offsetWidth * 100 ) + "%";
          }

          if ( volumeScrubber ) {

            volumeScrubber.style.left = ( ( width - ( volumeScrubber.offsetWidth / 2 ) ) / volume.offsetWidth * 100 ) + "%";
          }
        };

        p.on( "volumechange", volumechange );

        // fire to get and set initially volume slider position
        volumechange();
      }

      if ( durationDialog ) {

        durationchange = function() {

          var timeStamp = new Date( 1970, 0, 1 ),
              time = p.duration(),
              seconds;

          timeStamp.setSeconds( Math.round( time ) );
          seconds = timeStamp.toTimeString().substr( 0, 8 );

          durationDialog.innerHTML = seconds;
        };

        durationchange();
      }

      if ( timebar ) {

        timeMouseMove = function( e ) {

          e.preventDefault();

          position = e.clientX - timebar.getBoundingClientRect().left;

          if ( position < 0 ) {

            position = 0;
          } else if ( position > timebar.offsetWidth ) {

            position = timebar.offsetWidth;
          }

          if ( progressBar ) {

            progressBar.style.width = ( position / timebar.offsetWidth * 100 ) + "%";
          }

          if ( scrubber ) {

            scrubber.style.left = ( ( position - ( scrubber.offsetWidth / 2 ) ) / timebar.offsetWidth * 100 ) + "%";
          }

          p.currentTime( position / timebar.offsetWidth * 100 * p.duration() / 100 );
        };

        timeMouseUp = function( e ) {

          if ( e.button !== 0 ) {

            return;
          }

          e.preventDefault();
          seeking = false;
          if ( !active ) {

            deactivate();
          }
          
          if ( playStateCache ) {

            p.play();
          }
          window.removeEventListener( "mouseup", timeMouseUp, false );
          window.removeEventListener( "mousemove", timeMouseMove, false );
        };

        timeMouseDown = function( e ) {

          if ( e.button !== 0 ) {

            return;
          }

          position = e.clientX - timebar.getBoundingClientRect().left;

          e.preventDefault();
          seeking = true;
          playStateCache = !p.paused();
          p.pause();
          window.addEventListener( "mouseup", timeMouseUp, false );
          window.addEventListener( "mousemove", timeMouseMove, false );

          if ( progressBar ) {

            progressBar.style.width = ( position / timebar.offsetWidth * 100 ) + "%";
          }

          if ( scrubber ) {

            scrubber.style.left = ( ( position - ( scrubber.offsetWidth / 2 ) ) / timebar.offsetWidth * 100 ) + "%";
          }

          p.currentTime( position / timebar.offsetWidth * 100 * p.duration() / 100 );
        };

        timebar.addEventListener( "mousedown", timeMouseDown, false );

        p.on( "timeupdate", function() {

          var timeStamp = new Date( 1970, 0, 1 ),
              time = p.currentTime(),
              seconds,
              width = ( time / p.duration() * 100 * timebar.offsetWidth / 100 );

          if ( progressBar ) {

            progressBar.style.width = ( width / timebar.offsetWidth * 100 ) + "%";
          }

          if ( scrubber ) {

            scrubber.style.left = ( ( width - ( scrubber.offsetWidth / 2 ) ) / timebar.offsetWidth * 100 ) + "%";
          }

          timeStamp.setSeconds( Math.round( time ) );
          seconds = timeStamp.toTimeString().substr( 0, 8 );

          if ( currentTimeDialog ) {

            currentTimeDialog.innerHTML = seconds;
          }
        });
      }
    };

    if ( !controls ) {

      return p;
    }

    if ( p.readyState() >= 1 ) {

      ready();
    } else {

      p.media.addEventListener( "loadedmetadata", ready, false );
    }

    return p;
  };
}( window.Popcorn ));

