(function( Popcorn ) {
  Popcorn.plugin( "skip", function() {
    return {
      _setup: function( options ) {
        var skipRange = options.skipRange = function() {
          if ( this.currentTime() > options.start && this.currentTime() < options.end ) {
            this.currentTime( options.end );
          }
        };
        this.on( "timeupdate", skipRange );
        options.toString = function() {
          return "This section will not be played";
        };
      },
      start: function( event, options ) {
      },
      end: function( event, options ) {
      },
      _teardown: function( options ) {
        this.off( "timeupdate", options.skipRange );
      }
    };
  },
  {
    "options": {
      "start": {
        "elem": "input",
        "type": "text",
        "label": "In"
      },
      "end": {
        "elem": "input",
        "type": "text",
        "label": "Out"
      },
      "target": {
        "hidden": true
      }
    }
  });
}( Popcorn ));
