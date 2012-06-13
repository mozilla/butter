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
        innerContainerClasses: {
          elem: "input",
          type: "text",
          label: "Inner Container Classes (separate with a space)",
          "default": ""
        },
        containerClasses: {
          elem: "input",
          type: "text",
          label: "Container Classes (separate with a space)",
          "default": "popcorn-transition popcorn-titles"
        },
        activeClass: {
          elem: "input",
          type: "text",
          label: "Active Class",
          "default": "popcorn-on"
        },
        inactiveClass: {
          elem: "input",
          type: "text",
          label: "Inactive Class",
          "default": "popcorn-off"
        },
        transitionSpeed: {
          elem: "select",
          options: ["slow", "normal", "fast"],
          label: "Transition Duration",
          "default": "normal"
        }
      }
    },

    _setup: function( options ) {

      var target,
          text = options.text,
          innerContainer = document.createElement( "div" ),
          innerContainerClasses = ( options.innerContainerClasses && options.innerContainerClasses.split(" ") ) || [],
          container = options._container = document.createElement( "div" ),
          containerClasses = ( options.containerClasses && options.containerClasses.split(" ") ) || [],
          inactiveClass = options.inactiveClass,
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
      if ( options.target ) {
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
