// PLUGIN: titles

(function ( Popcorn ) {

  /**
   * titles Popcorn plug-in
   * Based on popcorn.text.js by @humph
   * @param {Object} options
   *
   * Example:
  
   **/

  //STYLES AND DEFAULTS FOR ROBOTS
  var robots = {};

  robots.defaults = {
    containerClasses: "popcorn-transition popcorn-titles",
    activeClass: "popcorn-on",
    inactiveClass: "popcorn-off"
  };

  robots.styleNames = [
    "Top Title",
    "Middle Title",
    "Bottom Title"
  ];

  robots.styles = {
    "Top Title": "top-title popcorn-effect-blur popcorn-effect-rumble-play",
    "Middle Title": "mid-title popcorn-effect-blur popcorn-effect-rumble-play",
    "Bottom Title": "bottom-title popcorn-effect-blur"
  };

  robots.targets = {
    "Top Title": "top-title",
    "Middle Title": "mid-title",
    "Bottom Title": "bottom-title"
  };


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
        author: "@k88hudson"
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
        styles: {
          elem: "select",
          options: robots.styleNames,
          label: "Styles",
          "default": robots.styleNames[0]
        },
        transitionSpeed: {
          elem: "select",
          options: ["slow", "normal", "fast"],
          label: "Transition speed",
          "default": "normal"
        }
      }
    },

    _setup: function( options ) {

      var defaults = robots.defaults,
          target,
          text = options.text,
          innerContainer = document.createElement( "div" ),
          innerContainerClasses = ( robots.styles[ options.styles ] && robots.styles[ options.styles ].split(" ") ) || [],
          container = options._container = document.createElement( "div" ),
          containerClasses = ( defaults.containerClasses && defaults.containerClasses.split(" ") ) || [],
          activeClass = options.activeClass = defaults.activeClass,
          inactiveClass = options.inactiveClass = defaults.inactiveClass,
          // See DURATION section of popcorn.transition.css
          transitionSpeed = options.transitionSpeed,
          transitionClass = "popcorn-transition-" + transitionSpeed,
          transitionValues = {
            slow: 0.6,
            fast: 0.15,
            normal: 0.3
          },
          transitionDuration = transitionValues[transitionSpeed],
          i,
          j;

      // --------------------------------------
      // PREPARE THE TARGET

      //Check if it exists
      if ( robots.targets[ options.styles ] ) {
        target = Popcorn.dom.find( robots.targets[ options.styles ] );
      }
      else if ( options.target ) {
        target = Popcorn.dom.find( options.target );
      }
      if ( !target ) {
        target = options._newContainer = createContainer( this, options.target );
      }
      // Cache reference to actual target container
      options._target = target;


      // --------------------------------------
      // PREPARE THE CONTAINER

      // Add each class to the inner container
      for( i=0; i< innerContainerClasses.length; i++ ){
        innerContainer.classList.add( innerContainerClasses[i] );
      }

      // Add each class to the outer container
      for( j=0; j<containerClasses.length; j++ ){
        container.classList.add( containerClasses[j] );
      }
      // Add transition styles and hide on setup
      container.classList.add( transitionClass );
      container.classList.add( inactiveClass );
      //Add the text, and append to target.
      innerContainer.innerHTML = text || "";
      container.appendChild( innerContainer );
      target.appendChild( container );

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
})( window.Popcorn );
