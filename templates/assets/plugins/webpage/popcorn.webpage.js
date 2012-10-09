"use strict";

(function ( Popcorn ) {

  Popcorn.plugin( "webpage" , {
    _setup: function( options ) {

      var manifest = options._natives.manifest,
          target = Popcorn.dom.find( options.target || manifest.options.target[ "default" ] ),
          wrapper,
          safeText,
          iframe;

      options._wrapper = wrapper = document.createElement( "div" );

      if ( target ) {
        target.appendChild( wrapper );
      }

      // make an iframe
      options._iframe = iframe = document.createElement( "iframe" );

      iframe.setAttribute( "width", "100%" );
      iframe.setAttribute( "height", "100%" );
      iframe.id = options.id || Popcorn.guid();

      // check the browser's ability to ensure security against frame-busting and other bad apples' hacks
      if ( "sandbox" in iframe || options.trustIframes ) {
        iframe.src = options.src;

        // The value of the sandbox attribute is set here only to avoid letting iframes escape into the parent page
        // (where) this plugin resides. The MDN article (https://developer.mozilla.org/en-US/docs/HTML/Element/iframe#Attributes)
        // explicitly discourages using "allow-scripts allow-same-origin", because it offers little real security from iframes,
        // but in our case, it's just enough of a block to stop sites from using JavaScript to framebust (lazily), but causes less
        // errors in sites that attempt to use LocalStorage and other same-origin-dependent functionality.
        iframe.setAttribute( "sandbox", "allow-scripts allow-same-origin" );
      }
      else {
        safeText = document.createElement( "div" );
        iframe = document.createElement( "div" );
        iframe.appendChild( safeText );
        safeText.innerHTML = "Popcorn Maker could not display the requested webpage, " +
          "<a target=\"_blank\" href=\"" + options.src + "\">" + options.src + "</a>." +
          "<br />For more information, see " +
          "<a target=\"_blank\" href=\"https://developer.mozilla.org/en-US/docs/HTML/Element/iframe#Attributes\">this MDN article</a>. ";
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.background = "#fff";
        iframe.style.textAlign = "center";
        iframe.style.color = "#000";
        iframe.style.display = "table";
        safeText.style.padding = "15px";
        safeText.style.display = "table-cell";
        safeText.style.verticalAlign = "middle";
      }
      
      wrapper.classList.add( options.transition );
      wrapper.classList.add( "off" );

      wrapper.style.top = options.top + "%";
      wrapper.style.left = options.left + "%";
      wrapper.style.height = options.height + "%";
      wrapper.style.width = options.width + "%";
      wrapper.style.position = "absolute";
      wrapper.style.zIndex = +options.zindex;

      wrapper.appendChild( iframe );

      options.toString = function() {
        return options.src || manifest.options.src[ "default" ];
      };
    },

    start: function( event, options ){
      if ( options._wrapper ) {
        options._wrapper.classList.add( "on" );
        options._wrapper.classList.remove( "off" );
      }
    },

    end: function( event, options ){
      if ( options._wrapper ) {
        options._wrapper.classList.add( "off" );
        options._wrapper.classList.remove( "on" );
      }
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
          type: "url",
          label: "Webpage URL",
          "default": "http://mozillapopcorn.org"
        },
        target: {
          "default": "iframe-container",
          hidden: true
        },
        transition: {
          elem: "select",
          options: [ "None", "Pop", "Fade", "Slide Up", "Slide Down" ],
          values: [ "popcorn-none", "popcorn-pop", "popcorn-fade", "popcorn-slide-up", "popcorn-slide-down" ],
          label: "Transition",
          "default": "popcorn-fade"
        },
        trustIframes: {
          elem: "input",
          type: "checkbox",
          label: "Trust iframes",
          "default": true
        },
        zindex: {
          hidden: true
        }
      }
    }
  });
}( Popcorn ));
