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
            "default": "zoink!"
          },
          type: {
            elem: "select",
            options: [ "speech", "thought", "fact", "fiction", "icon", "none" ],
            type: "text",
            label: "Style:"
          },
          triangle: {
            elem: "select",
            options: ["top left", "top right", "bottom left", "bottom right"],
            label: "Speech bubble triangle position:"
          },
          flip: {
            elem: "input",
            type: "checkbox",
            label: "Flip triangle? "
          },
          classes: {
            elem: "select",
            options: ["none", "fx", "icon-check", "icon-x"],
            "default": "none",
            label: "Styles"
          },
          order: {
            elem: "select",
            options: [ 1, 2, 3 ],
            type: "text",
            label: "Layer order:",
            "default": 1
          },
          top: {
            elem: "input",
            type: "number",
            label: "Top:",
            units: "px",
            "default": 200
          },
          left: {
            elem: "input",
            type: "number",
            label: "Left:",
            units: "px",
            "default": 200
          },
          width: {
            elem: "input",
            type: "number",
            units: "px",
            label: "Max width:",
            "default": 200
          },
          target: "video-overlay"
        }
      },
      _setup: function( options ) {

        var target = document.getElementById( options.target ),
            container = options._container = document.createElement("div"),
            context = this;

        if ( !target ) {
          target = context.media.parentNode;
        }

        options._target = target;

        function speechBubble() {

          if( options.classes === "none" ){
            options.classes = "";
          }

          var width = normalize( options.width, 100, 700 ) + "px",
              top = normalize( options.top, -1000, 1000 ) + "px",
              left = normalize( options.left, -1000, 1000 ) + "px",
              style = container.style,
              flip = options.flip && " flip" || "";

          function _makeTriangle( bubble ) {
            options.type = options.type || "";

            var triangle,
                ctx;

            function addDidYouKnow( style ){
              var el = document.createElement("div");

              el.innerHTML = "Did you know?";
              el.innerHTML = ( style === "fact" && "Fact!" ) || ( style === "fiction"  && "Fiction!" );

              el.classList.add("zoink-didyouknow");
              style && style !== "didyouknow" && el.classList.add( style );
              bubble.appendChild( el );
              bubble.className += " didyouknow";
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

            bubble.className =  "speechBubble " + options.type + " " + options.triangle + " " + options.classes + flip;

            //Speech bubble
            if ( options.type === "speech" || options.type === "thought" ){
              
              triangle = document.createElement("canvas");
              ctx = triangle.getContext("2d");

              triangle.width = 40;
              triangle.height = 60;
              triangle.className = "canvas";
              bubble.appendChild( triangle );

              //Draw according to the style
              options.type === "speech" && drawSpeech( ctx );
              options.type === "thought" && drawThought( ctx );
            }

            if ( options.type === "didyouknow" || options.type === "fact" || options.type === "fiction" ) {
              addDidYouKnow( options.type );
            }

          } //makeTriangle

          function _makeBubble() {
            var bubble = document.createElement("div"),
                innerText = document.createElement("div"),
                text = options.text,
                textClasses = options.textClasses;

            innerText.innerHTML = text;
            innerText.classList.add("text");
            textClasses && innerText.classList.add(textClasses);
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

          if( options.type === "icon" ) {
            style.width = "";
            style.height = "";
            container.classList.add( (options.classes && "zoink-" + options.classes) || "zoink-icon-check" );
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
