// PLUGIN: Shrink

(function ( Popcorn ) {

  /**
   * Shrink plug-in
   * Created for the newscaster template
   *
   */

  Popcorn.plugin( "shrink", {

    manifest: {
      about: {
        name: "Popcorn Shrink Plugin",
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
      options._videoContainer.classList.add( "shrink" );
    },

    /**
     * @member text
     * The start function will be executed when the currentTime
     * of the video  reaches the start time provided by the
     * options variable
     */
    start: function( event, options ) {
      options._videoContainer.classList.add( "shrink-tiny" );
    },

    /**
     * @member text
     * The end function will be executed when the currentTime
     * of the video  reaches the end time provided by the
     * options variable
     */
    end: function( event, options ) {
      options._videoContainer.classList.remove( "shrink-tiny" );
    },

    _teardown: function( options ) {
      options._videoContainer.classList.remove( "shrink" );
      options._videoContainer.classList.remove( "shrink-tiny" );
    }
  });
})( Popcorn );
