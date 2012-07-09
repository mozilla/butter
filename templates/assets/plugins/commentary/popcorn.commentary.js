// PLUGIN: Shrink

(function ( Popcorn ) {

  /**
   * Shrink plug-in
   * Created for the newscaster template
   *
   */

  Popcorn.plugin( "commentary", {

    manifest: {
      about: {
        name: "Popcorn Commentary Plugin",
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
          label: "Title",
          "default": "Table of Comments"
        },
        target: {
          elem: "input",
          type: "text",
          label: "sidebarID",
          "default": "sidebar"
        },
        embedID: {
          elem: "input",
          type: "text",
          label: "embedID",
          "default": "embed-wrapper"
        }
      }
    },

    _setup: function( options ) {

      var wrapper = document.getElementById( options.embedID ),
          target = document.getElementById( options.target ),
          container = document.createElement( "ul" ),
          _popcorn = this,
          i;

      // Cache target and container
      options._wrapper = wrapper;
      options._container = container;
      options._target = target;

      container.classList.add( "popcorn-toc" );

      for ( i=0; i<options.commentary.length; i++ ) {

        (function( commentary, next ) {
          var li = document.createElement( "li" ),
              a = document.createElement( "a" ),
              defn = document.createElement( "div" ),
              startString = commentary.time,
              start = Popcorn.util.toSeconds( commentary.time ),
              end = next && next.time || _popcorn.duration();

          a.innerHTML = commentary.title + " <span class=\"time-string\">" + startString + "</span> ";
          a.setAttribute( "data-t", start );
          a.addEventListener( "click", function() {
            a.classList.add( "active" );
            _popcorn.currentTime( start );
            _popcorn.play();
          }, false);

          defn.innerHTML = commentary.description;
          defn.classList.add( "definition" );

          _popcorn.timelink({
            start: start,
            end: end,
            linkEl: a
          });

          li.appendChild( a );
          li.appendChild( defn );
          container.appendChild( li );

        }( options.commentary[ i ], options.commentary[ i + 1 ] ));

      }

      target.appendChild( container );

    },

    /**
     * @member text
     * The start function will be executed when the currentTime
     * of the video  reaches the start time provided by the
     * options variable
     */
    start: function( event, options ) {
      options._wrapper.classList.add( "wrapper-sidebar" );
    },

    /**
     * @member text
     * The end function will be executed when the currentTime
     * of the video  reaches the end time provided by the
     * options variable
     */
    end: function( event, options ) {
      options._wrapper.classList.remove( "wrapper-sidebar" );
    },

    _teardown: function( options ) {
      options._target.removeChild( options._container );
    }
  });
})( Popcorn );
