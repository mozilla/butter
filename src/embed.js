function init( window, document ) {

  var stateClasses = [
    "embed-playing",
    "embed-paused",
    "embed-dialog-open"
  ];

  // Sometimes we want to show the info div when we pause, sometimes
  // we don't (e.g., when we open the share dialog).
  var hideInfoDiv = false;

  /**
   * embed.js is a separate, top-level entry point into the requirejs
   * structure of src/.  We use it in order to cherry-pick modules from
   * Butter as part of our embed scripts.  The embed.js file is meant
   * to be used on its own, without butter.js, and vice versa.  See
   * tools/embed.js and tools/embed.optimized.js, and the `make embed`
   * target for more info.
   */

  function $( id ) {
    if ( typeof id !== "string" ) {
      return id;
    }
    return document.querySelector( id );
  }

  function show( elem ) {
    elem = $( elem );
    if ( !elem ) {
      return;
    }
    elem.style.display = "block";
  }

  function requestFullscreen( elem ) {
    if ( elem.requestFullscreen ) {
      elem.requestFullscreen();
    } else if ( elem.mozRequestFullscreen ) {
      elem.mozRequestFullscreen();
    } else if ( elem.mozRequestFullScreen ) {
      elem.mozRequestFullScreen();
    } else if ( elem.webkitRequestFullscreen ) {
      elem.webkitRequestFullscreen();
    }
  }

  function isFullscreen() {
    return !((document.fullScreenElement && document.fullScreenElement !== null) ||
            (!document.mozFullScreen && !document.webkitIsFullScreen));
  }

  function cancelFullscreen() {
    if ( document.exitFullScreen ) {
      document.exitFullScreen();
    } else if ( document.mozCancelFullScreen ) {
      document.mozCancelFullScreen();
    } else if ( document.webkitCancelFullScreen ) {
      document.webkitCancelFullScreen();
    }
  }

  function hide( elem ) {
    elem = $( elem );
    if ( !elem ) {
      return;
    }
    elem.style.display = "none";
  }

  function shareClick( popcorn ) {
    if ( !popcorn.paused() ) {
      hideInfoDiv = true;
      popcorn.pause();
    }

    addStateClass( "embed-dialog-open" );
    hide( "#controls-big-play-button" );
    hide( "#post-roll" );
    show( "#share" );
  }

  function remixClick( popcorn ) {
    $( "#remix-post" ).click();
  }

  function fullscreenClick() {
    var container = document.getElementById( "container" );
    if( !isFullscreen() ) {
      requestFullscreen( container );
    } else {
      cancelFullscreen();
    }
  }

  function setupClickHandlers( popcorn, config ) {
    function replay() {
      popcorn.play( config.start );
    }

    $( "#replay-post" ).addEventListener( "click", replay, false );
    $( "#replay-share" ).addEventListener( "click", replay, false );
    $( "#share-post" ).addEventListener( "click", function() {
      shareClick( popcorn );
    }, false );
  }

  function buildIFrameHTML() {
    var src = window.location,
      // Sizes are strings: "200x400"
      shareSize = $( ".size-options .current .dimensions" ).textContent.split( "x" ),
      width = shareSize[ 0 ],
      height = shareSize[ 1 ];

    return '<iframe src="' + src + '" width="' + width + '" height="' + height +
           '" frameborder="0" mozallowfullscreen webkitallowfullscreen allowfullscreen></iframe>';
  }

  // We put the embed's cannoncial URL in a <link rel="cannoncial" href="...">
  function getCannonicalURL() {
    var links = document.querySelectorAll( "link" ),
        link;

    for ( var i = 0; i < links.length; i++ ) {
      link = links[ i ];
      if ( link.rel === "cannonical" ) {
        return link.href;
      }
    }
    // Should never happen, but for lint...
    return "";
  }

  function addStateClass( state ) {
    var el = $( "#container" );

    if ( el.classList.contains( state ) ) {
      return;
    }

    for ( var i = 0; i < stateClasses.length; i++ ) {
      el.classList.remove( stateClasses[ i ] );
    }

    el.classList.add( state );
  }

  function setupEventHandlers( popcorn, config ) {
    var sizeOptions = document.querySelectorAll( ".option" ),
        i, l;

    $( "#share-close" ).addEventListener( "click", function() {
      hide( "#share" );

      // If the video is done, go back to the postroll
      if ( popcorn.ended() ) {
        show( "#post-roll" );
      }
    }, false );

    function sizeOptionFn( e ) {
      e.preventDefault();
      $( ".size-options .current" ).classList.remove( "current" );
      this.classList.add( "current" );
      $( "#share-iframe" ).value = buildIFrameHTML();
    }

    for ( i = 0, l = sizeOptions.length; i < l; i++ ) {
      sizeOptions[ i ].addEventListener( "click", sizeOptionFn, false );
    }

    popcorn.on( "ended", function() {
      show( "#post-roll" );
      addStateClass( "embed-dialog-open" );
    });

    popcorn.on( "pause", function() {
      if ( hideInfoDiv ) {
        addStateClass( "embed-dialog-open" );
        hideInfoDiv = false;
      } else {
        addStateClass( "embed-paused" );
      }
    });

    popcorn.on( "playing", function() {
      hide( "#share" );
      hide( "#post-roll" );
      addStateClass( "embed-playing" );
    });

    function onCanPlay() {
      if ( config.autoplay ) {
        popcorn.play();
      }
    }
    popcorn.on( "canplay", onCanPlay );

    // See if Popcorn was ready before we got setup
    if ( popcorn.readyState() >= 3 && config.autoplay ) {
      popcorn.off( "canplay", onCanPlay );
      popcorn.play();
    }
  }

  var require = requirejs.config({
    context: "embed",
    baseUrl: "/src",
    paths: {
      text: "../external/require/text"
    }
  });

  require([
      "util/uri",
      "ui/widget/controls",
      "ui/widget/textbox",
      // keep this at the end so it doesn't need a spot in the function signature
      "util/shims"
    ],
    function( URI, Controls, TextboxWrapper ) {
      /**
       * Expose Butter so we can get version info out of the iframe doc's embed.
       * This "butter" is never meant to live in a page with the full "butter".
       * We warn then remove if this happens.
       **/
      var Butter = {
            version: "Butter-Embed-@VERSION@"
          },
          popcorn = Popcorn.byId( "Butter-Generated" ),
          config,
          qs = URI.parse( window.location.href ).queryKey,
          container = document.querySelectorAll( ".container" )[ 0 ],
          videoContainer = document.getElementById( "video-container" ),
          controlsElement = document.getElementById( "controls" ),
          autoHideTimeout,
          hide = true;

      /**
       * the embed can be configured via the query string:
       *   autohide   = 1{default}|0    automatically hide the controls once playing begins
       *   autoplay   = 1|{default}0    automatically play the video on load
       *   controls   = 1{default}|0    display controls
       *   start      = {integer 0-end} time to start playing (default=0)
       *   end        = {integer 0-end} time to end playing (default={end})
       *   fullscreen = 1{default}|0    whether to allow fullscreen mode (e.g., hide/show button)
       *   loop       = 1|0{default}    whether to loop when hitting the end
       *   branding   = 1{default}|0    whether or not to show the mozilla popcorn branding
       *   showinfo   = 1{default}|0    whether to show video title, author, etc. before playing
       **/
      config = {
        autohide: qs.autohide === "1" ? true : false,
        autoplay: qs.autoplay === "1" ? true : false,
        controls: qs.controls === "0" ? false : true,
        start: qs.start|0,
        end: qs.end|0,
        fullscreen: qs.fullscreen === "0" ? false : (function( document ) {
          // Check for prefixed/unprefixed Fullscreen API support
          if ( "fullScreenElement" in document ) {
            return true;
          }

          var pre = "khtml o ms webkit moz".split( " " ),
              i = pre.length,
              prefix;

          while ( i-- ) {
            prefix = pre[ i ];
            if ( (prefix + "FullscreenElement" ) in document ) {
              return true;
            }
          }
          return false;
        }( document )),
        loop: qs.loop === "1" ? true : false,
        branding: qs.branding === "0" ? false : true,
        showinfo: qs.showinfo === "0" ? false : true
      };

      // if true, show media controls
      if ( config.controls ) {
        popcorn.controls( true );
        Controls( "controls", popcorn, {
          onShareClick: function() {
            shareClick( popcorn );
          },
          onRemixClick: function() {
            remixClick( popcorn );
          },
          onFullscreenClick: function() {
            fullscreenClick();
          }
        });
        show( "#controls" );
      }

      // Setup UI based on config options
      if ( !config.branding ) {
        container.removeChild( controlsElement );
        videoContainer.removeChild( document.getElementById( "controls-big-play-button" ) );
        videoContainer.removeChild( document.getElementById( "post-roll" ) );
        videoContainer.removeChild( document.getElementById( "share" ) );
        videoContainer.removeChild( document.getElementsByClassName( "embed-info" )[ 0 ] );
        // since both `showinfo` and `autohide` both depend on pieces of our UI with branding on it
        // only bother with it if `branding` was true
      } else {
        // if autohide is true, make sure that we hide the controls when the user isn't mousing over them or has left
        // their mouse overtop of the video for to long
        if ( config.autohide ) {
          popcorn.on( "pause", function() {
            controlsElement.classList.remove( "controls-hide" );
          });
          // only hide the controls initially if the video is playing
          if ( !popcorn.paused() ) {
            controlsElement.classList.add( "controls-hide" );
          }

          // as soon as playing occurs, add the neccessary timeouts and listeners
          popcorn.on( "play", function onPlay() {
            container.addEventListener( "mouseover", function() {
              clearTimeout( autoHideTimeout );
              // if we move outside of the controls we should ensure `hide` is true
              hide = true;
              controlsElement.classList.remove( "controls-hide" );
            }, false);
            container.addEventListener( "mouseout", function() {
              clearTimeout( autoHideTimeout );
              if ( !popcorn.paused() ) {
                controlsElement.classList.add( "controls-hide" );
              }
            }, false);
            container.addEventListener( "mousemove", function() {
              controlsElement.classList.remove( "controls-hide" );
              clearTimeout( autoHideTimeout );
              autoHideTimeout = setTimeout(function() {
                // check the boolean value `hide` to make sure we should still hide
                if ( hide && !popcorn.paused() ) {
                  controlsElement.classList.add( "controls-hide" );
                  hide = true;
                }
              }, 1000);
            }, false);
            controlsElement.addEventListener( "mousemove", function() {
              // if the user is mousing over the controls, ensure we don't hide them be setting `hide` to false
              hide = false;
            }, false);
            autoHideTimeout = setTimeout(function() {
              // check the boolean value `hide` to make sure we should still hide
              if ( hide && !popcorn.paused() ) {
                controlsElement.classList.add( "controls-hide" );
                hide = true;
              }
            }, 1000);
          });
        }

        // if false, do not show video title, author, etc. before playing
        if ( !config.showinfo ) {
          addStateClass( "embed-playing" );
        }
      }

      // if true, continually loop media playback
      if ( config.loop ) {
        popcorn.loop( true );
      }

      // Some config options want the video to be ready before we do anything.
      function onLoad() {
        var start = config.start,
            end = config.end;

        if ( config.fullscreen ) {
          // dispatch an event to let the controls know we want to setup a click listener for the fullscreen button
          popcorn.emit( "butter-fullscreen-allowed", container );
        }

        popcorn.off( "load", onLoad );

        // update the currentTime to the embed options start value
        // this is needed for mobile devices as attempting to listen for `canplay` or similar events
        // that let us know it is safe to update the current time seem to be futile
        function timeupdate() {
          popcorn.currentTime( start );
          popcorn.off( "timeupdate", timeupdate );
        }
        // See if we should start playing at a time other than 0.
        // We combine this logic with autoplay, since you either
        // seek+play or play or neither.
        if ( start > 0 && start < popcorn.duration() ) {
          popcorn.on( "seeked", function onSeeked() {
            popcorn.off( "seeked", onSeeked );
            if ( config.autoplay ) {
              popcorn.play();
            }
          });
          popcorn.on( "timeupdate", timeupdate );
        } else if ( config.autoplay ) {
          popcorn.play();
        }

        // See if we should pause at some time other than duration.
        if ( end > 0 && end > start && end <= popcorn.duration() ) {
          popcorn.cue( end, function() {
            popcorn.pause();
            popcorn.emit( "ended" );
          });
        }
      }

      // Either the video is ready, or we need to wait.
      if ( popcorn.readyState() >= 1 ) {
        onLoad();
      } else {
        popcorn.media.addEventListener( "canplay", onLoad );
      }

      if ( config.branding ) {
        setupClickHandlers( popcorn, config );
        setupEventHandlers( popcorn, config );

        // Wrap textboxes so they click-to-highlight
        TextboxWrapper( $( "#share-url" ) );
        TextboxWrapper( $( "#share-iframe" ) );

        // Write out the iframe HTML necessary to embed this
        $( "#share-iframe" ).value = buildIFrameHTML();

        // Get the page's cannonical URL and put in share URL
        $( "#share-url" ).value = getCannonicalURL();
      }

      if ( window.Butter && console && console.warn ) {
        console.warn( "Butter Warning: page already contains Butter, removing." );
        delete window.Butter;
      }
      window.Butter = Butter;
    }
  );
}

document.addEventListener( "DOMContentLoaded", function() {
  // Source tree case vs. require-built case.
  if ( typeof require === "undefined" ) {
    Popcorn.getScript( "../../external/require/require.js", function() {
      init( window, window.document );
    });
  } else {
    init( window, window.document );
  }
}, false );
