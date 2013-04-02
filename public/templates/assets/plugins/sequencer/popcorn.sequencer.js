// PLUGIN: sequencer

(function ( Popcorn ) {

  // XXX: SoundCloud has a bug (reported by us, but as yet unfixed) which blocks
  // loading of a second iframe/player if the iframe for the first is removed
  // from the DOM.  We can simply move old ones to a quarantine div, hidden from
  // the user for now (see #2630).  We lazily create and memoize the instance.
  // I am seeing this on other iframes as well. Going to do this on all cases.
  function getElementQuarantine() {
    if ( getElementQuarantine.instance ) {
      return getElementQuarantine.instance;
    }

    var quarantine = document.createElement( "div" );
    quarantine.style.width = "0px";
    quarantine.style.height = "0px";
    quarantine.style.overflow = "hidden";
    quarantine.style.visibility = "hidden";
    document.body.appendChild( quarantine );

    getElementQuarantine.instance = quarantine;
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

        target.appendChild( container );
      };
      options.displayLoading = function() {
        var bigPlay = document.getElementById( "controls-big-play-button" );
        _this.on( "play", options._surpressPlayEvent );
        if ( bigPlay ) {
          bigPlay.classList.add( "hide-button" );
        }
        document.querySelector( ".loading-message" ).classList.add( "show-media" );
      };
      options.hideLoading = function() {
        var bigPlay = document.getElementById( "controls-big-play-button" );
        _this.off( "play", options._surpressPlayEvent );
        if ( bigPlay ) {
          bigPlay.classList.remove( "hide-button" );
        }
        document.querySelector( ".loading-message" ).classList.remove( "show-media" );
      };

      if ( !options.from || options.from > options.duration ) {
        options.from = 0;
      }

      options._volumeEvent = function() {
        if ( _this.muted() ) {
          options._clip.mute();
        } else {
          if ( !options.mute ) {
            options._clip.unmute();
            options._clip.volume( ( options.volume / 100 ) * _this.volume() );
          } else {
            options._clip.mute();
          }
        }
      };

      options.readyEvent = function() {
        clearTimeout( options.loadTimeout );
        // If teardown was hit before ready, ensure we teardown.
        if ( options._cancelLoad ) {
          if ( options.playWhenReady ) {
            _this.play();
          }
          options._cancelLoad = false;
          options.tearDown();
        }
        options.failed = false;
        options._clip.off( "loadedmetadata", options.readyEvent );
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

      // Function to ensure the mixup as to if a clip is an array
      // or string is normalized to an array as often as possible.
      options.sourceToArray = function( object, type ) {
        // If our src is not an array, create an array of one.
        object[ type ] = typeof object[ type ] === "string" ? [ object[ type ] ] : object[ type ];
      };

      // If loading times out, we want to let the media continue to play.
      // The clip that failed to load would be ignored,
      // and everything else playable.
      options.fail = function() {
        _this.off( "play", options._playWhenReadyEvent );
        options.failed = true;
        if ( !options.hidden && options.active ) {
          options._container.style.zIndex = +options.zindex;
        }
        options.hideLoading();
        if ( options.playWhenReady ) {
          _this.play();
        }
      };

      options.tearDown = function() {
        _this.off( "volumechange", options._volumeEvent );
        // If we have no options._clip, no source was given to this track event,
        // and it is being torn down.
        if ( options._clip ) {
          // XXX: pull the SoundCloud iframe element out of our video div, and quarantine
          // so we don't delete it, and block loading future SoundCloud instances. See above.
          // This is also fixing an issue in youtube, so we do it for all medias with iframes now.
          // If you remove the iframe, there is potential that other services
          // are still referencing these iframes. Keeping them around protects us.
          var elementParent = options._clip.media.parentNode,
              element = elementParent.querySelector( "iframe" ) ||
                        elementParent.querySelector( "video" ) ||
                        elementParent.querySelector( "audio" );
          if ( element ) {
            getElementQuarantine().appendChild( element );
          }
          options._clip.destroy();
        }

        // Tear-down old instances, special-casing iframe removal, see above.
        if ( options._container && options._container.parentNode ) {
          options._container.parentNode.removeChild( options._container );
        }
      };

      options.clearEvents = function() {
        _this.off( "play", options._playWhenReadyEvent );
        _this.off( "play", options._playEvent );
        _this.off( "pause", options._pauseEvent );
        _this.off( "seeked", options._onSeeked );
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
        options._clip = Popcorn.smart( options._container, options.source, { frameAnimation: true } );
        options._clip.media.style.width = "100%";
        options._clip.media.style.height = "100%";
        options._container.style.width = "100%";
        options._container.style.height = "100%";
        if ( options._clip.media.readyState >= 1 ) {
          options.readyEvent();
        } else {
          options._clip.on( "loadedmetadata", options.readyEvent );
        }
      };

      options._onProgress = function() {
        var i, l,
            buffered = options._clip.media.buffered;

        // We're likely in a wrapper that does not support buffered.
        // Assume we are buffered.
        // Once these wrappers have a buffered time range object, it should just work.
        if ( buffered.length === 0 ) {
          return;
        }

        for ( i = 0, l = buffered.length; i < l; i++ ) {
          // Check if a range is valid, if so, return early.
          if ( buffered.start( i ) <= options._clip.currentTime() &&
               buffered.end( i ) > options._clip.currentTime() ) {
            // We found a valid range so playing can resume.
            if ( options.playWhenReady ) {
              options.playWhenReady = false;
              _this.play();
            }
            return;
          }
        }

        // If we hit here, we failed to find a valid range,
        // so we should probably stop everything. We'll get out of sync.
        if ( !_this.paused() ) {
          options.playWhenReady = true;
          _this.pause();
        }
      };

      // Ensures seek time is seekable, and not already seeked.
      // Returns true for successful seeks.
      options._setClipCurrentTime = function( time ) {
        if ( !time && time !== 0 ) {
          time = _this.currentTime() - options.start + (+options.from);
        }
        if ( time !== options._clip.currentTime() &&
             time >= (+options.from) && time <= options.duration ) {
          options._clip.currentTime( time );
          // Seek was successful.
          return true;
        }
      };

      // While clip is loading, do not let the timeline play.
      options._surpressPlayEvent = function() {
        options.playWhenReady = true;
        _this.pause();
      };

      options.setupContainer();
      if ( options.source ) {
        options.sourceToArray( options, "source" );
        options.sourceToArray( options, "fallback" );
        if ( options.fallback ) {
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
            options._clip.off( "play", playedEvent );
            _this.off( "play", options._playWhenReadyEvent );
            _this.on( "play", options._playEvent );
            _this.on( "pause", options._pauseEvent );
            _this.on( "seeked", options._onSeeked );
            // Setup on progress after initial load.
            // This way if an initial load never happens, we never pause.
            options._clip.on( "progress", options._onProgress );
            options.hideLoading();
            if ( !options.hidden && options.active ) {
              options._container.style.zIndex = +options.zindex;
            } else {
              options._container.style.zIndex = 0;
            }
            if ( options.playWhenReady ) {
              _this.play();
            } else {
              options._clip.pause();
            }
            options._clip.on( "play", options._clipPlayEvent );
            options._clip.on( "pause", options._clipPauseEvent );
            if ( options.active ) {
              options._volumeEvent();
            }
          };
          options._clip.off( "seeked", seekedEvent );
          options._clip.on( "play", playedEvent );
          options._clip.play();
        };
        options._clip.mute();
        options._clip.on( "seeked", seekedEvent);
        // If the seek failed, we're already at the desired time.
        // fire the seekedEvent right away.
        if ( !options._setClipCurrentTime() ) {
          seekedEvent();
        }
      };

      options._playWhenReadyEvent = function() {
        options.playWhenReady = true;
      };

      // Two events for playing the main timeline if the clip is playing.
      options._clipPlayEvent = function() {
        if ( _this.paused() ) {
          _this.off( "play", options._playEvent );
          _this.on( "play", options._playEventSwitch );
          _this.play();
        }
      };

      // Switch event is used to ensure we don't listen in loops.
      options._clipPlayEventSwitch = function() {
        options._clip.off( "play", options._clipPlayEventSwitch );
        options._clip.on( "play", options._clipPlayEvent );
      };

      // Two events for playing the clip timeline if the main is playing.
      options._playEvent = function() {
        if ( options._clip.paused() ) {
          options._clip.off( "play", options._clipPlayEvent );
          options._clip.on( "play", options._clipPlayEventSwitch );
          options._clip.play();
        }
      };

      // Switch event is used to ensure we don't listen in loops.
      options._playEventSwitch = function() {
        _this.off( "play", options._playEventSwitch );
        _this.on( "play", options._playEvent );
      };

      // Two events for pausing the main timeline if the clip is paused.
      options._clipPauseEvent = function() {
        if ( !_this.paused() ) {
          _this.off( "pause", options._pauseEvent );
          _this.on( "pause", options._pauseEventSwitch );
          _this.pause();
        }
      };

      // Switch event is used to ensure we don't listen in loops.
      options._clipPauseEventSwitch = function() {
        options._clip.off( "pause", options._clipPauseEventSwitch );
        options._clip.on( "pause", options._clipPauseEvent );
      };

      // Two events for pausing the clip timeline if the main is paused.
      options._pauseEvent = function() {
        if ( !options._clip.paused() ) {
          options._clip.off( "pause", options._clipPauseEvent );
          options._clip.on( "pause", options._clipPauseEventSwitch );
          options._clip.pause();
        }
      };

      // Switch event is used to ensure we don't listen in loops.
      options._pauseEventSwitch = function() {
        _this.off( "pause", options._pauseEventSwitch );
        _this.on( "pause", options._pauseEvent );
      };

      // event to seek the slip if the main timeline seeked.
      options._onSeeked = function() {
        options._setClipCurrentTime();
      };

      options.toString = function() {
        return options.title || options.source || "";
      };

      if ( options.duration > 0 &&
           options.end - ( options.start - ( +options.from ) ) > options.duration ) {
        options.end = options.duration + ( options.start - ( +options.from ) );
      }
    },
    _update: function( options, updates ) {
      if ( updates.hasOwnProperty( "duration" ) ) {
        options.duration = updates.duration;
      }
      if ( updates.hasOwnProperty( "from" ) && updates.from < options.duration ) {
        options.from = updates.from;
      }
      if ( options.end - ( options.start - ( +options.from ) ) > options.duration ) {
        options.end = options.duration + ( options.start - ( +options.from ) );
      }
      if ( updates.hasOwnProperty( "zindex" ) ) {
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
      if ( updates.hasOwnProperty( "hidden" ) ) {
        options.hidden = updates.hidden;
        if ( !options.hidden && options.active ) {
          options._container.style.zIndex = +options.zindex;
        } else {
          options._container.style.zIndex = 0;
        }
      }
      if ( updates.fallback ) {
        options.sourceToArray( updates, "fallback" );
        options.fallback = updates.fallback;
      }
      if ( updates.source ) {
        options.sourceToArray( updates, "source" );
        if ( options.fallback ) {
          updates.source = updates.source.concat( options.fallback );
        }
        if ( updates.source.toString() !== options.source.toString() ) {
          options.ready = false;
          options.playWhenReady = false;
          if ( options.active ) {
            options.displayLoading();
          }
          if ( updates.fallback ) {
            updates.source = updates.source.concat( updates.fallback );
          }
          options.source = updates.source;
          options.clearEvents();
          // TODO: ensure any pending loads are torn down.
          options.tearDown();
          options.setupContainer();
          this.on( "play", options._playWhenReadyEvent );
          if ( !this.paused() ) {
            options.playWhenReady = true;
            this.pause();
            if ( options._clip && !options._clip.paused() ) {
              options._clip.pause();
            }
          }
          options.addSource();
        }
      }
      if ( updates.hasOwnProperty( "mute" ) ) {
        options.mute = updates.mute;
        options._volumeEvent();
      }
      if ( updates.hasOwnProperty( "top" ) ) {
        options.top = updates.top;
        options._container.style.top = ( options.top || "0" ) + "%";
      }
      if ( updates.hasOwnProperty( "left" ) ) {
        options.left = updates.left;
        options._container.style.left = ( options.left || "0" ) + "%";
      }
      if ( updates.hasOwnProperty( "height" ) ) {
        options.height = updates.height;
        options._container.style.height = ( options.height || "100" ) + "%";
      }
      if ( updates.hasOwnProperty( "width" ) ) {
        options.width = updates.width;
        options._container.style.width = ( options.width || "100" ) + "%";
      }
      if ( options.ready ) {
        if ( updates.hasOwnProperty( "volume" ) ) {
          options.volume = updates.volume;
          options._volumeEvent();
        }
        options._setClipCurrentTime();
      }
    },
    _teardown: function( options ) {
      // If we're ready, or never going to be, simply teardown.
      if ( options.ready || !options.source ) {
        options.tearDown();
      } else {
        // If we're not ready yet, ensure we do the proper teardown once ready.
        options._cancelLoad = true;
      }
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
          options._clip.pause();
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
      // cancel any pending or future starts
      options.active = false;
      options.playWhenReady = false;
      options.clearEvents();
      options.hideLoading();
      if ( options.ready ) {
        // video element can be clicked on. Keep them in sync with the main timeline.
        // We need to also clear these events.
        options._clip.off( "play", options._clipPlayEvent );
        options._clip.off( "pause", options._clipPauseEvent );
        options._clip.off( "progress", options._onProgress );
        if ( !options._clip.paused() ) {
          options._clip.pause();
        }
        // reset current time so next play from start is smooth. We've pre seeked.
        options._setClipCurrentTime( +options.from );
      }
      options._container.style.zIndex = 0;
      if ( options.ready ) {
        options._clip.mute();
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
          label: "Source URL",
          "default": ""
        },
        fallback: {
          elem: "input",
          type: "url",
          label: "Fallback URL (only applies to exported projects)",
          "default": ""
        },
        title: {
          elem: "input",
          type: "text",
          label: "Clip title",
          "default": ""
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
          "default": 0
        },
        volume: {
          elem: "input",
          type: "range",
          units: "%",
          label: "Volume",
          slider_unit: "%",
          min: 0,
          max: 100,
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
          hidden: true,
          "default": 0
        },
        denied: {
          hidden: true,
          "default": false
        },
        duration: {
          hidden: true,
          "default": 0
        }
      }
    }
  });

}( Popcorn ));

