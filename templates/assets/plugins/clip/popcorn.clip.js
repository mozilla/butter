(function( Popcorn ) {
  var clipUpdate;
  Popcorn.plugin( "clip", function() {
    return {
      _setup: function( options ) {
        this.on( "ended", function(e) {
        });
        if ( clipUpdate ) {
          this.off( "timeupdate", clipUpdate );
        }
        clipUpdate = function() {
          var time = this.currentTime();

          if ( time < options.start || time > options.end ) {
            this.currentTime( options.start );
          }
        };

        this.on( "timeupdate", clipUpdate );

        options.toString = function() {
          return "Only this section will be played";
        };
      },
      start: function( event, options ) {
      },
      end: function( event, options ) {
          if ( options.loop ) {
            this.currentTime( options.start );
          } else {
            this.pause();
            this.emit( "ended" );
          }
      },
      _teardown: function( options ) {
        this.off( "timeupdate", clipUpdate );
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
      "loop": {
        "label": "Loop",
        "type": "checkbox",
        "default": true
      }
    }
  });
}( Popcorn ));
