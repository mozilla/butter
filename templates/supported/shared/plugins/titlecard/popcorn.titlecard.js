// PLUGIN: titlecard

(function ( Popcorn ) {

  /**
   * titlecard Popcorn plug-in
   * Based on text plugin by @humph
   *
   **/

  // Assumes the video is wrapped in a container.
  function createContainer( context, id ) {
    var ctxContainer = context.container = document.createElement( "div" ),
      style = ctxContainer.style,
      media = context.media;

      ctxContainer.id = id || "";
      style.position = "absolute";
      style.left = 0;
      style.bottom = 0;

      media.parentNode.appendChild( ctxContainer );
      return ctxContainer;
    }

  Popcorn.plugin( "titlecard", {
    manifest: {
      about: {
        name: "Popcorn titlecard Plugin",
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
        title: {
          elem: "input",
          type: "text",
          label: "title",
          "default": "Popcorn rules dude!"
        },
        subheading: {
          elem: "input",
          type: "text",
          label: "Subheading",
          "default": "Popcorn.js"
        }
      }
    },

    _setup: function( options ) {

      var target,
          text,
          container = options._container = document.createElement( "div" ),
          h2 = options.title && "<h2>" + options.title + "</h2>\n" || "",
          h5 = options.subheading &&  "<h5>" + options.subheading + "</h5>\n" || "",
          titleString;

      container.classList.add( "title-card" );
      titleString = '<div class="title-card-wave"></div><div class="text-container"><div>'+h5+h2+'</div></div>';
      container.innerHTML = titleString;

      if ( options.target ) {
        // Try to use supplied target
        target = Popcorn.dom.find( options.target );
      }
      
      if ( !target ) {
        target = createContainer( this, options.target );
      }

      // cache reference to actual target container
      options._target = target;

      target.appendChild( container );
    },

    /**
     * @member text
     * The start function will be executed when the currentTime
     * of the video  reaches the start time provided by the
     * options variable
     */
    start: function( event, options ) {
      options._container.classList.add( "on" );
    },

    /**
     * @member text
     * The end function will be executed when the currentTime
     * of the video  reaches the end time provided by the
     * options variable
     */
    end: function( event, options ) {
      options._container.classList.remove( "on" );
    },

    _teardown: function( options ) {
      var target = options._target;
      target && target.removeChild( options._container );
    }
  });
})( Popcorn );
