// PLUGIN: text

(function ( Popcorn ) {

  /**
   * text Popcorn plug-in
   * Based on popcorn.text.js by @humph
   * @param {Object} options
   *
   * Example:
  
   **/

  var DEFAULT_FONT_COLOR = "#000";

  function newlineToBreak( string ) {
    // Deal with both \r\n and \n
    return string.replace( /\r?\n/gm, "<br>" );
  }

  Popcorn.plugin( "text", {

    manifest: {
      about: {
        name: "Popcorn text Plugin",
        version: "0.1",
        author: "@k88hudson, @mjschranz"
      },
      options: {
        text: {
          elem: "textarea",
          label: "Text",
          "default": "Popcorn Maker"
        },
        linkUrl: {
          elem: "input",
          type: "url",
          label: "Link URL"
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
          "default": 10,
          units: "%",
          group: "advanced"
        },
        fontColor: {
          elem: "input",
          type: "color",
          label: "Font colour",
          "default": DEFAULT_FONT_COLOR,
          group: "advanced"
        },
        fontDecorations: {
          elem: "checkbox-group",
          labels: { bold: "Bold", italics: "Italics", underline: "Underline" },
          "default": { bold: false, italics: false, underline: false },
          group: "advanced"
        },
        left: {
          elem: "input",
          type: "number",
          label: "Left",
          units: "%",
          "default": 25,
          hidden: true
        },
        top: {
          elem: "input",
          type: "number",
          label: "Top",
          units: "%",
          "default": 0,
          hidden: true
        },
        width: {
          elem: "input",
          type: "number",
          units: "%",
          label: "Width",
          "default": 50,
          hidden: true
        },
        zindex: {
          hidden: true
        }
      }
    },

    _setup: function( options ) {

      var target = Popcorn.dom.find( options.target ),
          text = newlineToBreak( options.text ),
          container = options._container = document.createElement( "div" ),
          innerContainer = document.createElement( "div" ),
          innerSpan = document.createElement( "span" ),
          fontSheet,
          fontDecorations = options.fontDecorations || options._natives.manifest.options.fontDecorations[ "default" ],
          position = options.position || options._natives.manifest.options.position[ "default" ],
          transition = options.transition || options._natives.manifest.options.transition[ "default" ],
          link,
          context = this;

      if ( !target ) {
        target = this.media.parentNode;
      }

      options._target = target;
      container.style.position = "absolute";
      container.classList.add( "popcorn-text" );

      innerContainer.appendChild( innerSpan );
      container.appendChild( innerContainer );
      target.appendChild( container );

      // Add transition class
      options._container.classList.add( transition );
      options._container.classList.add( "off" );

      // Handle all custom fonts/styling

      options.fontColor = options.fontColor || DEFAULT_FONT_COLOR;
      innerContainer.classList.add( "text-inner-div" );
      innerContainer.style.color = options.fontColor;
      innerContainer.style.fontStyle = fontDecorations.italics ? "italic" : "normal";
      innerContainer.style.textDecoration = fontDecorations.underline ? "underline" : "none";
      innerContainer.style.fontWeight = fontDecorations.bold ? "bold" : "normal";

      fontSheet = document.createElement( "link" );
      fontSheet.rel = "stylesheet";
      fontSheet.type = "text/css";
      options.fontFamily = options.fontFamily ? options.fontFamily : options._natives.manifest.options.fontFamily[ "default" ];
      // Store reference to generated sheet for removal later, remove any existing ones
      options._fontSheet = fontSheet;
      document.head.appendChild( fontSheet );

      fontSheet.onload = function ( e ) {
        innerContainer.style.fontFamily = options.fontFamily;
        innerContainer.style.fontSize = options.fontSize + "%";
        if ( position === "custom" ) {
          container.classList.add( "text-custom" );
          container.style.left = options.left + "%";
          container.style.top = options.top + "%";
          if ( options.width ) {
            container.style.width = options.width + "%";
          }
          container.style.zIndex = +options.zindex;
        }
        else {
          container.classList.add( "text-fixed" );
          innerContainer.classList.add( position );
          innerSpan.style.zIndex = +options.zindex;
        }

        if ( options.linkUrl ) {
          link = document.createElement( "a" );
          link.href = options.linkUrl;
          link.target = "_blank";
          link.innerHTML = text;

          link.addEventListener( "click", function( e ) {
            context.media.pause();
          }, false );

          link.style.color = innerContainer.style.color;

          innerSpan.appendChild( link );
        } else {
          innerSpan.innerHTML = text;
        }
      };
      fontSheet.href = "//fonts.googleapis.com/css?family=" + options.fontFamily.replace( /\s/g, "+" );

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
