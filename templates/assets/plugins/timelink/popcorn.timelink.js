// PLUGIN: Shrink

(function ( Popcorn ) {

  /**
   * Shrink plug-in
   * Created for the newscaster template
   *
   */

  Popcorn.plugin( "timelink", {

    manifest: {
      about: {
        name: "Popcorn Timelink Plugin",
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
        linkID: {
          elem: "input",
          type: "text",
          label: "Link ID",
          "default": "link"
        }
      }
    },

    _setup: function( options ) {

      var target,
          text,
          _popcorn = this;

      options._link = options.linkEl || document.getElementById( options.linkID );

      function _timelink( e ) {
        e.preventDefault();
        _popcorn.currentTime( options.start );
      }

      options._link.addEventListener( "click", _timelink, false);

    },

    /**
     * @member text
     * The start function will be executed when the currentTime
     * of the video  reaches the start time provided by the
     * options variable
     */
    start: function( event, options ) {
      options._link.classList.add( "active" );
    },

    /**
     * @member text
     * The end function will be executed when the currentTime
     * of the video  reaches the end time provided by the
     * options variable
     */
    end: function( event, options ) {
      options._link.classList.remove( "active" );
    },

    _teardown: function( options ) {
      options._link.classList.remove( "active" );
    }
  });
})( Popcorn );
