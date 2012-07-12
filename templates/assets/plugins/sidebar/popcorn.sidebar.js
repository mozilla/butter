// PLUGIN: Shrink

(function ( Popcorn ) {

  /**
   * Shrink plug-in
   * Created for the newscaster template
   *
   */

  Popcorn.plugin( "sidebar", {

    manifest: {
      about: {
        name: "Popcorn Sidebar Plugin",
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
          "default": "embed-wrapper"
        }
      }
    },

    _setup: function( options ) {

      var target,
          text,
          _popcorn = this;

      options._videoContainer = document.getElementById( options.containerID ) || _popcorn.media;
    },

    /**
     * @member text
     * The start function will be executed when the currentTime
     * of the video  reaches the start time provided by the
     * options variable
     */
    start: function( event, options ) {
      options._videoContainer.classList.add( "wrapper-sidebar" );
    },

    /**
     * @member text
     * The end function will be executed when the currentTime
     * of the video  reaches the end time provided by the
     * options variable
     */
    end: function( event, options ) {
      options._videoContainer.classList.remove( "wrapper-sidebar" );
    },

    _teardown: function( options ) {
      //
    }
  });
})( Popcorn );
