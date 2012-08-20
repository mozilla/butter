"use strict";

(function ( Popcorn ) {

  function normalize( value, minValue, maxValue ) {
    return Math.max( Math.min( value || 0, maxValue ), minValue );
  }

  Popcorn.plugin( "webpage" , {
    _setup: function( options ) {

      var manifest = options._natives.manifest,
          target = Popcorn.dom.find( options.target || manifest.options.target[ "default" ] ),
          wrapper,
          iframe;

      options._wrapper = wrapper = document.createElement( "div" );

      if ( target ) {
        target.appendChild( wrapper );
      }

      // make src an iframe acceptable string
      options.src = options.src.replace( /^(https?:)?(\/\/)?/, "//" );

      // make an iframe
      options._iframe = iframe = document.createElement( "iframe" );

      iframe.setAttribute( "width", "100%" );
      iframe.setAttribute( "height", "100%" );
      iframe.id = options.id || Popcorn.guid();
      iframe.src = options.src;

      wrapper.style.top = normalize( options.top || manifest.options.top[ "default" ], 0, 90 ) + "%";
      wrapper.style.left = normalize( options.left || manifest.options.left[ "default" ], 0, 90 ) + "%";
      wrapper.style.height = normalize( options.height || manifest.options.height[ "default" ], 10, 100 ) + "%";
      wrapper.style.width = normalize( options.width || manifest.options.width[ "default" ], 10, 100 ) + "%";
      wrapper.style.position = "absolute";

      wrapper.appendChild( iframe );
      wrapper.classList.add( "off" );
      wrapper.classList.add( "popcorn-fade" );

      options.toString = function() {
        return options.src || manifest.options.src[ "default" ];
      };
    },

    start: function( event, options ){
      options._wrapper.classList.add( "on" );
      options._wrapper.classList.remove( "off" );
    },

    end: function( event, options ){
      options._wrapper.classList.add( "off" );
      options._wrapper.classList.remove( "on" );
    },

    _teardown: function( options ) {
      options._wrapper.parentNode.removeChild( options._wrapper );
    },

    manifest: {
      about: {
        name: "Popcorn Webpage Plugin",
        version: "0.1",
        author: "@annasob",
        website: "annasob.wordpress.com"
      },
      options: {
        top: {
          elem: "input",
          type: "number",
          label: "Top",
          optional: true,
          "default": 20,
          hidden: true
        },
        left: {
          elem: "input",
          type: "number",
          label: "Left",
          optional: true,
          "default": 20,
          hidden: true
        },
        width: {
          elem: "input",
          type: "number",
          label: "Width",
          optional: true,
          "default": 60,
          hidden: true
        },
        height: {
          elem: "input",
          type: "number",
          label: "Height",
          optional: true,
          "default": 60,
          hidden: true
        },
        start: {
          elem: "input",
          type: "number",
          label: "Start"
        },
        end: {
          elem: "input",
          type: "number",
          label: "End"
        },
        src: {
          elem: "input",
          type: "url",
          label: "Webpage URL",
          "default": "http://mozillapopcorn.org"
        },
        target: {
          "default": "iframe-container",
          hidden: true
        }
      }
    }
  });
}( Popcorn ));
