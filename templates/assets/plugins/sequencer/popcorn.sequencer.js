// PLUGIN: sequencer

(function (Popcorn) {

  // XXX: SoundCloud has a bug (reported by us, but as yet unfixed) which blocks
  // loading of a second iframe/player if the iframe for the first is removed
  // from the DOM.  We can simply move old ones to a quarantine div, hidden from
  // the user for now (see #2630).  We lazily create and memoize the instance.
  function getSoundCloudQuarantine() {
    if ( getSoundCloudQuarantine.instance ) {
      return getSoundCloudQuarantine.instance;
    }

    var quarantine = document.createElement( "div" );
    quarantine.style.width = "0px";
    quarantine.style.height = "0px";
    quarantine.style.overflow = "hidden";
    quarantine.style.visibility = "hidden";
    document.body.appendChild( quarantine );

    getSoundCloudQuarantine.instance = quarantine;
    return quarantine;
  }

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

      container.style.zIndex = +options.zindex;
      container.style.visibility = "hidden";
      container.className = "popcorn-sequencer";
      container.style.position = "absolute";
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
        options.p.off( "loadedmetadata", options.readyEvent );
        options.ready = true;
console.log( "on" );
        _this.on( "volumechange", options._volumeEvent );
        //options._volumeEvent();
        if ( options.startWhenReady ) {
          options._startEvent();
        }
      };

      if ( options.source ) {
        setTimeout( function() {
          if ( !options.ready ) {
            _this.off( "play", options._surpressPlayEvent );
            options.failed = true;
            if ( options.playWhenReady ) {
              _this.play();
            }
          }
        }, MEDIA_LOAD_TIMEOUT );
        options.source = options.source.replace( /^https\:\/\/soundcloud\.com/, "http://soundcloud.com" );
        options.p = Popcorn.smart( container, options.source, {frameAnimation: true} );
        options.p.media.style.width = "100%";
        options.p.media.style.height = "100%";
        container.style.width = ( options.width || "100" ) + "%";
        container.style.height = ( options.height || "100" ) + "%";
        if ( options.p.media.readyState >= 1 ) {
          options.readyEvent();
        } else {
          options.p.on( "loadedmetadata", options.readyEvent );
        }
      }

      options._startEvent = function() {
        // wait for this seek to finish before displaying it
        // we then wait for a play as well, because youtube has no seek event,
        // but it does have a play, and won't play until after the seek.
        // so we know if the play has finished, the seek is also finished.
        var seekedEvent = function () {
          var playedEvent = function() {
            options.p.off( "play", playedEvent );
            _this.off( "play", options._surpressPlayEvent );
            _this.on( "play", options._playEvent );
            _this.on( "pause", options._pauseEvent );
            _this.on( "seeking", options._seekingEvent );
            _this.on( "seeked", options._seekedEvent );
            container.style.visibility = "visible";
            if ( options.playWhenReady ) {
              _this.play();
            } else {
              options.p.pause();
            }
            if ( options.startWhenReady ) {
              options._volumeEvent();
            }
          };
          options.p.off( "seeked", seekedEvent );
          options.p.on( "play", playedEvent );
          options.p.play();
        };
        options.p.on( "seeked", seekedEvent);
        options.p.currentTime( _this.currentTime() - options.start + (+options.from) );
      };

      options._surpressPlayEvent = function() {
        _this.pause();
      };

      options._playEvent = function() {
        options.p.play();
      };

      options._volumeEvent = function() {
        /*if ( _this.muted() ) {
          options.p.mute();
        } else {
          options.p.unmute();
          options.p.volume( options.volume );
        }*/
        console.log( "volume changed" );
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

      options._seekedEvent = function() {
        if ( options.ready ) {
          if ( options.p.paused() && !_this.paused() ) {
            options.p.play();
          }
          options.p.currentTime( _this.currentTime() - options.start + (+options.from) );
        }
      };
    },
    _teardown: function( options ) {
      this.off( "volumechange", options._volumeEvent );
      if ( options.p ) {
        // XXX: pull the SoundCloud iframe element out of our video div, and quarantine
        // so we don't delete it, and block loading future SoundCloud instances. See above.
        // this is also fixing an issue in youtube, so we do it for all medias with iframes now.
        var soundCloudParent = options.p.media.parentNode,
            soundCloudIframe = soundCloudParent.querySelector( "iframe" );
        if ( soundCloudIframe ) {
          getSoundCloudQuarantine().appendChild( soundCloudIframe );
        }
        options.p.destroy();
      }

      // Tear-down old instances, special-casing SoundCloud removal, see above.
      if ( options._container && options._container.parentNode ) {
        options._container.parentNode.removeChild( options._container );
      }
    },
    start: function( event, options ) {
      if ( options.source ) {
        if ( options.failed ) {
          return;
        }
        this.on( "play", options._surpressPlayEvent );
        if ( !this.paused() ) {
          options.playWhenReady = true;
          this.pause();
          options.p.pause();
        }
        options.startWhenReady = true;
        if ( options.ready ) {
          options._startEvent();
        } else {
          // TODO
          // loading bar here
          // turn it off on fail or ready.
        }
      }
    },
    end: function( event, options ) {
      this.off( "play", options._surpressPlayEvent );
      this.off( "play", options._playEvent );
      this.off( "pause", options._pauseEvent );
  		this.off( "seeking", options._seekingEvent );
			this.off( "seeked", options._seekedEvent );
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
      options._container.style.visibility = "hidden";
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

