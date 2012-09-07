(function( Popcorn ) {
  Popcorn.plugin( "skip", function() {

    return {
      _setup: function( options ) {
        var skipTime = options.end;
        
        options.skipRange = function() {
          var ct = this.currentTime();
          if ( ct > options.start && ct < options.end ) {
            this.currentTime( skipTime );
          }
        };
        options.toString = function() {
          return "Skip";
        };

        this.on( "timeupdate", options.skipRange );
       
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
