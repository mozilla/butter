(function( Popcorn ) {
  Popcorn.plugin( "jump", function() {
    return {
      _setup: function( options ) {
        options.toString = function() {
          return "Jump to " + options.jump;
        };
      },
      start: function( event, options ) {
        if ( !this.seeking() ) {
          this.currentTime( +options.jump );
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
      },
      "jump": {
        "label": "Jump to time",
        "elem": "input",
        "type": "number",
        "units": "seconds"
      }
    }
  });
}( Popcorn ));
