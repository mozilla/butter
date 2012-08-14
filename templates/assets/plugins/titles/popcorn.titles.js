// PLUGIN: titles

(function ( Popcorn ) {

  /**
   * titles Popcorn plug-in
   * Based on popcorn.text.js by @humph
   * @param {Object} options
   *
   * Example:
  
   **/

  // Assumes the video is wrapped in a container.
  function createContainer( context, id ) {
    var ctxContainer = context.container = document.createElement( "div" ),
        style = ctxContainer.style,
        media = context.media;

    ctxContainer.id = id || "popcorn-titles-" + Popcorn.guid();
    style.position = "absolute";
    style.left = 0;
    style.bottom = "35px";

    media.parentNode.appendChild( ctxContainer );
    return ctxContainer;
  }

  Popcorn.plugin( "titles", {

    manifest: {
      about: {
        name: "Popcorn titles Plugin",
        version: "0.1",
        author: "@k88hudson, @mjschranz"
      },
      options: {
        start: {
          elem: "input",
          type: "text",
          label: "In"
        },
        end: {
          elem: "input",
          type: "text",
          label: "Out"
        },
        text: {
          elem: "input",
          type: "text",
          label: "Text",
          "default": "Popcorn.js"
        },
        innerContainerLayout: {
          elem: "select",
          options: [ "Left", "Right" ],
          values: [ "left", "right" ],
          label: "Layout",
          "default": ""
        },
        containerStyle: {
          elem: "select",
          options: [ "Titles", "News" ],
          values: [ "popcorn-titles", "popcorn-news" ],
          label: "Container Classes",
          "default": "popcorn-titles"
        },
        transitionSpeed: {
          elem: "select",
          options: [ "Slow", "Normal", "Fast" ],
          values: [ "slow", "normal", "fast" ],
          label: "Transition Speed",
          "default": "normal"
        }
      }
    },

    _setup: function( options ) {

      var target = Popcorn.dom.find( options.target ),
          text = options.text,
          innerContainer = document.createElement( "div" ),
          innerContainerClasses = ( options.innerContainerClasses && options.innerContainerClasses.split( " " ) ) || [],
          container = options._container = document.createElement( "div" ),
          // See DURATION section of popcorn.transition.css
          transitionSpeed = options.transitionSpeed,
          transitionClass = "popcorn-transition-" + transitionSpeed,
          i, l;

      options.inactiveClass = "popcorn-off";
      options.activeClass = "popcorn-on";

      // --------------------------------------
      // PREPARE THE TARGET

      //Check if it exists
      if ( !target ) {
        target = options._newContainer = createContainer( this, options.target );
      }
      // Cache reference to actual target container
      options._target = target;


      // --------------------------------------
      // PREPARE THE CONTAINER

      // Add each class to the inner container
      innerContainer.classList.add( options.innerContainerLayout );

      // Add each class to the outer container
      container.className = "popcorn-transition";
      container.classList.add( options.containerStyle );

      // Add transition styles and hide on setup
      container.classList.add( transitionClass );
      container.classList.add( options.inactiveClass );
      //Add the text, and append to target.
      innerContainer.innerHTML = text || "";
      container.appendChild( innerContainer );
      target.appendChild( container );

      options.toString = function() {
        // use the default option if it doesn't exist
        return options.text || options._natives.manifest.options.text[ "default" ];
      };
    },

    start: function( event, options ) {
      options._container.classList.add( options.activeClass );
      options._container.classList.remove( options.inactiveClass );
    },

    end: function( event, options ) {
      options._container.classList.add( options.inactiveClass );
      options._container.classList.remove( options.activeClass );
    },

    _teardown: function( options ) {
      var target = options._target,
          newContainer = options._newContainer;
      if ( target ) {
        target.removeChild( options._container );
      }
      //If we created a new container, we should remove it now.
      if ( newContainer && newContainer.parentNode ) {
        newContainer.parentNode.removeChild( newContainer );
      }
    }
  });
}( window.Popcorn ));
