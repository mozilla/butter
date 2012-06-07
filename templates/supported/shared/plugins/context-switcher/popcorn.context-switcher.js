// PLUGIN: Context Switcher

(function ( Popcorn ) {

  /**
   * Context Switcher Popcorn plug-in
   *
   */

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
      options._videoContainer.classList.remove( "context-switcher" );
      options._videoContainer.classList.remove( "context-switcher-tiny" );
    }
  });
})( Popcorn );
