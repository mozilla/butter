// PLUGIN: text

(function ( Popcorn ) {

  /**
   * text Popcorn plug-in
   * Based on popcorn.text.js by @humph
   * @param {Object} options
   *
   * Example:

   **/

  Popcorn.plugin( "container", {

    manifest: {
      about: {
        name: "Popcorn text Plugin",
        version: "0.1",
        author: "@k88hudson, @mjschranz"
      },
      options: {
        target: {
          elem: "input",
          type: "text",
          label: "Target"
        },
        id: {
          elem: "input",
          type: "text",
          label: "Id"
        },
        start: {
          elem: "input",
          type: "text",
          label: "In",
          "units": "seconds"
        },
        end: {
          elem: "input",
          type: "text",
          label: "Out",
          "units": "seconds"
        },
        left: {
          elem: "input",
          type: "number",
          label: "Left",
          units: "%",
          "default": 25,
          hidden: true
        },
        top: {
          elem: "input",
          type: "number",
          label: "Top",
          units: "%",
          "default": 0,
          hidden: true
        },
        width: {
          elem: "input",
          type: "number",
          units: "%",
          label: "Width",
          "default": 50,
          hidden: true
        },
        height: {
          elem: "input",
          type: "number",
          units: "%",
          label: "Height",
          "default": 20,
          hidden: true
        },
        zindex: {
          hidden: true
        }
      }
    },

    _setup: function( options ) {
      var target = Popcorn.dom.find( options.target ),
          container = Popcorn.dom.find( options.id );

      if ( !container ) {
        container = document.createElement( "div" );

        if ( options.id ) {
          container.id = options.id;
        } else {
          container.id = "container" + Popcorn.guid();
        }

        target.appendChild( container );
      }

      options._container = container;

      if ( !target ) {
        target = this.media.parentNode;
      }

      options._target = target;
      container.style.position = "absolute";

      container.style.left = options.left + "%";
      container.style.top = options.top + "%";
      if ( options.width ) {
        container.style.width = options.width + "%";
      }
      if ( options.height ) {
        container.style.height = options.height + "%";
      }
      container.style.zIndex = +options.zindex;

      options.toString = function() {
        // use the default option if it doesn't exist
        return container.id;
      };
    },

    start: function( event, options ) {
      if ( options._container ) {
        options._container.style.display = "block";
      }
    },

    end: function( event, options ) {
      if ( options._container ) {
        options._container.style.display = "none";
      }
    },

    _teardown: function( options ) {
      // can remove the element after all
      //if ( options._container ) {
      //  options._container.style.display = "none";
      //}
    }
  });
}( window.Popcorn ));
