// PLUGIN: Context Switcher

(function ( Popcorn ) {

  /**
   * Context Switcher Popcorn plug-in
   *
   */

  // Cache styleSheet so it is not added twice
  var contextSwitcherStyles;

  Popcorn.plugin( "context-switcher", {

    manifest: {
      about: {
        name: "Popcorn Context Switcher Plugin",
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
        containerID: {
          elem: "input",
          type: "text",
          label: "Container ID",
          "default": "video-container"
        }
      }
    },

    _setup: function( options ) {

      var target,
          text,
          _popcorn = this;

       if (!contextSwitcherStyles) {
          contextSwitcherStyles = document.createElement('style');
          contextSwitcherStyles.setAttribute('type', 'text/css');
          contextSwitcherStyles.appendChild(document.createTextNode( "" +
            ".context-switcher {\n"+
            "  -webkit-transition: all .3s linear\n"+
            "  -moz-transition: all .3s linear\n"+
            "  -o-transition: all .3s linear\n"+
            "  transition: all .3s linear\n"+
            "}\n"+
            ".context-switcher.context-switcher-tiny {\n"+
            "  -webkit-transform: scale(.25,.25);\n"+
            "  -webkit-transform-origin: top center;\n"+
            "  -webkit-transition: all .3s linear\n"+
            "  -moz-transform: scale(.25,.25);\n"+
            "  -moz-transform-origin: top center;\n"+
            "  -moz-transition: all .3s linear\n"+
            "  -o-transform: scale(.25,.25);\n"+
            "  -o-transform-origin: top center;\n"+
            "  -o-transition: all .3s linear\n"+
            "  transform: scale(.25,.25);\n"+
            "  transform-origin: top center;\n"+
            "  transition: all .3s linear\n"+
            "}"
            ));
          document.head.appendChild(contextSwitcherStyles);
        }

      options._videoContainer = document.getElementById( options.containerID ) || _popcorn.media;
      options._videoContainer.classList.add( "context-switcher" );
    },

    /**
     * @member text
     * The start function will be executed when the currentTime
     * of the video  reaches the start time provided by the
     * options variable
     */
    start: function( event, options ) {
      options._videoContainer.classList.add( "context-switcher-tiny" );
    },

    /**
     * @member text
     * The end function will be executed when the currentTime
     * of the video  reaches the end time provided by the
     * options variable
     */
    end: function( event, options ) {
      options._videoContainer.classList.remove( "context-switcher-tiny" );
    },

    _teardown: function( options ) {
      contextSwitcherStyles && document.head.removeChild( contextSwitcherStyles );
      contextSwitcherStyles = undefined;
      options._videoContainer.classList.remove( "context-switcher" );
      options._videoContainer.classList.remove( "context-switcher-tiny" );
    }
  });
})( Popcorn );
