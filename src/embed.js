/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

function init( window, document ) {

  function requestFullscreen( elem ) {
    // Prefix + case differences.
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

  function cancelFullscreen() {
    // Prefix + case differences.
    if ( document.exitFullscreen ) {
      document.exitFullscreen();
    } else if ( document.mozCancelFullscreen ) {
      document.mozCancelFullscreen();
    } else if ( document.mozCancelFullScreen ) {
      document.mozCancelFullScreen();
    } else if ( document.webkitCancelFullscreen ) {
      document.webkitCancelFullscreen();
    }
  }

  function $( id ) {
    if( typeof id !== "string" ) {
      return id;
    }
    return document.getElementById( id );
  }

  function isVisible( id ) {
    return $( id ).style.display !== "none";
  }

  function show( elem ) {
    elem = $( elem );
    elem.style.display = "block";
  }

  function hide( elem ) {
    elem = $( elem );
    elem.style.display = "none";
  }

  function setupClickHandlers( popcorn, config ) {
    function replay() {
      popcorn.play();
    }

    $( "replay-post" ).addEventListener( "click", replay, false );
    $( "replay-share" ).addEventListener( "click", replay, false );

    $( "share-post" ).addEventListener( "click", function() {
      hide( "post-roll" );
      show( "share" );
    }, false );

    $( "share-share" ).addEventListener( "click", function() {
      // Not sure what share in the context of share means...
      Popcorn.nop();
    }, false );

    // TODO: fullscreen UI event handler for "container div...
  }

  function buildIFrameHTML() {
    var src = window.location,
      // Sizes are strings: "200x400"
      shareSize = $( "share-size" ).value.split( "x" ),
      width = shareSize[0],
      height = shareSize[1];
    return '<iframe src="' + src + '" width="' + width + '" height="' + height +
           '" frameborder="0" mozallowfullscreen webkitallowfullscreen allowfullscreen></iframe>';
  }

  // We put the embed's cannoncial URL in a <link rel="cannoncial" href="...">
  function getCannonicalURL() {
    var links = document.querySelectorAll( "link" ),
      link;
    for( var i=0; i<links.length; i++ ) {
      link = links[ i ];
      if( link.rel === "cannonical" ) {
        return link.href;
      }
    }
    // Should never happen, but for lint...
    return "";
  }

  function setupEventHandlers( popcorn, config ) {

    var stateClasses = [
      "embed-playing",
      "embed-paused",
      "embed-ended"
    ];

    function addStateClass( state ) {
      var el = $( "container" );

      if ( el.classList.contains( state ) ) {
        return;
      }

      for( var i = 0; i < stateClasses.length; i++ ) {
        el.classList.remove( stateClasses[ i ] );
      }

      el.classList.add( state );
    }

     $( "share-close" ).addEventListener( "click", function() {
      hide( "share" );
    }, false );


    $( "share-size" ).onchange = function() {
      $( "share-iframe" ).value = buildIFrameHTML();
    };

    popcorn.on( "ended", function() {
      show( "post-roll" );
      addStateClass( "embed-ended" );
    });

    popcorn.on( "pause", function() {
      $( "play-pause" ).innerHTML = "Play";
      addStateClass( "embed-paused" );
    });

    popcorn.on( "playing", function() {
      $( "play-pause" ).innerHTML = "Pause";
      addStateClass( "embed-playing" );
    });

    function onCanPlay() {
      if( config.autoplay ) {
        popcorn.play();
      }
    }
    popcorn.on( "canplay", onCanPlay );

    // See if Popcorn was ready before we got setup
    if( popcorn.readyState() >= 3 && config.autoplay ) {
      popcorn.off( "canplay", onCanPlay );
      popcorn.play();
    }
  }

  var req = requirejs.config({
    context: "embed",
    baseUrl: "/src",
    paths: {
      text: "../external/require/text"
    }
  });

  req([
      "util/uri",
      "ui/widget/controls",
      // keep this at the end so it doesn't need a spot in the function signature
      "util/shims"
    ],
    function( URI, Controls ) {
      /**
       * Expose Butter so we can get version info out of the iframe doc's embed.
       * This "butter" is never meant to live in a page with the full "butter".
       * We warn then remove if this happens.
       **/
      var Butter = { version: "Butter-Embed-@VERSION@" },
        popcorn = Popcorn.byId( "Butter-Generated" ),
        config,
        qs = URI.parse( window.location.href ).queryKey;

      /**
       * The embed can be configured via the query string:
       *   autohide   = 1{default}|0    automatically hide the controls once playing begins
       *   autoplay   = 1|{default}0    automatically play the video on load
       *   controls   = 1{default}|0    display controls
       *   start      = {integer 0-end} time to start playing (default=0)
       *   end        = {integer 0-end} time to end playing (default={end})
       *   fullscreen = 1{default}|0    whether to allow fullscreen mode (e.g., hide/show button)
       *   loop       = 1|0{default}    whether to loop when hitting the end
       *   branding   = 1{default}|0    whether or not to show the Mozilla Popcorn branding
       *   showinfo   = 1{default}|0    whether to show video title, author, etc. before playing
       **/
      config = {
        autohide: qs.autohide === "0" ? false : true,
        autoplay: qs.autoplay === "1" ? true : false,
        controls: qs.controls === "0" ? false : true,
        start: qs.start|0,
        end: qs.end|0,
        fullscreen: qs.fullscreen === "0" ? false : (function( document ) {
          // Check for prefixed/unprefixed Fullscreen API support
          if( "fullScreenElement" in document ) {
            return true;
          }
          var pre = "khtml o ms webkit moz".split( " " ),
            i = pre.length,
            prefix;
          while( i-- ) {
            prefix = pre[ i ];
            if( (prefix + "FullscreenElement" ) in document ) {
              return true;
            }
          }
          return false;
        }( document )),
        loop: qs.loop === "1" ? true : false,
        branding: qs.branding === "0" ? false : true,
        showinfo: qs.showinfo === "0" ? false : true
      };

      // Setup UI based on config options
      // TODO: config.autohide
      // TODO: config.autoplay
      if( config.controls ) {
        Controls( "controls", popcorn );
        show( "controls" );
      }

      setupClickHandlers( popcorn, config );
      setupEventHandlers( popcorn, config );

      // Write out the iframe HTML necessary to embed this
      $( "share-iframe" ).value = buildIFrameHTML();

      // Get the page's cannonical URL and put in share URL
      $( "share-url" ).value = getCannonicalURL();

      if( window.Butter && console && console.warn ){
        console.warn( "Butter Warning: page already contains Butter, removing." );
        delete window.Butter;
      }
      window.Butter = Butter;
    }
  );
}

// Source tree case vs. require-built case.
if( !window.require ) {
  Popcorn.getScript( "../../external/require/require.js", function() {
    init( window, window.document );
 });
} else {
  init( window, window.document );
}
