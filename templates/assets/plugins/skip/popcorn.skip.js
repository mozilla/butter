(function( Popcorn ) {
  Popcorn.plugin( "skip", function() {
    return {
      _setup: function( options ) {
        options.toString = function() {
          return "This section will not be played";
        };
      },
      start: function( event, options ) {
        if ( !this.seeking() ) {
          this.currentTime( +options.end );
        }
      },
      end: function( event, options ) {

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
