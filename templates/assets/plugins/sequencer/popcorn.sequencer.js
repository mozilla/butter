// PLUGIN: sequencer

(function (Popcorn) {

  function validateDimension( value, fallback ) {
    if ( typeof value === "number" ) {
      return value;
    }
    return fallback;
  }

  Popcorn.plugin( 'sequencer', {
    _setup: function( options ) {
      var container = document.createElement( "div" ),
          mouseDiv = document.createElement( "div" ),
          target = Popcorn.dom.find( options.target ),
          that = this;

      if ( !target ) {
        target = that.media.parentNode;
      }

      options._target = target;
      options._container = container;
      options._mouseDiv = mouseDiv;

      container.style.zIndex = +options.zindex;
      container.className = "popcorn-sequencer";
      container.style.position = "absolute";
      container.style.display = "none";
      container.style.width = validateDimension( options.width, "100" ) + "%";
      container.style.height = validateDimension( options.height, "100" ) + "%";
      container.style.top = validateDimension( options.top, "0" ) + "%";
      container.style.left = validateDimension( options.left, "0" ) + "%";
      mouseDiv.style.position = "absolute";
      mouseDiv.style.width = "100%";
      mouseDiv.style.height = "100%";
      mouseDiv.style.top = "0";
      mouseDiv.style.left = "0";

      if ( target ) {
        target.appendChild( container );
        container.appendChild( mouseDiv );
      }

      options.readyEvent = function() {
        if ( !options.ready ) {
          var targetTime = that.currentTime() - options.start + ( +options.from );
          options.ready = true;
          options.p.volume( options.volume );
          if ( targetTime !== options.p.currentTime() ) {
            options.p.currentTime( targetTime );
          }
          if ( !that.paused() ) {
            options.p.play();
          }
        }
      };

      if ( options.source ) {
        options.p = Popcorn.smart( container, options.source, {frameAnimation: true} );
        options.p.media.style.width = "100%";
        options.p.media.style.height = "100%";
        container.style.width = validateDimension( options.width, "100" ) + "%";
        container.style.height = validateDimension( options.height, "100" ) + "%";
        if ( options.p.media.readyState >= 4 ) {
          options.readyEvent();
        } else {
          options.p.on( "canplaythrough", options.readyEvent );
        }
      }

      options._playEvent = function() {
        options.p.play( that.currentTime() - options.start + (+options.from) );
      };

      options._pauseEvent = function() {
        options.p.pause();
      };

      options._seekingEvent = function() {
        if ( options.ready && !options.p.paused() ) {
          options.p.pause();
        }
      };

      options._seekedEvent = function() {
        if ( options.ready ) {
          if ( options.p.paused() && !that.paused() ) {
            options.p.play();
          }
          options.p.currentTime( that.currentTime() - options.start + (+options.from) );
        }
      };
    },
    _teardown: function( options ) {
//      options._target.removeChild( options._container );
    },
    start: function( event, options ) {
      var targetTime;
      this.on( "play", options._playEvent );
      this.on( "pause", options._pauseEvent );
  		this.on( "seeking", options._seekingEvent );
			this.on( "seeked", options._seekedEvent );
      if ( options.ready ) {
        targetTime = this.currentTime() - options.start + (+options.from);
        if ( targetTime !== options.p.currentTime() ) {
          options.p.currentTime( targetTime );
        }
        if ( !this.paused() ) {
          options.p.play();
        }
      }
      options._container.style.display = "block";
    },
    end: function( event, options ) {
      this.off( "play", options._playEvent );
      this.off( "pause", options._pauseEvent );
  		this.off( "seeking", options._seekingEvent );
			this.off( "seeked", options._seekedEvent );
      if ( options.ready ) {
        options.p.pause();
      }
      options._container.style.display = "none";
    },
    manifest: {
      about: {},
      options: {
        start: {
          elem: "input",
          type: "seconds",
          label: "Start"
        },
        end: {
          elem: "input",
          type: "seconds",
          label: "End"
        },
        source: {
          elem: "input",
          type: "url",
          label: "Source URL"
        },
        width: {
          elem: "input",
          type: "number",
          label: "Width",
          "default": 100,
          "units": "%",
          hidden: true
        },
        height: {
          elem: "input",
          type: "number",
          label: "Height",
          "default": 100,
          "units": "%",
          hidden: true
        },
        top: {
          elem: "input",
          type: "number",
          label: "Top",
          "default": 0,
          "units": "%",
          hidden: true
        },
        left: {
          elem: "input",
          type: "number",
          label: "Left",
          "default": 0,
          "units": "%",
          hidden: true
        },
        from: {
          "elem": "input",
          "type": "number",
          "label": "Start at",
          "units": "seconds",
          "default": "0"
        },
        volume: {
          elem: "input",
          type: "number",
          label: "Volume",
          "default": 1
        },
        zindex: {
          hidden: true
        }
      }
    }
  });

}(Popcorn));

