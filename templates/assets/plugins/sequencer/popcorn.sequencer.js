// PLUGIN: sequencer

(function ( Popcorn ) {

  // XXX: SoundCloud has a bug (reported by us, but as yet unfixed) which blocks
  // loading of a second iframe/player if the iframe for the first is removed
  // from the DOM.  We can simply move old ones to a quarantine div, hidden from
  // the user for now (see #2630).  We lazily create and memoize the instance.

  // I am seeing this on other iframes as well. Going to do this on all cases.
  function getIframeQuarantine() {
    if ( getIframeQuarantine.instance ) {
      return getIframeQuarantine.instance;
    }

    var quarantine = document.createElement( "div" );
    quarantine.style.width = "0px";
    quarantine.style.height = "0px";
    quarantine.style.overflow = "hidden";
    quarantine.style.visibility = "hidden";
    document.body.appendChild( quarantine );

    getIframeQuarantine.instance = quarantine;
    return quarantine;
  }

  var MEDIA_LOAD_TIMEOUT = 10000;
 
  Popcorn.plugin( "sequencer", {
    _setup: function( options ) {
      var _this = this;

      options.setupContainer = function() {
        var container = document.createElement( "div" ),
            target = Popcorn.dom.find( options.target );

        if ( !target ) {
          target = _this.media.parentNode;
        }

        options._target = target;
        options._container = container;

        container.style.zIndex = 0;
        container.className = "popcorn-sequencer";
        container.style.position = "absolute";
        container.style.width = "100%";
        container.style.height = "100%";
        container.style.top = 0;
        container.style.left = 0;

        if ( target ) {
          target.appendChild( container );
        }
      };
      options.displayLoading = function() {
        document.querySelector( ".loading-message" ).classList.add( "show-media" );
      };
      options.hideLoading = function() {
        document.querySelector( ".loading-message" ).classList.remove( "show-media" );
      };
      if ( !options.from || options.from > options.duration ) {
        options.from = 0;
      }

      options.readyEvent = function() {
        options.failed = false;
        options.p.off( "loadedmetadata", options.readyEvent );
        options.ready = true;
        options._container.style.width = ( options.width || "100" ) + "%";
        options._container.style.height = ( options.height || "100" ) + "%";
        options._container.style.top = ( options.top || "0" ) + "%";
        options._container.style.left = ( options.left || "0" ) + "%";
        _this.on( "volumechange", options._volumeEvent );
        if ( options.active ) {
          options._startEvent();
        }
      };

      options.sourceToArray = function() {
        // If our src is not an array, create an array of one.
        options.source = typeof options.source === "string" ? [ options.source ] : options.source;
      };

      options.fail = function() {
        if ( options.ready && !options.denied ) {
          return;
        }
        _this.off( "play", options._playWhenReadyEvent );
        options.failed = true;
        options.hideLoading();
        if ( !options.hidden && options.active ) {
          options._container.style.zIndex = +options.zindex;
        }
        if ( options.playWhenReady ) {
          _this.play();
        }
      };

      options.tearDown = function() {
        _this.off( "volumechange", options._volumeEvent );
        if ( options.p ) {
          // XXX: pull the SoundCloud iframe element out of our video div, and quarantine
          // so we don't delete it, and block loading future SoundCloud instances. See above.

          // this is also fixing an issue in youtube, so we do it for all medias with iframes now.
          var iframeParent = options.p.media.parentNode,
              iframe = iframeParent.querySelector( "iframe" ) || iframeParent.querySelector( "video" ) || iframeParent.querySelector( "audio" );
          if ( iframe ) {
            getIframeQuarantine().appendChild( iframe );
          }
          options.p.destroy();
        }

        // Tear-down old instances, special-casing SoundCloud removal, see above.
        if ( options._container && options._container.parentNode ) {
          options._container.parentNode.removeChild( options._container );
        }
      };

      options.clearEvents = function() {
        _this.off( "play", options._playWhenReadyEvent );
        _this.off( "play", options._playEvent );
        _this.off( "pause", options._pauseEvent );
        _this.off( "seeked", options._seekedEvent );
      };

      options.addSource = function() {
        if ( options.loadTimeout ) {
          clearTimeout( options.loadTimeout );
        }
        // if the video is denied for any reason, most cases youtube embedding disabled,
        // don't bother waiting and display fail case.
        if ( options.denied ) {
          options.fail();
        } else {
          options.loadTimeout = setTimeout( options.fail, MEDIA_LOAD_TIMEOUT );
        }
        options.p = Popcorn.smart( options._container, options.source, { frameAnimation: true } );
        options.p.media.style.width = "100%";
        options.p.media.style.height = "100%";
        options._container.style.width = "100%";
        options._container.style.height = "100%";
        if ( options.p.media.readyState >= 1 ) {
          options.readyEvent();
        } else {
          options.p.on( "loadedmetadata", options.readyEvent );
        }
      };
      options.setupContainer();
      if ( options.source ) {
        options.sourceToArray();
        if ( options.fallback ) {
          if ( !Array.isArray( options.fallback ) ) {
            options.fallback = [ options.fallback ];
          }
          options.source = options.source.concat( options.fallback );
        }
        options.addSource();
      }

      options._startEvent = function() {
        // wait for this seek to finish before displaying it
        // we then wait for a play as well, because youtube has no seek event,
        // but it does have a play, and won't play until after the seek.
        // so we know if the play has finished, the seek is also finished.
        var seekedEvent = function () {
          var playedEvent = function() {
            // We've managed to seek, clear any pause fallbacks.
            //clearTimeout( seekTimeout );
            options.p.off( "play", playedEvent );
            _this.off( "play", options._playWhenReadyEvent );
            _this.on( "play", options._playEvent );
            _this.on( "pause", options._pauseEvent );
            _this.on( "seeked", options._seekedEvent );
            options.hideLoading();
            if ( !options.hidden && options.active ) {
              options._container.style.zIndex = +options.zindex;
            } else {
              options._container.style.zIndex = 0;
            }
            if ( options.playWhenReady ) {
              _this.play();
              options.p.on( "pause", options._seqPauseEvent );
            } else {
              options.p.pause();
              options.p.on( "play", options._seqPlayEvent );
            }
            if ( options.active ) {
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

      options._playWhenReadyEvent = function() {
        options.playWhenReady = true;
      };

      options._seqPlayEvent = function() {
        if ( _this.paused() ) {
          setTimeout( function() {
            options.p.off( "play", options._seqPlayEvent );
            _this.play();
            options.p.on( "pause", options._seqPauseEvent );
          }, 0 );
        }
      };

      options._playEvent = function() {
        if ( options.p.paused() ) {
          options.p.play();
        }
      };

      options._seqPauseEvent = function() {
        if ( !_this.paused() ) {
          setTimeout( function() {
            options.p.off( "pause", options._seqPauseEvent );
            _this.pause();
            options.p.on( "play", options._seqPlayEvent );
          }, 0 );
        }
      };

      options._pauseEvent = function() {
        if ( !options.p.paused() ) {
          options.p.pause();
        }
      };

      options._volumeEvent = function() {
        if ( _this.muted() ) {
          options.p.mute();
        } else {
          if ( !options.mute ) {
            options.p.unmute();
            options.p.volume( ( options.volume / 100 ) * _this.volume() );
          } else {
            options.p.mute();
          }
        }
      };

      options._seekedEvent = function() {
        options.p.currentTime( _this.currentTime() - options.start + (+options.from) );
      };

      options.toString = function() {
        return options.title || options.source || "";
      };

      if ( options.duration > 0 && options.end - ( options.start - ( +options.from ) ) > options.duration ) {
        options.end = options.duration + ( options.start - ( +options.from ) );
      }
    },
    _update: function( options, updates ) {
      if ( updates.duration != null ) {
        options.duration = updates.duration;
      }
      if ( updates.from != null && updates.from < options.duration ) {
        options.from = updates.from;
      }
      if ( options.end - ( options.start - ( +options.from ) ) > options.duration ) {
        options.end = options.duration + ( options.start - ( +options.from ) );
      }
      if ( updates.zindex != null ) {
        options.zindex = updates.zindex;
        if ( !options.hidden && options.active ) {
          options._container.style.zIndex = +options.zindex;
        } else {
          options._container.style.zIndex = 0;
        }
      }
      if ( updates.title ) {
        options.title = updates.title;
      }
      if ( updates.denied ) {
        options.denied = updates.denied;
      }
      if ( updates.hidden != null ) {
        options.hidden = updates.hidden;
        if ( !options.hidden && options.active ) {
          options._container.style.zIndex = +options.zindex;
        } else {
          options._container.style.zIndex = 0;
        }
      }
      if ( updates.fallback ) {
        options.fallback = updates.fallback;
      }
      if ( updates.source ) {
        options.sourceToArray();
        if ( options.fallback ) {
          if ( !Array.isArray( options.fallback ) ) {
            options.fallback = [ options.fallback ];
          }
          if ( !Array.isArray( updates.source ) ) {
            updates.source = [ updates.source ];
          }
          options.source = options.source.concat( options.fallback );
        }
        if ( updates.source.toString() !== options.source.toString() ) {
          options.ready = false;
          options.playWhenReady = false;
          if ( options.active ) {
            options.displayLoading();
          }
          options.source = updates.source;
          options.clearEvents();
          options.tearDown();
          options.setupContainer();
          this.on( "play", options._playWhenReadyEvent );
          if ( !this.paused() ) {
            options.playWhenReady = true;
            this.pause();
            if ( options.p && !options.p.paused() ) {
              options.p.pause();
            }
          }
          options.addSource();
        }
      }
      if ( updates.mute != null ) {
        options.mute = updates.mute;
        options._volumeEvent();
      }
      if ( updates.top != null ) {
        options.top = updates.top;
        options._container.style.top = ( options.top || "0" ) + "%";
      }
      if ( updates.left != null ) {
        options.left = updates.left;
        options._container.style.left = ( options.left || "0" ) + "%";
      }
      if ( updates.height != null ) {
        options.height = updates.height;
        options._container.style.height = ( options.height || "100" ) + "%";
      }
      if ( updates.width != null ) {
        options.width = updates.width;
        options._container.style.width = ( options.width || "100" ) + "%";
      }
      if ( options.ready ) {
        if ( updates.volume != null ) {
          options.volume = updates.volume;
          options._volumeEvent();
        }
        options.p.currentTime( this.currentTime() - options.start + (+options.from) );
      }
    },
    _teardown: function( options ) {
      options.tearDown();
    },
    start: function( event, options ) {
      options.active = true;
      if ( options.source ) {
        if ( !options.hidden && options.failed ) {
          // display player in case any external players show a fail message.
          // eg. youtube embed disabled by uploader.
          options._container.style.zIndex = +options.zindex;
          return;
        }
        this.on( "play", options._playWhenReadyEvent );
        if ( !this.paused() ) {
          options.playWhenReady = true;
          options.p.pause();
        }
        if ( options.ready ) {
          options._startEvent();
        } else {
          this.pause();
          options.displayLoading();
        }
      }
    },
    end: function( event, options ) {
      options.clearEvents();
      options.hideLoading();
      // cancel any pending or future starts
      options.active = false;
      options.playWhenReady = false;
      if ( options.ready ) {
        // video element can be clicked on. Keep them in sync with the main timeline.
        // We need to also clear these events.
        options.p.off( "play", options._seqPlayEvent );
        options.p.off( "pause", options._seqPauseEvent );
        if ( !options.p.paused() ) {
          options.p.pause();
        }
        // reset current time so next play from start is smooth. We've pre seeked.
        options.p.currentTime( +options.from );
      }
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
        fallback: {
          elem: "input",
          type: "url",
          label: "Fallback URL (only applies to exported projects)"
        },
        title: {
          elem: "input",
          type: "text",
          label: "Clip title"
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
          units: "%",
          label: "Volume",
          "default": 100
        },
        hidden: {
          elem: "input",
          type: "checkbox",
          label: "Sound only",
          "default": false
        },
        mute: {
          elem: "input",
          type: "checkbox",
          label: "Mute",
          "default": false
        },
        zindex: {
          hidden: true
        },
        denied: {
          hidden: true
        },
        duration: {
          hidden: true
        }
      }
    }
  });

}( Popcorn ));

