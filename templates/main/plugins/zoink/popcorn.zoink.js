// PLUGIN: SPEAK

(function ( Popcorn ) {
  
  var styleSheet;

/**
  Popcorn zoink
 */
  Popcorn.plugin( "zoink", {
      manifest: {
        about: {
          name: "Popcorn zoink Plugin",
          version: "0.1",
          author: "Kate Hudson @k88hudson",
          website: "http://github.com/k88hudson"
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
            "default": "Edit me",
            editable: true
          },
          style: {
            elem: "select",
            options: [ "speech", "thought", "none" ],
            type: "text",
            label: "Style:",
            editable: true
          },
          order: {
            elem: "select",
            options: [ 1, 2, 3 ],
            type: "text",
            label: "Layer order:",
            "default": 1,
            editable: true
          },
          classes: {
            elem: "input",
            type: "text",
            label: "Classes (top, bottom, left, right, flip, pipe, fx)",
            editable: true
          },
          top: {
            elem: "input",
            type: "text",
            label: "Top:",
            "default": "200px",
            editable: true
          },
          left: {
            elem: "input",
            type: "text",
            label: "Left:",
            "default": "200px",
            editable: true
          },
          target: "video-overlay"
        }
      },
      _setup: function( options ) {

        var target = document.getElementById( options.target ),
            _args = {};

        if (!styleSheet) {
          styleSheet = document.createElement('style');
          styleSheet.setAttribute('type', 'text/css');
          styleSheet.appendChild(document.createTextNode( "" +
            ".speechBubble {\n" +
            "  opacity: 0;\n" +
            "  font-family: \"digital-strip\";\n" +
            "  font-size: 16px;\n" +
            "  line-height: 1;\n" +
            "  position: relative;\n" +
            "  display: inline-block;\n" +
            "  border: 2px solid black;\n" +
            "  padding: 10px;\n" +
            "  border-radius: 5px;\n" +
            "  min-width: 70px;\n" +
            "  max-width: 200px;\n" +
            "  box-shadow: 3px 3px 7px rgba(0,0,0,.2);\n" +
            "  background: #FFF;\n" +
            "  color: #222;\n" +
            "  z-index: 1000;\n" +
            "}\n" +
            ".on .speechBubble{ opacity: 1; }\n" +
            "\n" +
            ".speechBubble.full-width { width: 100%; }\n" +
            ".speechBubble.connected { margin-bottom: 15px; }\n" +
            ".speechBubble.fx div.text { text-align: center; font-size: 45px; font-weight: bold; padding: 10px;}\n" +
            "\n" +
            ".speechBubble .canvas {\n" +
            "  position: absolute;\n" +
            "  -webkit-transform-origin: 30% 0%;\n" +
            "  z-index: 1001;\n" +
            "}\n" +
            "\n" +
            "\/* HORIZONTAL POSITIONING *\/\n" +
            ".speechBubble.right .canvas { right: 15px; }\n" +
            ".speechBubble.left .canvas { left: 15px; }\n" +
            "\n" +
            "\/* BOTTOM *\/\n" +
            ".speechBubble { margin-bottom: 60px; }\n" +
            ".speechBubble .canvas { bottom: -59px; -webkit-transform: scale(1, 1); }\n" +
            ".speechBubble.flip .canvas { -webkit-transform: scale(-1, 1); }\n" +
            ".speechBubble.thought .canvas { bottom: -65px; }\n" +
            ".speechBubble.long .canvas { bottom: -58px; -webkit-transform: scale(1, 1.5); }\n" +
            ".speechBubble.long.flip .canvas{ -webkit-transform: scale(-1, 1.5); }\n" +
            "\n" +
            "\/*TOP*\/\n" +
            ".speechBubble.top { margin-bottom: 15px; }\n" +
            ".speechBubble.top .canvas {  top: 1px; -webkit-transform: scale(1, -1); }\n" +
            ".speechBubble.top.flip .canvas { -webkit-transform: scale(-1, -1); }\n" +
            ".speechBubble.thought.top .canvas { top: -5px; }\n" +
            ".speechBubble.long.top .canvas {  top: 2px; -webkit-transform: scale(-1, -1.5); }\n" +
            ".speechBubble.long.top.flip .canvas { -webkit-transform: scale(1, -1.5); }\n" +
            "\n" +
            ".speechBubble .pipe{ \n" +
            "  background: white;\n" +
            "  position: absolute;\n" +
            "  width: 10px;\n" +
            "  height: 30px;\n" +
            "  -webkit-transform-origin: top center;\n" +
            "  -webkit-transform: rotate(-15deg);\n" +
            "  border: 1px solid \n" +
            "  black;\n" +
            "  border-top: 0;\n" +
            "  border-bottom: 0;\n" +
            "  bottom: -25px;\n" +
            "  right: 35px;\n" +
            "  z-index: 1001;\n" +
            "}"));
          document.head.appendChild(styleSheet);
  
        }
        //TODO: if not jquery add jquery

        if ( !target && Popcorn.plugin.debug ) {
          throw new Error( "target container doesn't exist" );
        }
        
        speechBubble( target, options );
        options.callback && options.callback( options._container );

        function speechBubble( target, args ) {
          !args && ( args = {} );

          var container = document.createElement("div"),
              width = args.width || 200,
              top = args.top || 0,
              left = args.left || 0,
              i;

          container.style.position = "absolute";
          container.style.top = top;
          container.style.left = left;
          container.style.width = width;
          container.style.zIndex = parseInt(options.order) + 1000;
          container.classList.add("pop");
          
          target.appendChild( container );

          if( typeof args.text === "string" ) {
            _makeBubble( { text: args.text, style: args.style, classes: args.classes } );
          }
          else if ( typeof args.text === "object" ) {
            for(i = 0; i<args.text.length; i++) {

              args.text[i].classes || ( args.text[i].classes = "" );
              //Set the default type to be none instead of speech
              if( args.text[i].style === undefined) {
                args.text[i].style = "none";
              }
              if( i !== args.text.length - 1 ) {
                args.text[i].classes += " pipe";
              }
              _makeBubble( { text: args.text[i].text, style: args.text[i].style, classes: args.text[i].classes + " full-width" } );
            }
          }

          function _makeBubble( bubbleArgs ) {
            var bubble = document.createElement("div"),
                innerText = document.createElement("div"),
                text = bubbleArgs.text || "",
                style = bubbleArgs.style || "speech",
                classes = bubbleArgs.classes || "bottom right",
                textClasses = options.textClasses;

            innerText.innerHTML = text;
            textClasses && ( innerText.className = "text " + textClasses ) || ( innerText.className = "text");
            bubble.appendChild( innerText );
            container.appendChild( bubble );
            _makeTriangle( bubble, { style: style, classes: classes } );
            
            //Now, export the container.
            options._container = container;
          }

          function _makeTriangle( bubble, args ) {
            !args && ( args = {} );
            args.style || ( args.style = "" );

            var elem,
                triangle,
                pipe,
                ctx,
                classes = args.classes || "bottom right";

            //Check if the input is a string or an actual element
            if (typeof bubble === "string") {
              elem = document.getElementById(bubble);
            } else {
              elem = bubble;
            }

            //Set the base classes
            elem.className =  "speechBubble " + args.style + " " + classes;

            //Speech bubble
            if( args.style === "speech" || args.style === "thought" ){
              
              triangle = document.createElement("canvas");
              ctx = triangle.getContext("2d");

              triangle.width = 40;
              triangle.height = 60;
              triangle.className = "canvas"
              elem.appendChild( triangle );

              //Draw according to the style
              args.style === "speech" && drawSpeech( ctx );
              args.style === "thought" && drawThought( ctx );
            }

            //Pipe
            if ( args.classes && args.classes.indexOf("pipe") !== -1 ){
              elem.className +=  " connected pipe";
              pipe = document.createElement("div");
              pipe.className = "pipe";
              elem.appendChild( pipe );
            }

            function drawSpeech(ctx) {
              ctx.save();
              ctx.beginPath();
              ctx.moveTo(0.4, 0.3);
              ctx.bezierCurveTo(0.4, 0.3, 17.8, 26.3, 15.1, 41.9);
              ctx.bezierCurveTo(15.1, 41.9, 26.2, 26.3, 23.4, 0.3);
              ctx.fillStyle = "rgb(255, 255, 255)";
              ctx.fill();
              ctx.lineWidth = 2;
              ctx.stroke();
              ctx.restore();
            }

            function drawThought(ctx) {
               // circle1
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(13.5, 7.0);
                ctx.bezierCurveTo(13.5, 10.6, 10.6, 13.5, 7.0, 13.5);
                ctx.bezierCurveTo(3.4, 13.5, 0.5, 10.6, 0.5, 7.0);
                ctx.bezierCurveTo(0.5, 3.4, 3.4, 0.5, 7.0, 0.5);
                ctx.bezierCurveTo(10.6, 0.5, 13.5, 3.4, 13.5, 7.0);
                ctx.closePath();
                ctx.fillStyle = "rgb(255, 255, 255)";
                ctx.fill();
                ctx.lineWidth = 2;
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
                ctx.lineWidth = 2;
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
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
            }
          }
        } //addSpeechBubble
  
      },
      start: function( event, options ) {
        options._container.classList.add( "on" );
      },
    
      end: function( event, options ) {
        options._container.classList.remove( "on" );
      },
      _teardown: function( options ) {
        if( options._container && options._container.parentNode ) {
          options._container.parentNode.removeChild( options._container );
        }
      }
  });
})( Popcorn );
