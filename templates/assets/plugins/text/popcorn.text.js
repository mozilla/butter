// PLUGIN: text

(function ( Popcorn ) {

  /**
   * text Popcorn plug-in
   * Based on popcorn.text.js by @humph
   * @param {Object} options
   *
   * Example:

   **/

  var DEFAULT_FONT_COLOR = "#000000",
      DEFAULT_SHADOW_COLOR = "#444444",
      DEFAULT_BACKGROUND_COLOR = "#888888",
      TEXT_SHADOW = "0 1px 5px {{shadowColor}}, 0 1px 10px {{shadowColor}}";

  Popcorn.plugin( "text", function() {

    var target, container, innerContainer, innerSpan,
        innerDiv, fontDecorations, position, alignment,
        transition, linkUrl, shadowColor, backgroundColor,
        context, transitionContainer, fontSheet;

    function newlineToBreak( string ) {
      // Deal with both \r\n and \n
      return string.replace( /\r?\n/gm, "<br>" );
    }

    function getTextShadow( color ) {
      return TEXT_SHADOW.replace( /\{\{shadowColor\}\}/g, color );
    }

    function makeLink( options, context ) {
      var link;

      if ( !options.linkUrl.match( /^http(|s):\/\// ) ) {
        options.linkUrl = "//" + options.linkUrl;
      }

      if ( options._link ) {
        innerDiv.removeChild( options._link );
      }

      options._link = link = document.createElement( "a" );
      link.href = options.linkUrl;
      link.target = "_blank";
      link.innerHTML = options.text;

      link.addEventListener( "click", function() {
        context.media.pause();
      }, false );

      link.style.color = innerContainer.style.color;

      innerDiv.appendChild( link );
    }

    function setPosition( options ) {
      innerContainer.classList.add( options.alignment );

      if ( options.position === "custom" ) {
        container.classList.remove( "text-fixed" );
        container.classList.add( "text-custom" );
        container.style.left = options.left + "%";
        container.style.top = options.top + "%";
        if ( options.width ) {
          container.style.width = options.width + "%";
        }
        container.style.zIndex = +options.zindex;
      }
      else {
        container.classList.remove( "text-custom" );
        container.classList.add( "text-fixed" );
        container.style.left = "";
        container.style.top = "";
        container.style.width = "";
        innerContainer.classList.add( options.position );
        innerDiv.style.zIndex = +options.zindex;
      }
    }

    function setupFontSheet( options, callback ) {
      fontSheet = document.createElement( "link" );

      fontSheet.rel = "stylesheet";
      fontSheet.type = "text/css";
      options.fontFamily = options.fontFamily ? options.fontFamily : options._natives.manifest.options.fontFamily[ "default" ];
      // Store reference to generated sheet for removal later, remove any existing ones
      document.head.appendChild( fontSheet );

      fontSheet.onload = callback || Popcorn.nop;
      fontSheet.href = "//fonts.googleapis.com/css?family=" + options.fontFamily.replace( /\s/g, "+" ) + ":400,700";
    }

    function setTransitionContainer( options ) {
      // Add transition class
      // There is a special case where popup has to be added to the innerDiv, not the outer container.
      transitionContainer = ( options.position !== "custom" && ( options.transition === "popcorn-pop" || "popcorn-fade" ) ) ? innerDiv : container;
    }

    return {
      _setup: function( options ) {

        target = Popcorn.dom.find( options.target );
        container = options._container = document.createElement( "div" );
        innerContainer = document.createElement( "div" );
        innerSpan = document.createElement( "span" );
        innerDiv = document.createElement( "div" );
        fontDecorations = options.fontDecorations || options._natives.manifest.options.fontDecorations[ "default" ];
        position = options.position || options._natives.manifest.options.position[ "default" ];
        alignment = options.alignment;
        transition = options.transition || options._natives.manifest.options.transition[ "default" ];
        linkUrl = options.linkUrl;
        shadowColor = options.shadowColor || DEFAULT_SHADOW_COLOR;
        backgroundColor = options.backgroundColor || DEFAULT_BACKGROUND_COLOR;
        context = this;

        if ( !target ) {
          target = this.media.parentNode;
        }

        options._target = target;
        container.classList.add( "popcorn-text" );

        // backwards comp
        if ( "center left right".match( position ) ) {
          alignment = position;
          position = "middle";
        }

        // innerDiv inside innerSpan is to allow zindex from layers to work properly.
        // if you mess with this code, make sure to check for zindex issues.
        innerSpan.appendChild( innerDiv );
        innerContainer.appendChild( innerSpan );
        container.appendChild( innerContainer );
        target.appendChild( container );

        options.position = position;
        options.alignment = alignment;
        options.transition = transition;
        options.text = newlineToBreak( options.text );

        setTransitionContainer( options );
        transitionContainer.classList.add( transition );
        transitionContainer.classList.add( "off" );

        // Handle all custom fonts/styling
        options.fontColor = options.fontColor || DEFAULT_FONT_COLOR;
        innerContainer.classList.add( "text-inner-div" );
        innerContainer.style.color = options.fontColor;
        innerContainer.style.fontStyle = fontDecorations.italics ? "italic" : "normal";
        innerContainer.style.fontWeight = fontDecorations.bold ? "bold" : "normal";

        if ( options.background ) {
          innerDiv.style.backgroundColor = backgroundColor;
        }
        if ( options.shadow ) {
          innerDiv.style.textShadow = getTextShadow( shadowColor );
        }

        setupFontSheet( options, function() {
          innerContainer.style.fontFamily = options.fontFamily;
          innerContainer.style.fontSize = options.fontSize + "%";
          setPosition( options );

          if ( linkUrl ) {
            makeLink( options, context );
          } else {
            innerDiv.innerHTML = options.text;
          }
        });

        options.toString = function() {
          // use the default option if it doesn't exist
          return options.text || options._natives.manifest.options.text[ "default" ];
        };
      },

      start: function() {
        var redrawBug;

        if ( transitionContainer ) {
          transitionContainer.classList.add( "on" );
          transitionContainer.classList.remove( "off" );

          // Safari Redraw hack - #3066
          transitionContainer.style.display = "none";
          redrawBug = transitionContainer.offsetHeight;
          transitionContainer.style.display = "";
        }
      },

      end: function() {
        if ( transitionContainer ) {
          transitionContainer.classList.add( "off" );
          transitionContainer.classList.remove( "on" );
        }
      },

      _teardown: function() {
        if ( target ) {
          target.removeChild( container );
        }

        if ( fontSheet ) {
          document.head.removeChild( fontSheet );
        }
      },

      _update: function( trackEvent, newOptions ) {

        // General Position
        if ( newOptions.hasOwnProperty( "position" ) ) {
          innerContainer.classList.remove( trackEvent.position );
          innerContainer.classList.remove( trackEvent.alignment );
          transitionContainer.classList.remove( trackEvent.transition );
          trackEvent.position = newOptions.position;
          setTransitionContainer( trackEvent );
          setPosition( trackEvent );
          transitionContainer.classList.add( trackEvent.transition );
        }

        // General Alignment
        if ( newOptions.hasOwnProperty( "alignment" ) ) {
          innerContainer.classList.remove( trackEvent.alignment );
          trackEvent.alignment = newOptions.alignment;
          innerContainer.classList.add( newOptions.alignment );
        }

        // Top Position
        if ( newOptions.hasOwnProperty( "top" ) ) {
          trackEvent.top = newOptions.top;
          container.style.top = trackEvent.top + "%";
        }

        // Left Position
        if ( newOptions.hasOwnProperty( "left" ) ) {
          trackEvent.left = newOptions.left;
          container.style.left = trackEvent.left + "%";
        }

        // Width Position
        if ( newOptions.hasOwnProperty( "width" ) ) {
          trackEvent.width = newOptions.width;
          container.style.width = trackEvent.width + "%";
        }

        // Transition
        if ( newOptions.hasOwnProperty( "transition" ) ) {
          transitionContainer.classList.remove( trackEvent.transition );
          trackEvent.transition = newOptions.transition;
          setTransitionContainer( trackEvent );
          transitionContainer.classList.add( trackEvent.transition );
        }

        // Text
        if ( newOptions.hasOwnProperty( "text" ) ) {
          trackEvent.text = newlineToBreak( newOptions.text );

          if ( trackEvent.linkUrl ) {
            makeLink( trackEvent, this );
          } else {

            if ( trackEvent._link ) {
              innerDiv.removeChild( trackEvent._link );
            }
            innerDiv.innerHTML = trackEvent.text;
          }
        }

        // Text Link
        if ( newOptions.hasOwnProperty( "linkUrl" ) ) {
          if ( !trackEvent.linkUrl ) {
            innerDiv.innerHTML = "";
          }

          trackEvent.linkUrl = newOptions.linkUrl;
          
          if ( trackEvent.linkUrl ) {
            makeLink( trackEvent, this );
          } else {
            if ( trackEvent._link ) {
              innerDiv.removeChild( trackEvent._link );
              trackEvent._link = null;
            }

            innerDiv.innerHTML = trackEvent.text;
          }
        }

        // Font Color
        if ( newOptions.hasOwnProperty( "fontColor" ) ) {
          innerContainer.style.color = trackEvent.fontColor = newOptions.fontColor;
        }

        // Text Decorations
        if ( newOptions.hasOwnProperty( "fontDecorations" ) ) {
          var decor = trackEvent.fontDecorations = newOptions.fontDecorations;

          if ( decor.italics ) {
            innerContainer.style.fontStyle = "italic";
          } else {
            innerContainer.style.fontStyle = "normal";
          }

          if ( decor.bold ) {
            innerContainer.style.fontWeight = "bold";
          } else {
            innerContainer.style.fontWeight = "normal";
          }

        }

        // Text Background Color
        if ( newOptions.hasOwnProperty( "background" ) ) {
          trackEvent.background = newOptions.background;

          if ( trackEvent.background ) {
            trackEvent.backgroundColor = trackEvent.backgroundColor || DEFAULT_BACKGROUND_COLOR;
            innerDiv.style.backgroundColor = trackEvent.backgroundColor;
          } else {
            innerDiv.style.backgroundColor = "";
          }
        }

        if ( newOptions.hasOwnProperty( "backgroundColor" ) ) {

          trackEvent.backgroundColor = newOptions.backgroundColor;
          if ( trackEvent.background ) {
            innerDiv.style.backgroundColor = trackEvent.backgroundColor;
          }
        }

        // Text Shadow Color
        if ( newOptions.hasOwnProperty( "shadow" ) ) {
          trackEvent.shadow = newOptions.shadow;
          
          if ( trackEvent.shadow ) {
            trackEvent.shadowColor = trackEvent.shadowColor || DEFAULT_SHADOW_COLOR;
            innerDiv.style.textShadow = getTextShadow( trackEvent.shadowColor );
          } else {
            innerDiv.style.textShadow = "";
          }
        }

        if ( newOptions.hasOwnProperty( "shadowColor" ) ) {
          trackEvent.shadowColor = newOptions.shadowColor;

          if ( trackEvent.shadow ) {
            innerDiv.style.textShadow = getTextShadow( trackEvent.shadowColor );
          }
        }

        // Font Family
        if ( newOptions.hasOwnProperty( "fontFamily" ) ) {
          trackEvent.fontFamily = newOptions.fontFamily;
          setupFontSheet( trackEvent, function() {
            innerContainer.style.fontFamily = trackEvent.fontFamily;
            innerContainer.style.fontSize = trackEvent.fontSize + "%";
          });
        }

        // Font Size
        if ( newOptions.hasOwnProperty( "fontSize" ) ) {
          trackEvent.fontSize = newOptions.fontSize;
          innerContainer.style.fontSize = trackEvent.fontSize + "%";
        }

        // Z-Index
        if ( newOptions.hasOwnProperty( "zindex" ) ) {
          trackEvent.zindex = newOptions.zindex;
          setPosition( trackEvent );
        }
      }
    };
  },{
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
        type: "text",
        label: "Link URL"
      },
      position: {
        elem: "select",
        options: [ "Custom", "Middle", "Bottom", "Top" ],
        values: [ "custom", "middle", "bottom", "top" ],
        label: "Text Position",
        "default": "custom"
      },
      alignment: {
        elem: "select",
        options: [ "Center", "Left", "Right" ],
        values: [ "center", "left", "right" ],
        label: "Text Alignment",
        "default": "left"
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
      shadow: {
        elem: "input",
        type: "checkbox",
        label: "Shadow",
        "default": false,
        group: "advanced"
      },
      shadowColor: {
        elem: "input",
        type: "color",
        label: "Shadow colour",
        "default": DEFAULT_SHADOW_COLOR,
        group: "advanced"
      },
      background: {
        elem: "input",
        type: "checkbox",
        label: "Background",
        "default": false,
        group: "advanced"
      },
      backgroundColor: {
        elem: "input",
        type: "color",
        label: "Background colour",
        "default": DEFAULT_BACKGROUND_COLOR,
        group: "advanced"
      },
      fontDecorations: {
        elem: "checkbox-group",
        labels: { bold: "Bold", italics: "Italics" },
        "default": { bold: false, italics: false },
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
  });
}( window.Popcorn ));
