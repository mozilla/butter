// PLUGIN: text

(function ( Popcorn ) {

  /**
   * text Popcorn plug-in
   * Based on popcorn.text.js by @humph
   * @param {Object} options
   *
   * Example:

   **/

  Popcorn.plugin( "rotate", {

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
        rotate: {
          elem: "input",
          type: "number",
          label: "Rotate",
          "default": 360
        }
      }
    },

    _setup: function( options ) {
      options._duration = options.end - options.start;
      options._target = document.getElementById( options.target );

      options.toString = function() {
        // use the default option if it doesn't exist
        return options.rotate;
      };

      options._timeUpdate = function() {};
    },

    start: function( event, options ) {
      var _this = this;
      options._timeUpdate = function() {
        var time = _this.currentTime() - options.start;
        var percent = time / options._duration;
        var rotate = options.rotate * percent;
        options._target.style.transform = "rotate(" + rotate + "deg)";
      };
      options._timeUpdate();
      this.on( "timeupdate", options._timeUpdate );
    },

    end: function( event, options ) {
      this.off( "timeupdate", options._timeUpdate );
      options._timeUpdate = function() {};
      options._target.style.transform = "";
    },

    _teardown: function( options ) {
      //if ( options._container ) {
      //  options._container.style.display = "none";
      //}
    }
  });
}( window.Popcorn ));
