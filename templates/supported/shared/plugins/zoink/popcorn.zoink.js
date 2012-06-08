// PLUGIN: ZOINK

(function ( Popcorn ) {
  
/**
  Popcorn zoink

  This plugin creates a small, animated annotation using canvas and css3.
  You can choose from:
    speech - speech bubble
    thought - thought bubble
    fact - an annotation with a green 'fact' label
    fiction - an annotation with a red 'fiction' label
    icon - an icon-only annotation
  You MUST include popcorn.zoink.css in your html page for it to work.

 */
  Popcorn.plugin( "zoink", {
      manifest: {
        about: {
          name: "Popcorn Zoink Plugin",
          version: "0.1",
          author: "Kate Hudson @k88hudson",
          website: "http://github.com/k88hudson"
        },
        options: {
          start: {
            elem: "input",
            type: "number",
            label: "In",
            hidden: true
          },
          end: {
            elem: "input",
            type: "number",
            label: "Out",
            hidden: true
          },
          text: {
            elem: "input",
            type: "text",
            label: "Text",
            "default": "Edit me"
          },
          style: {
            elem: "select",
            options: [ "speech", "thought", "fact", "fiction", "icon", "none" ],
            type: "text",
            label: "Style:"
          },
          order: {
            elem: "select",
            options: [ 1, 2, 3 ],
            type: "text",
            label: "Layer order:",
            "default": 1
          },
          classes: {
            elem: "input",
            type: "text",
            label: "Classes (top, bottom, left, right, flip, pipe, fx)"
          },
          top: {
            elem: "input",
            type: "text",
            label: "Top:",
            "default": "200px"
          },
          left: {
            elem: "input",
            type: "text",
            label: "Left:",
            "default": "200px"
          },
          width: {
            elem: "input",
            type: "text",
            label: "Max width:",
            "default": "200px"
          },
          target: "video-overlay"
        }
      },
      _setup: function( options ) {

        var target = document.getElementById( options.target ),
            container = options._container = document.createElement("div"),
            _options = {},
            context = this;

        if ( !target ) {
          target = context.media.parentNode;
        }

        options._target = target;


        function speechBubble() {
          var width = options.width || "200px",
              top = options.top,
              left = options.left,
              style = container.style;

          function _makeTriangle( bubble ) {
            options.style || ( options.style = "" );

            var triangle,
                pipe,
                ctx,
                classes = options.classes || "bottom right";

            function addDidYouKnow( style ){
              var el = document.createElement("div");

              el.innerHTML = "Did you know?";
              el.innerHTML = ( style === "fact" && "Fact!" ) || ( style === "fiction"  && "Fiction!" );

              el.classList.add("zoink-didyouknow");
              style && style !== "didyouknow" && el.classList.add( style );
              bubble.appendChild( el );
              elem.className += " didyouknow";
            }

            function drawSpeech( ctx ) {
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

            function drawThought( ctx ) {
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

            //Set the base classes
            bubble.className =  "speechBubble " + options.style + " " + classes;

            //Speech bubble
            if( options.style === "speech" || options.style === "thought" ){
              
              triangle = document.createElement("canvas");
              ctx = triangle.getContext("2d");

              triangle.width = 40;
              triangle.height = 60;
              triangle.className = "canvas";
              bubble.appendChild( triangle );

              //Draw according to the style
              options.style === "speech" && drawSpeech( ctx );
              options.style === "thought" && drawThought( ctx );
            }

            if ( options.style === "didyouknow" || options.style === "fact" || options.style === "fiction" ) {
              addDidYouKnow( options.style );
            }

            //Pipe
            if ( options.classes && options.classes.indexOf("pipe") !== -1 ){
              bubble.className +=  " connected pipe";
              pipe = document.createElement("div");
              pipe.className = "pipe";
              bubble.appendChild( pipe );
            }
          } //makeTriangle

          function _makeBubble() {
            var bubble = document.createElement("div"),
                innerText = document.createElement("div"),
                text = options.text || "",
                style = options.style || "speech",
                classes = options.classes || "bottom right",
                textClasses = options.textClasses;

            innerText.innerHTML = text;
            innerText.className = "text" + textClasses && ( " " + textClasses );
            bubble.appendChild( innerText );
            container.appendChild( bubble );
            _makeTriangle( bubble );
          }

          style.position = "absolute";
          style.top = top;
          style.left = left;
          style.width = width;
          style.zIndex = +options.order + 1000;
          container.classList.add( "pop" );
          
          target.appendChild( container );

          if( options.style === "icon" ) {
            style.width = "";
            style.height = "";
            container.classList.add( (options.classes && "zoink-icon-" + options.classes) || "zoink-icon-check" );
            return;
          }
          _makeBubble();
        } //speechBubble
  
      //Create the bubble
      speechBubble();
      options.callback && options.callback( options._container );

      },

      start: function( event, options ) {
        options._container.classList.add( "on" );
      },

      end: function( event, options ) {
        options._container.classList.remove( "on" );
      },
      
      _teardown: function( options ) {
        if( options._container && options._target ) {
          options._target.removeChild( options._container );
        }
      } 
    });
})( Popcorn );
