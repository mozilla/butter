// PLUGIN: Popup

(function ( Popcorn ) {

  var sounds = {},
      events = [],
      soundIndex = 0,
      MAX_AUDIO_TIME = 2,
      _pluginRoot = location.protocol + "//" + location.hostname + ( location.port ? ":" + location.port : "" ) + "/templates/assets/plugins/popup/",
      FILL_STYLE = "rgb(255, 255, 255)",
      innerDivTriangles = {},
      DEFAULT_FONT = "Tangerine";

  // Set up speech innerDiv triangles
  innerDivTriangles.speech = document.createElement( "canvas" );
  innerDivTriangles.thought = document.createElement( "canvas" );

  function normalize( value, minWidth, maxWidth ) {
    value = value | 0;
    if ( value > maxWidth ) {
      return maxWidth;
    } else if ( value < minWidth ) {
      return minWidth;
    } else {
      return value;
    }
  }

  // Creates a triangle for a speech innerDiv
  function drawSpeech( canvas, lineWidth ) {
    var ctx  = canvas.getContext( "2d" );
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0.4, 0.3);
    ctx.bezierCurveTo(0.4, 0.3, 17.8, 26.3, 15.1, 41.9);
    ctx.bezierCurveTo(15.1, 41.9, 26.2, 26.3, 23.4, 0.3);
    ctx.fillStyle = FILL_STYLE;
    ctx.fill();
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.restore();
  }

  // Creates three innerDivs for a "thought" speech innerDiv
  function drawThought( canvas, lineWidth ) {
    var ctx  = canvas.getContext( "2d" );
    // circle1
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(13.5, 7.0);
    ctx.bezierCurveTo(13.5, 10.6, 10.6, 13.5, 7.0, 13.5);
    ctx.bezierCurveTo(3.4, 13.5, 0.5, 10.6, 0.5, 7.0);
    ctx.bezierCurveTo(0.5, 3.4, 3.4, 0.5, 7.0, 0.5);
    ctx.bezierCurveTo(10.6, 0.5, 13.5, 3.4, 13.5, 7.0);
    ctx.closePath();
    ctx.fillStyle = FILL_STYLE;
    ctx.fill();
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // circle2
    ctx.beginPath();
    ctx.moveTo(17.5, 23.8);
    ctx.bezierCurveTo(17.5, 26.1, 15.6, 28.0, 13.2, 28.0);
    ctx.bezierCurveTo(10.9, 28.0, 9.0, 26.1, 9.0, 23.8);
    ctx.bezierCurveTo(9.0, 21.4, 10.9, 19.5, 13.2, 19.5);
    ctx.bezierCurveTo(15.6, 19.5, 17.5, 21.4, 17.5, 23.8);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // circle3
    ctx.beginPath();
    ctx.moveTo(27.5, 31.8);
    ctx.bezierCurveTo(27.5, 33.5, 26.0, 35.0, 24.2, 35.0);
    ctx.bezierCurveTo(22.5, 35.0, 21.0, 33.5, 21.0, 31.8);
    ctx.bezierCurveTo(21.0, 30.0, 22.5, 28.5, 24.2, 28.5);
    ctx.bezierCurveTo(26.0, 28.5, 27.5, 30.0, 27.5, 31.8);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.restore();
  }

  drawSpeech( innerDivTriangles.speech, 2 );
  drawThought( innerDivTriangles.thought, 2 );

  Popcorn.plugin( "popup", {
    manifest: {
      about: {
        name: "Popcorn Maker Popup Plugin",
        version: "0.1",
        author: "Kate Hudson @k88hudson, Matthew Schranz @mjschranz, Brian Chirls @bchirls",
        website: "http://github.com/k88hudson, http://github.com/mjschranz, https://github.com/brianchirls/"
      },
      options: {
        start: {
          elem: "input",
          type: "number",
          label: "In"
        },
        end: {
          elem: "input",
          type: "number",
          label: "Out"
        },
        text: {
          elem: "input",
          type: "text",
          label: "Text",
          "default": "zoink!"
        },
        type: {
          elem: "select",
          options: [ "Popup", "Speech", "Thought Bubble" ],
          values: [ "popup", "speech", "thought" ],
          label: "Type",
          "default": "thought"
        },
        triangle: {
          elem: "select",
          options: [ "Top Left", "Top Right", "Bottom Left", "Bottom Right" ],
          values: [ "top left", "top right", "bottom left", "bottom right" ],
          label: "Tail Position",
          "default": "bottom left",
          optional: true
        },
        sound: {
          elem: "input",
          type: "checkbox",
          label: "Sound",
          "default": false,
          optional: true
        },
        icon: {
          elem: "select",
          options: [ "Error", "Audio", "Broken Heart", "Cone", "Earth",
                     "Eye", "Heart", "Info", "Man", "Money", "Music", "Net",
                     "Skull", "Star", "Thumbs Down", "Thumbs Up", "Time",
                     "Trophy", "Tv", "User", "Virus", "Women" ],
          values: [ "error", "audio", "broken heart", "cone", "earth",
                     "eye", "heart", "info", "man", "money", "music", "net",
                     "skull", "star", "thumbsdown", "thumbsup", "time",
                     "trophy", "tv", "user", "virus", "women" ],
          label: "Pop Icon",
          "default": "error",
          optional: true
        },
        flip: {
          elem: "input",
          type: "checkbox",
          label: "Flip Tail?",
          "default": false,
          optional: true
        },
        top: {
          elem: "input",
          type: "number",
          label: "Top",
          units: "%",
          "default": 5,
          hidden: true
        },
        left: {
          elem: "input",
          type: "number",
          label: "Left",
          units: "%",
          "default": 20,
          hidden: true
        },
        width: {
          elem: "input",
          type: "number",
          units: "%",
          label: "Width",
          "default": 30,
          hidden: true
        },
        transition: {
          elem: "select",
          options: [ "None", "Pop", "Slide Up", "Slide Down", "Fade" ],
          values: [ "none", "popcorn-pop", "popcorn-slide-up", "popcorn-slide-down", "popcorn-fade" ],
          label: "Transition",
          "default": "popcorn-pop"
        },
        fontFamily: {
          elem: "select",
          label: "Font",
          styleClass: "",
          googleFonts: true,
          "default": "Merriweather",
          group: "advanced"
        },
        fontSize: {
          elem: "input",
          type: "number",
          label: "Font Size",
          "default": 12,
          units: "px",
          group: "advanced"
        },
        fontColor: {
          elem: "input",
          type: "text",
          label: "Font",
          "default": "#668B8B",
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
        zindex: {
          hidden: true
        }
      }
    },

    _setup: function( options ) {

      var target = document.getElementById( options.target ),
          container = document.createElement( "div" ),
          context = this,
          audio,
          width = normalize( options.width, 5, 100 ) + "%",
          top = normalize( options.top, 0, 95 ) + "%",
          left = normalize( options.left, 0, 95 ) + "%",
          i,
          fontSheet,
          originalFamily = options.fontFamily,
          flip = options.flip ? " flip" : "",
          innerDiv = document.createElement( "div" ),
          textContainer = document.createElement( "div" ),
          text = options.text,
          node,
          img;

      if ( !target ) {
        target = context.media.parentNode;
      }

      options._target = target;

      function selectAudio( id, sources ) {
        var i, j, event, diff,
            eligibleAudio,
            audio,
            source;

        function resetAudio() {
          this.currentTime = 0;
          this.pause();
        }

        if ( !sounds[ id ] ) {
          audio = document.createElement( "audio" );
          for ( i = 0; i < sources.length; i ++ ) {
            source = document.createElement( "source" );
            source.src = _pluginRoot + sources[ i ];
            audio.appendChild( source );
          }
          audio.id = "popcorn-pop-sound-" + soundIndex;
          soundIndex++;
          audio.preload = true;
          audio.style.display = "none";
          audio.addEventListener( "ended", resetAudio, false );

          document.body.appendChild( audio );
          sounds[ id ] = [ audio ];
          return audio;
        }

        audio = sounds[ id ][ 0 ];
        if ( audio.duration ) {
          diff = Math.min( audio.duration, MAX_AUDIO_TIME );
        } else {
          diff = MAX_AUDIO_TIME;
        }

        //make sure there are no other events using this sound at the same time
        eligibleAudio = sounds[ id ].slice( 0 );
        for ( i = 0; i < events.length; i++ ) {
          event = events[ i ];
          if ( event.sound === options.sound &&
            event.start <= options.start + diff &&
            event.start + diff >= options.start ) {

            j = eligibleAudio.indexOf( event.audio );
            if ( j >= 0 ) {
              eligibleAudio.splice( j, 1 );
            }
          }
        }

        if ( eligibleAudio.length ) {
          audio = eligibleAudio[ 0 ];
        } else {
          audio = sounds[ id ][ 0 ].cloneNode( true );
          audio.id = "popcorn-pop-sound-" + soundIndex;
          soundIndex++;

          // not sure whether cloning copies the events in all browsers,
          // so remove it and add again just in case
          audio.removeEventListener( "ended", resetAudio, false );
          audio.addEventListener( "ended", resetAudio, false );

          document.body.appendChild( audio );
          sounds[ id ].push( audio );
        }

        return audio;
      }

      function makeTriangle( innerDiv ) {

        var triangle,
            ctx,
            TRIANGLE_WIDTH = 40,
            TRIANGLE_HEIGHT = 60;

        //Set the base classes
        innerDiv.className =  "speechBubble " + options.type + " " + options.triangle + " " + flip;
 
        triangle = document.createElement( "canvas" );
        ctx = triangle.getContext( "2d" );

        triangle.width = TRIANGLE_WIDTH;
        triangle.height = TRIANGLE_HEIGHT;
        triangle.className = "canvas";
        innerDiv.appendChild( triangle );

        //Draw according to the style
        if ( options.type === "speech" ) {
          triangle.getContext( "2d" ).drawImage( innerDivTriangles.speech, 0, 0 );
        }
        if ( options.type === "thought" ) {
          triangle.getContext( "2d" ).drawImage( innerDivTriangles.thought, 0, 0 );
        }
      } //makeTriangle

      container.style.position = "absolute";
      container.style.top = top;
      container.style.left = left;
      container.style.width = width;
      container.style.zIndex = +options.zindex;

      innerDiv = document.createElement( "div" );
      textContainer = document.createElement( "div" );

      text = text.split( /[\n\r]/ );
      for ( i = 0; i < text.length; i++ ) {
        if ( i ) {
          textContainer.appendChild( document.createElement( "br" ) );
        }
        node = document.createElement( "span" );
        node.appendChild( document.createTextNode( text[ i ] ) );
        textContainer.appendChild( node );
      }

      textContainer.style.fontStyle = options.fontItalics ? "italic" : "normal";
      textContainer.style.color = options.fontColor ? options.fontColor : "#668B8B";
      textContainer.style.textDecoration = options.textUnderline ? "underline" : "none";
      textContainer.style.fontSize = options.fontSize ? options.fontSize + "px" : "12px";
      textContainer.style.fontWeight = options.fontWeight ? "bold" : "normal";

      innerDiv.appendChild( textContainer );
      container.appendChild( innerDiv );

      if ( options.type === "popup" ) {
        innerDiv.classList.add( "popup-inner-div" );
        container.classList.add( "popcorn-popup" );

        if ( options.icon ) {
          img = document.createElement( "img" );
          img.setAttribute( "class", "popup-icon" );
          img.addEventListener( "load", function() {
            var width = img.width || img.naturalWidth,
              height = img.height || img.naturalHeight;

            if ( height > 60 ) {
              width = 60 * width / height;
              height = 60;
              img.style.width = width + "px";
            }

            img.style.left = -( width - 16 ) + "px";

            // make sure container is still non-null
            // if _teardown is called too quickly, it will become null before img loads
            if ( container ){
              if ( container.offsetHeight ) {
                img.style.top = ( container.offsetHeight - height ) / 2 - 4 + "px";
              }
              container.insertBefore( img, container.firstChild );
            }
          }, false );
          img.src = _pluginRoot + "images/" + options.icon + ".png";
        }

        //load up sound.
        if ( options.sound ) {
          if ( !audio ) {
            audio = selectAudio( "popup", [ "sounds/mouthpop.ogg", "sounds/mouthpop.wav" ] );
            options.audio = audio;
          }
        }
      }
      else {
        makeTriangle( innerDiv );
      }

      // Add transition
      container.classList.add( options.transition );
      container.classList.add( "off" );
      target.appendChild( container );
      options._container = container;

      fontSheet = document.createElement( "link" );
      fontSheet.rel = "stylesheet";
      fontSheet.type = "text/css";
      options.fontFamily = options.fontFamily ? options.fontFamily : options._natives.manifest.options.fontFamily[ "default" ];
      // Store reference to generated sheet for removal later, remove any existing ones
      options._fontSheet = fontSheet;
      document.head.appendChild( fontSheet );

      fontSheet.onload = function ( e ) {
        // Apply all the styles
        textContainer.style.fontFamily = options.fontFamily ? originalFamily : DEFAULT_FONT;
      };
      fontSheet.href = "http://fonts.googleapis.com/css?family=" + options.fontFamily.replace( /\s/g, "+" );

      options.toString = function() {
        return options.text || options._natives.manifest.options.text[ "default" ];
      };
    },

    start: function( event, options ) {
      var audio = options.audio,
          video = this.media;

      /*
       * TODO:
       * Handle Fliping On/Off of transitions here properly
       */
      options._container.classList.remove( "off" );
      options._container.classList.add( "on" );

      if ( audio && audio.duration && !video.paused &&
        video.currentTime - 1 < options.start ) {

        audio.volume = video.volume;
        audio.muted = video.muted;
        audio.play();
        if ( !audio.duration || isNaN( audio.duration ) || audio.duration > MAX_AUDIO_TIME ) {
          setTimeout(function() {
            audio.currentTime = 0;
            audio.pause();
          }, MAX_AUDIO_TIME );
        }
      }
    },

    end: function( event, options ) {
      /*
       * TODO:
       * Handle Fliping On/Off of transitions here properly
       */
      options._container.classList.add( "off" );
      options._container.classList.remove( "on" );
    },
    
    _teardown: function( options ) {
      if ( options._container && options._target ) {
        options._target.removeChild( options._container );
      }

      if ( options._fontSheet ) {
        document.head.removeChild( options._fontSheet );
      }
    }
  });
}( Popcorn ));
