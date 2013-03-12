(function( Popcorn ) {
  Popcorn.plugin( "pausePlugin", function() {
    var _this = this,
        _timeout,
        _seekedFunc = function() {
          if ( _timeout ) {
            clearTimeout( _timeout );
          }
          this.off( "seeked", _seekedFunc );
        };
    return {
      _setup: function( options ) {
        options.toString = function() {
          return "Pause " + ( options.duration > 0 ? options.duration : "forever" );
        };
      },
      start: function( event, options ) {
        // we need to add this on start as well because we can run into a race condition where 'seeked' is fired before
        // end is fired, or vice versa
        this.on( "seeked", _seekedFunc );
        this.pause();
        if ( +options.duration > 0 ) {
          _timeout = setTimeout(function() {
            _this.play();
            _this.off( "seeked", _seekedFunc );
          }, options.duration * 1000 );
        }
      },
      end: function() {
        // we need to add this on end instead of start because when seeking outside of an active trackevent,
        // end automatically gets fired
        this.on( "seeked", _seekedFunc );
      }
    };
  },
  {
    "displayName": "Pause",
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
      "duration": {
        "elem": "input",
        "type": "number",
        "label": "Pause Duration (0 = forever)",
        "units": "seconds",
        "default": "0"
      },
      "target": {
        "hidden": true
      }
    }
  });
}( Popcorn ));
