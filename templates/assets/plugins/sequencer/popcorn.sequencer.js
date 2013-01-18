// PLUGIN: sequencer

(function (Popcorn) {

  var MEDIA_LOAD_TIMEOUT = 10000;
 
  Popcorn.plugin( 'sequencer', {
    _setup: function( options ) {
      var container = document.createElement( "div" ),
          mouseDiv = document.createElement( "div" ),
          target = Popcorn.dom.find( options.target ),
          _this = this;

      if ( !target ) {
        target = _this.media.parentNode;
      }

      options._target = target;
      options._container = container;
      options._mouseDiv = mouseDiv;
      options.from = options.from || 0;

      container.style.zIndex = 0;
      container.className = "popcorn-sequencer";
      container.style.position = "absolute";
      //container.style.display = "none";
      container.style.width = ( options.width || "100" ) + "%";
      container.style.height = ( options.height || "100" ) + "%";
      container.style.top = ( options.top || "0" ) + "%";
      container.style.left = ( options.left || "0" ) + "%";
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
        options.failed = false;
        options.p.off( "canplaythrough", options.readyEvent );
        options.ready = true;
        options.p.volume( options.volume );
        if ( options.startWhenReady ) {
          options._startEvent();
        }
      };

      if ( options.source ) {
        setTimeout( function() {
          if ( !options.ready ) {
            options.failed = true;
          }
        }, MEDIA_LOAD_TIMEOUT );
        options.p = Popcorn.smart( container, options.source, {frameAnimation: true} );
        options.p.media.style.width = "100%";
        options.p.media.style.height = "100%";
        container.style.width = ( options.width || "100" ) + "%";
        container.style.height = ( options.height || "100" ) + "%";
        if ( options.p.media.readyState >= 4 ) {
          options.readyEvent();
        } else {
          options.p.on( "canplaythrough", options.readyEvent );
        }
      }

      options._startEvent = function() {
        _this.on( "play", options._playEvent );
        _this.on( "pause", options._pauseEvent );
        //_this.on( "seeking", options._seekingEvent );
        // wait for this seek to finish before displaying it
        // we then wait for a play as well, because youtube has no seek event,
        // but it does have a play, and won't play until after the seek.
        var seekedEvent = function () {
          var playedEvent = function() {
            options.p.off( "play", playedEvent );
            options._container.style.zIndex = +options.zindex;
            if ( options.playWhenReady ) {
              _this.play();
            } else {
              options.p.pause();
            }
            if ( options.startWhenReady ) {
              options.p.unmute();
            }
          };
          options.p.off( "seeked", seekedEvent );
          options.p.on( "play", playedEvent );
          options.p.play();
        };
        options.p.on( "seeked", seekedEvent);
        options.p.currentTime( _this.currentTime() - options.start + (+options.from) );
      };

      options._playEvent = function() {
        options.p.play();
      };

      options._pauseEvent = function() {
        options.p.pause();
      };

      options._seekingEvent = function() {
        if ( options.ready && !options.p.paused() ) {
          options.p.pause();
        }
        options.p.currentTime( _this.currentTime() - options.start + (+options.from) );
      };

      /*options._seekedEvent = function() {
        if ( options.ready ) {
          if ( options.p.paused() && !that.paused() ) {
            options.p.play();
          }
          options.p.currentTime( that.currentTime() - options.start + (+options.from) );
        }
      };*/
    },
    _teardown: function( options ) {
//      options._target.removeChild( options._container );
    },
    start: function( event, options ) {
      if ( options.failed ) {
        // consider some dialog to inform of the fail.
        return;
      }
      if ( !this.paused() ) {
        options.playWhenReady = true;
        this.pause();
        options.p.pause();
      }
      options.startWhenReady = true;
      // need to display a loading bar if start before ready.
      if ( options.ready ) {
        options._startEvent();
      }
        /*if ( options.p.media.readyState >= 4 ) {
          options.readyEvent();
        } else {
          options.p.on( "canplaythrough", options.readyEvent );
        }*/
      /*var targetTime;
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
      }*/
    },
    end: function( event, options ) {
      this.off( "play", options._playEvent );
      this.off( "pause", options._pauseEvent );
  		//this.off( "seeking", options._seekingEvent );
			/*this.off( "seeked", options._seekedEvent );*/
      if ( options.ready ) {
        if ( !options.p.paused() ) {
          options.p.pause();
        }
        // reset current time so next play from start is smooth. We've pre seeked.
        options.p.currentTime( +options.from );
      }
      // cancel any pending starts
      options.startWhenReady = false;
      options.playWhenReady = false;
      options._container.style.zIndex = 0;
      if ( options.ready ) {
        options.p.mute();
      }
    },
    manifest: {
      about: {},
      options: {
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
          elem: "input",
          type: "seconds",
          "units": "seconds",
          "label": "Start at",
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

