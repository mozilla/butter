(function ( Popcorn ) {

  var Sketchfab;
  var SketchfabQuery;

  function validateDimension( value, fallback ) {
    if ( typeof value === "number" ) {
      return value;
    }
    return fallback;
  }

  function setupIframe( options ) {
    var iframe, src, iframeOptions;

    if ( options._sketchfabAPI && options._iframe && options._iframe.contentWindow ) {
      options._sketchfabAPI.stop();
      options._sketchfabAPI.finish();
      options._sketchfabAPI = null;
    }

    if ( options._container && options._iframe ) {
      options._container.removeChild( options._iframe );
      options._iframe = null;
    }

    if ( options.src ) {
      var src = options.src.match( /((show|skfb\.ly)\/)?([A-Za-z0-9]{9,27})/ );

      if ( src ) {
        src = src[ src.length - 1 ];

        options._iframe = iframe = document.createElement( "iframe" );
        iframe.classList.add( "sketchfab-iframe" );

        var api = options._sketchfabAPI = new Sketchfab( iframe );
        
        var sketchfabOptions = {
          nocamera: 0,
          autostart: 1,
          autospin: 0,
          transparent: ( options.background ? "0" : "1" ),
          controls: 0,
          watermark: 0,
          desc_button: 0,
          stop_button: 0
        };

        SketchfabQuery.when( api.load( src, sketchfabOptions ) ).then( function( data ) {
          api.start();
        }).fail( function( error ) {
          console.error( 'Sketchfab error: ', error );
        });

        iframe.setAttribute( "height", options.height );
        iframe.setAttribute( "width", options.width );
        iframe.setAttribute( "frameborder", 0 );
        iframe.setAttribute( "allowFullScreen", true );
        iframe.setAttribute( "webkitallowfullscreen", true );
        iframe.setAttribute( "mozallowfullscreen", true );

        options._container.appendChild( iframe );
        options._target.appendChild( options._container );
      }
    }
  }

  Popcorn.plugin( "sketchfab", {
    _setup : function( options ) {
      var _outer;

      options._target = Popcorn.dom.find( options.target );

      options.src = options.src || options._natives.manifest.options.src[ "default" ];

      if ( !options._target ) {
        return;
      }

      options._container = _outer = document.createElement( "div" );
      _outer.classList.add( "sketchfab-outer-container" );
      _outer.classList.add( options.transition );
      _outer.classList.add( "off" );

      _outer.style.width = validateDimension( options.width, "100" ) + "%";
      _outer.style.height = validateDimension( options.height, "100" ) + "%";
      _outer.style.top = validateDimension( options.top, "0" ) + "%";
      _outer.style.left = validateDimension( options.left, "0" ) + "%";
      _outer.style.zIndex = +options.zindex;

      setupIframe( options );

      options.toString = function() {
        return options.src;
      };
    },

    start: function( event, options ){
      var container = options._container,
          redrawBug;

      if ( container ) {
        container.classList.add( "on" );
        container.classList.remove( "off" );

        // Safari Redraw hack - #3066
        container.style.display = "none";
        redrawBug = container.offsetHeight;
        container.style.display = "";
      }
    },

    end: function( event, options ){
      if ( options._container ) {
        options._container.classList.add( "off" );
        options._container.classList.remove( "on" );
      }
    },

    _teardown: function( options ){
      if ( options._target && options._container ) {
        options._target.removeChild( options._container );
      }
    },

    _update: function( trackEvent, options ) {
      var resetIframe = false;

      if ( options.transition && options.transition !== trackEvent.transition ) {
        trackEvent._container.classList.remove( trackEvent.transition );
        trackEvent.transition = options.transition;
        trackEvent._container.classList.add( trackEvent.transition );
      }

      if ( options.src && options.src !== trackEvent.src ) {
        trackEvent.src = options.src;
        resetIframe = true;
      }

      if ( [ true, false ].indexOf( options.background ) > -1 && options.background !== trackEvent.background ) {
        trackEvent.background = options.background;
        resetIframe = true;
      }

      if ( resetIframe ) {
        setupIframe( trackEvent );
      }

      if ( options.top && options.top !== trackEvent.top ) {
        trackEvent.top = options.top;
        trackEvent._container.style.top = trackEvent.top + "%";
      }

      if ( options.left && options.left !== trackEvent.left ) {
        trackEvent.left = options.left;
        trackEvent._container.style.left = trackEvent.left + "%";
      }

      if ( options.width && options.width !== trackEvent.width ) {
        trackEvent.width = options.width;
        trackEvent._container.style.width = trackEvent.width + "%";
      }

      if ( options.height && options.height !== trackEvent.height ) {
        trackEvent.height = options.height;
        trackEvent._container.style.height = trackEvent.height + "%";
      }

    }
  }, {
    about:{
      name: "Popcorn Sketchfab Plugin",
      version: "0.1",
      author: "@secretrobotron",
      website: "http://secretrobotron.tumblr.com/"
    },
    options:{
      start: {
        elem: "input",
        type: "number",
        label: "Start",
        "units": "seconds"
      },
      end: {
        elem: "input",
        type: "number",
        label: "End",
        "units": "seconds"
      },
      src: {
        elem: "input",
        type: "text",
        label: "Sketchfab ID or URL",
        "default": "7IwpVxaeVk2DFnt512j6XROoyRG"
      },
      background: {
        elem: "input",
        type: "checkbox",
        label: "Background (Transparency)",
        "default": false
      },
      width: {
        elem: "input",
        type: "number",
        label: "Width",
        "default": 40,
        "units": "%",
        "hidden": true
      },
      height: {
        elem: "input",
        type: "number",
        label: "Height",
        "default": 50,
        "units": "%",
        "hidden": true
      },
      top: {
        elem: "input",
        type: "number",
        label: "Top",
        "default": 25,
        "units": "%",
        "hidden": true
      },
      left: {
        elem: "input",
        type: "number",
        label: "Left",
        "default": 30,
        "units": "%",
        "hidden": true
      },
      target: {
        hidden: true
      },
      transition: {
        elem: "select",
        options: [ "None", "Pop", "Fade", "Slide Up", "Slide Down" ],
        values: [ "popcorn-none", "popcorn-pop", "popcorn-fade", "popcorn-slide-up", "popcorn-slide-down" ],
        label: "Transition",
        "default": "popcorn-fade"
      },
      zindex: {
        hidden: true
      }
    }
  });

  var sketchfabLib = require('sketchfab-iframe');
  Sketchfab = sketchfabLib.Sketchfab;
  SketchfabQuery = sketchfabLib.Q;

}( Popcorn ));
