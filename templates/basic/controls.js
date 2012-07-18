(function() {

  // hack to load custom controls.
  // we monkey patch smart so we can gain access to p.media.
  // we build the controls on top of p.media.
  // we also need to run this script before DOMContentLoaded,
  // and after popcorn is loaded. This is why it is in the body.
  // deal with it.
  if ( window.Popcorn ) {

    var smart = Popcorn.smart;

    Popcorn.smart = function() {

      var p = smart.apply( null, arguments ),
          controls = document.getElementById( "butter-controls" );

      if ( controls ) {

        var muteButton = document.getElementById( "controls-mute" ),
            playButton = document.getElementById( "controls-play" ),
            currentTimeDialog = document.getElementById( "controls-currenttime" ),
            durationDialog = document.getElementById( "controls-duration" ),
            timebar = document.getElementById( "controls-timebar" ),
            progressBar = document.getElementById( "controls-progressbar" ),
            bigPlayButton = document.getElementById( "controls-big-play-button" ),
            scrubber = document.getElementById( "controls-scrubber" ),
            seeking = false,
            playStateCache = false,
            active = false;

        p.controls( false );

        if ( bigPlayButton ) {

          bigPlayButton.classList.add( "controls-ready" );

          var bigPlayFunction = function() {

            bigPlayButton.removeEventListener( "mouseup", bigPlayFunction, false );
            bigPlayButton.classList.remove( "controls-ready" );
            p.media.addEventListener( "mouseover", activate, false );
            p.play();
          };

          bigPlayButton.addEventListener( "mouseup", bigPlayFunction, false );
        }

        controls.classList.add( "controls-ready" );

        var activate = function() {

          active = true;
          controls.classList.add( "controls-active" );
        };

        var deactivate = function() {

          active = false;
          !seeking && controls.classList.remove( "controls-active" );
        };

        p.media.addEventListener( "mouseout", deactivate, false );
        controls.addEventListener( "mouseover", activate, false );
        controls.addEventListener( "mouseout", deactivate, false );

        var togglePlay = function() {
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

          muteButton.addEventListener( "mouseup", function() {

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

          var mouseMove = function( e ) {

            e.preventDefault();
            var position = e.clientX - timebar.getBoundingClientRect().left;

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

          var mouseUp = function( e ) {

            e.preventDefault();
            seeking = false;
            !active && deactivate();
            playStateCache && p.play();
            window.removeEventListener( "mouseup", mouseUp, false );
            window.removeEventListener( "mousemove", mouseMove, false );
          };

          var mouseDown = function( e ) {

            e.preventDefault();
            seeking = true;
            playStateCache = !p.paused();
            p.pause();
            window.addEventListener( "mouseup", mouseUp, false );
            window.addEventListener( "mousemove", mouseMove, false );

            if ( progressBar ) {

              progressBar.style.width = e.layerX + "px";
            }

            if ( scrubber ) {

              scrubber.style.left = e.layerX - ( scrubber.offsetWidth / 2 ) + "px";
            }

            p.currentTime( e.layerX / timebar.offsetWidth * 100 * p.duration() / 100 );
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
      }

      return p;
    };
  }
}());

