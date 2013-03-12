/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "util/lang", "util/time", "text!layouts/controls.html" ],
  function( LangUtils, Time, CONTROLS_LAYOUT ) {

  function Controls( container, p, options ) {

    var LEFT_MOUSE_BUTTON = 0,
        SPACE_BAR = 32;

    var _controls = LangUtils.domFragment( CONTROLS_LAYOUT ).querySelector( "#butter-controls" ),
        _container = typeof container === "string" ? document.getElementById( container ) : container,
        // variables
        muteButton, playButton, currentTimeDialog, fullscreenButton,
        durationDialog, timebar, progressBar, bigPlayButton,
        scrubber, seeking, playStateCache, active,
        volume, volumeProgressBar, volumeScrubber, position,
        controlsShare, controlsRemix, controlsFullscreen, controlsLogo,
        // functions
        bigPlayClicked, activate, deactivate, volumechange,
        togglePlay, timeMouseMove, timeMouseUp,
        timeMouseDown, volumeMouseMove, volumeMouseUp,
        volumeMouseDown, durationchange, mutechange;

    // Deal with callbacks for various buttons in controls
    options = options || {};
    var nop = function(){},
        onShareClick = options.onShareClick || nop,
        onRemixClick = options.onRemixClick || nop,
        onFullscreenClick = options.onFullscreenClick || nop,
        onLogoClick = options.onLogoClick || nop;

    p.controls( false );
    _container.appendChild( _controls );

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
      fullscreenButton = document.getElementById( "controls-fullscreen" );
      volumeProgressBar = document.getElementById( "controls-volume-progressbar" );
      volumeScrubber = document.getElementById( "controls-volume-scrubber" );
      controlsShare = document.getElementById( "controls-share" );
      controlsRemix = document.getElementById( "controls-remix" );
      controlsFullscreen = document.getElementById( "controls-fullscreen" );
      controlsLogo = document.getElementById( "controls-logo" );
      seeking = false;
      playStateCache = false;
      active = false;

      // Wire custom callbacks for right-hand buttons
      controlsShare.addEventListener( "click", onShareClick, false );
      controlsRemix.addEventListener( "click", onRemixClick, false );
      controlsFullscreen.addEventListener( "click", onFullscreenClick, false );
      controlsLogo.addEventListener( "click", onLogoClick, false );

      if ( bigPlayButton ) {

        bigPlayButton.classList.add( "controls-ready" );

        bigPlayClicked = function() {

          p.media.removeEventListener( "play", bigPlayClicked, false );
          bigPlayButton.removeEventListener( "click", bigPlayClicked, false );
          bigPlayButton.classList.remove( "controls-ready" );
          p.media.addEventListener( "mouseover", activate, false );
          if ( p.paused() ) {
            p.play();
          }
        };

        bigPlayButton.addEventListener( "click", bigPlayClicked, false );
        p.media.addEventListener( "play", bigPlayClicked, false );
      }

      // this block is used to ensure that when the video is played on a mobile device that the controls and playButton overlay
      // are in the correct state when it begins playing
      if ( !p.paused() ) {
        if ( bigPlayButton ) {
          bigPlayClicked();
        }
        playButton.classList.remove( "controls-paused" );
        playButton.classList.add( "controls-playing" );
      }

      _controls.classList.add( "controls-ready" );

      activate = function() {

        active = true;
        _controls.classList.add( "controls-active" );
      };

      deactivate = function() {

        active = false;
        if ( !seeking ) {
          _controls.classList.remove( "controls-active" );
        }
      };

      p.media.addEventListener( "mouseout", deactivate, false );
      _controls.addEventListener( "mouseover", activate, false );
      _controls.addEventListener( "mouseout", deactivate, false );

      togglePlay = function( e ) {

        // Only continue if event was triggered by the left mouse button or the spacebar
        if ( e.button !== LEFT_MOUSE_BUTTON && e.which !== SPACE_BAR ) {
          return;
        }

        if ( p.paused() ) {

          p.play();
        } else {

          p.pause();
        }
      };

      p.media.addEventListener( "click", togglePlay, false );
      window.addEventListener( "keypress", togglePlay, false );

      if ( playButton ) {

        playButton.addEventListener( "click", togglePlay, false );

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

        muteButton.addEventListener( "click", function( e ) {

          if ( e.button !== 0 ) {

            return;
          }

          p[ p.muted() ? "unmute" : "mute" ]();
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

            width = p.volume();
          }

          if ( width === 0 ) {

            if ( muteButton ) {

              muteButton.classList.remove( "controls-unmuted" );
              muteButton.classList.add( "controls-muted" );
            }
          }

          if ( volumeProgressBar ) {

            volumeProgressBar.style.width = ( width * 100 ) + "%";
          }

          if ( volumeScrubber ) {

            volumeScrubber.style.left = ( ( width - ( volumeScrubber.offsetWidth / 2 ) ) * 100 ) + "%";
          }
        };

        p.on( "volumechange", volumechange );

        // fire to get and set initially volume slider position
        volumechange();
      }

      if ( durationDialog ) {

        durationchange = function() {
          durationDialog.innerHTML = Time.toTimecode( p.duration(), 0 );
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

          var time = p.currentTime(),
              width = ( time / p.duration() * 100 * timebar.offsetWidth / 100 );

          if ( progressBar ) {

            progressBar.style.width = ( width / timebar.offsetWidth * 100 ) + "%";
          }

          if ( scrubber ) {

            scrubber.style.left = ( ( width - ( scrubber.offsetWidth / 2 ) ) / timebar.offsetWidth * 100 ) + "%";
          }

          if ( currentTimeDialog ) {

            currentTimeDialog.innerHTML = Time.toTimecode( time, 0 );
          }
        });
      }
    };

    if ( !_container ) {

      return;
    }

    if ( p.readyState() >= 1 ) {

      ready();
    } else {

      p.media.addEventListener( "loadedmetadata", ready, false );
    }

    return _container;
  }

  return {
    create: Controls
  };
});
