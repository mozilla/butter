// PLUGIN: titles

(function ( Popcorn ) {

  /**
   * titles Popcorn plug-in
   * Based on popcorn.text.js by @humph
   * @param {Object} options
   *
   * Example:
  
   **/

  var DEFAULT_FONT_COLOR = "#000";

  function normalize( value, minWidth, maxWidth ) {
    return Math.max( Math.min( value || 0, maxWidth ), minWidth );
  }

  function validateHexColor( color ) {
    return color.match ? color.match( /^#(?:[0-9a-fA-F]{3}){1,2}$/ ) : false;
  }

  // From humph's text plugin
  var escapeMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;'
  };

  function escapeHTML( string ) {
    return String( string ).replace( /&(?!\w+;)|[<>"']/g, function ( s ) {
      return escapeMap[ s ] || s;
    });
  }

  function newlineToBreak( string ) {
    // Deal with both \r\n and \n
    return string.replace( /\r?\n/gm, "<br>" );
  }

  Popcorn.plugin( "titles", {

    manifest: {
      about: {
        name: "Popcorn titles Plugin",
        version: "0.1",
        author: "@k88hudson, @mjschranz"
      },
      options: {
        text: {
          elem: "input",
          type: "text",
          label: "Text",
          "default": "Mozilla Popcorn"
        },
        position: {
          elem: "select",
          options: [ "Center", "Bottom", "Left", "Right", "Top", "Custom" ],
          values: [ "center", "bottom", "left", "right", "top", "custom"  ],
          label: "Text Position",
          "default": "center"
        },
        start: {
          elem: "input",
          type: "text",
          label: "In",
          group: "advanced",
          "units": "seconds"
        },
        end: {
          elem: "input",
          type: "text",
          label: "Out",
          group: "advanced",
          "units": "seconds"
        },
        transition: {
          elem: "select",
          options: [ "None", "Pop", "Fade", "Slide Up", "Slide Down" ],
          values: [ "popcorn-none", "popcorn-pop", "popcorn-fade", "popcorn-slide-up", "popcorn-slide-down" ],
          label: "Transition",
          "default": "popcorn-fade"
        },
        fontFamily: {
          elem: "select",
          label: "Font",
          styleClass: "",
          googleFonts: true,
          group: "advanced",
          "default": "Merriweather"
        },
        fontSize: {
          elem: "input",
          type: "number",
          label: "Font Size",
          "default": 48,
          units: "px",
          group: "advanced"
        },
        fontColor: {
          elem: "input",
          type: "text",
          label: "Font Colour",
          "default": DEFAULT_FONT_COLOR,
          group: "advanced"
        },
        fontWeight: {
          elem: "input",
          type: "checkbox",
          label: "Bold",
          "default": false,
          group: "advanced"
        },
        fontItalics: {
          elem: "input",
          type: "checkbox",
          label: "Italics",
          "default": false,
          group: "advanced"
        },
        textUnderline: {
          elem: "input",
          type: "checkbox",
          label: "Underline",
          "default": false,
          group: "advanced"
        },
        left: {
          elem: "input",
          type: "number",
          label: "Left",
          units: "%",
          "default": 30,
          hidden: true
        },
        top: {
          elem: "input",
          type: "number",
          label: "Top",
          units: "%",
          "default": 30,
          hidden: true
        },
        zindex: {
          hidden: true
        }
      }
    },

    _setup: function( options ) {

      var target = Popcorn.dom.find( options.target ),
          text = newlineToBreak( escapeHTML( options.text ) ),
          container = options._container = document.createElement( "div" ),
          innerContainer = document.createElement( "div" ),
          fontSheet;

      if ( !target ) {
        target = this.media.parentNode;
      }

      options._target = target;
      container.style.position = "absolute";
      container.classList.add( "popcorn-titles" );

      if ( options.position === "custom" ) {
        container.classList.add( "titles-custom" );
        container.style.left = options.left + "%";
        container.style.top = options.top + "%";
      }
      else {
        container.classList.add( "titles-fixed" );
        innerContainer.classList.add( options.position );
      }

      // Add transition class
      options._container.classList.add( options.transition );
      options._container.classList.add( "off" );

      // Handle all custom fonts/styling
      innerContainer.innerHTML = "<span>" + text + "</span>";
      container.style.zIndex = +options.zindex;
      container.appendChild( innerContainer );
      target.appendChild( container );

      container.style.fontStyle = options.fontItalics ? "italic" : "normal";
      options.fontColor = options.fontColor && validateHexColor( options.fontColor ) || DEFAULT_FONT_COLOR;
      container.style.color = options.fontColor;
      container.style.textDecoration = options.textUnderline ? "underline" : "none";
      container.style.fontSize = options.fontSize ? normalize( options.fontSize, 8, 200 ) + "px" : "24px";
      container.style.fontWeight = options.fontWeight ? "bold" : "normal";

      fontSheet = document.createElement( "link" );
      fontSheet.rel = "stylesheet";
      fontSheet.type = "text/css";
      options.fontFamily = options.fontFamily ? options.fontFamily : options._natives.manifest.options.fontFamily[ "default" ];
      // Store reference to generated sheet for removal later, remove any existing ones
      options._fontSheet = fontSheet;
      document.head.appendChild( fontSheet );

      fontSheet.onload = function ( e ) {
        container.style.fontFamily = options.fontFamily;
      };
      fontSheet.href = "http://fonts.googleapis.com/css?family=" + options.fontFamily.replace( /\s/g, "+" );

      options.toString = function() {
        // use the default option if it doesn't exist
        return options.text || options._natives.manifest.options.text[ "default" ];
      };
    },

    start: function( event, options ) {
      if ( options._container ) {
        options._container.classList.add( "on" );
        options._container.classList.remove( "off" );
      }
    },

    end: function( event, options ) {
      if ( options._container ) {
        options._container.classList.add( "off" );
        options._container.classList.remove( "on" );
      }
    },

    _teardown: function( options ) {
      if ( options._target ) {
        options._target.removeChild( options._container );
      }

      if ( options._fontSheet ) {
        document.head.removeChild( options._fontSheet );
      }
    }
  });
}( window.Popcorn ));
