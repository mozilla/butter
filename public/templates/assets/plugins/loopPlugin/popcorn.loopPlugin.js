(function( Popcorn ) {
  Popcorn.plugin( "loopPlugin", function() {
    return {
      _setup: function( options ) {
        options.loop = options.loop || 0;
        options.count = +options.loop;
        options.toString = function() {
          return "Loop: " + ( options.loop > 0 ? options.count : "forever" );
        };
      },
      start: function() {
      },
      end: function( event, options ) {
          if ( ( this.currentTime() > options.end + 1 || this.currentTime() < options.end - 1 ) || this.seeking() || this.paused() ) {
            options.count = +options.loop;
            return;
          }
          if ( options.count > 0 || +options.loop === 0 ) {
            this.currentTime( options.start );
            if ( options.loop ) {
              options.count--;
            }
          } else {
            options.count = +options.loop;
          }
      }
    };
  },
  {
    "displayName": "loop",
    "options": {
      "start": {
        "elem": "input",
        "type": "text",
        "label": "In",
        "units": "seconds"
      },
      "end": {
        "elem": "input",
        "type": "text",
        "label": "Out",
        "units": "seconds"
      },
      "target": {
        "hidden": true
      },
      "loop": {
        "label": "Number of loops (0 = forever)",
        "elem": "input",
        "type": "number",
        "default": 0
      }
    }
  });
}( Popcorn ));
