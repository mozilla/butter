(function( Popcorn ) {
  Popcorn.plugin( "skip", function() {

    return {
      _setup: function( options ) {
        var skipTime = options.end;
        
        options.skipRange = function() {
          var ct = this.currentTime();
          if ( !this.paused() && ct > options.start && ct < options.end ) {
            this.currentTime( skipTime );
          }
        };
        options.toString = function() {
          return "Skip";
        };

        this.on( "timeupdate", options.skipRange );
       
      },
      start: function() {
      },
      end: function() {
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
      }
    }
  });
}( Popcorn ));
