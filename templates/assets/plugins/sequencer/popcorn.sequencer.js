// PLUGIN: inception

(function (Popcorn) {

  /*"use strict";

  var styleSheet,
    mediaTypes = {
      'webm': 'video',
      'mp4': 'video',
      'm4v': 'video',
      'ogv': 'video',

      'mp3': 'audio',
      'oga': 'audio',
      'ogg': 'audio',
      'aac': 'audio',
      'wav': 'audio'
    };

  function guessMediaType(sources) {
    var ext, i;

    for (i = 0; i < sources.length; i++) {
      ext = /\.([a-z]+)$/i.exec(sources[i]);
      if (ext) {
        ext = ext[1];
        if (mediaTypes[ext]) {
          return mediaTypes[ext];
        }
      }
    }

    return false;
  }*/

  function validateDimension( value, fallback ) {
    if ( typeof value === "number" ) {
      return value;
    }
    return fallback;
  }

  Popcorn.plugin( 'sequencer', {
    _setup: function( options ) {
      var container = document.createElement( "div" ),
          target = Popcorn.dom.find( options.target ),
          that = this;

      if ( !target ) {
        target = that.media.parentNode;
      }

      options._target = target;
      options._container = container;

      container.style.zIndex = +options.zindex;
      container.className = "popcorn-sequencer";
      container.style.position = "absolute";
      container.style.display = "none";
      container.style.width = validateDimension( options.width, "100" ) + "%";
      container.style.height = validateDimension( options.height, "100" ) + "%";
      container.style.top = validateDimension( options.top, "0" ) + "%";
      container.style.left = validateDimension( options.left, "0" ) + "%";

      if ( target ) {
        target.appendChild( container );
      }

      options.readyEvent = function() {
        var targetTime = that.currentTime() - options.start + options.from;
        options.ready = true;
        if ( targetTime !== options.p.currentTime() ) {
          options.p.currentTime( targetTime );
        }
        if ( !that.paused() ) {
          options.p.play();
        }
      };

      if ( options.source ) {
        options.p = Popcorn.smart( container, options.source, {frameAnimation: true} );
        options.p.volume = options.volume;
        if ( options.p.media.readyState >= 4 ) {
          options.readyEvent();
        } else {
          options.p.on( "canplaythrough", options.readyEvent );
        }
      }

      options._playEvent = function() {
console.log( "hi" );
        options.p.play( that.currentTime() - options.start + options.from );
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
          options.p.currentTime( that.currentTime() - options.start + options.from );
        }
      };
    },
    _teardown: function( options ) {
      options._target.removeChild( options._container );
    },
    start: function( event, options ) {
      var targetTime;
      this.on( "play", options._playEvent );
      this.on( "pause", options._pauseEvent );
  		this.on( "seeking", options._seekingEvent );
			this.on( "seeked", options._seekedEvent );
      if ( options.ready ) {
        targetTime = this.currentTime() - options.start + options.from;
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
          elem: "input",
          type: "seconds",
          label: "Start at",
          "default": 0
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
/*function (options, base) {
console.log( "setup" );
    var me = this,
      popcorn,
      media,
      sync = options.sync === undefined ? true : options.sync,
      paused,
      container, div, doc, iframe,
      sources,
      mediaType,
      i, events, evt, eventType,
      from, to,
      duration = Infinity,
      popcornOptions,
      targetTime,
      active;

    function seek(time) {
      function seekWhenReady() {
        duration = popcorn.duration();
        if (active) {
          popcorn.currentTime(targetTime);
        }
        popcorn.off('loadedmetadata', seekWhenReady);
      }

      if (popcorn.duration()) {
        popcorn.currentTime(time);
      } else {
        if (targetTime === undefined) {
          popcorn.on('loadedmetadata', seekWhenReady);
        }
        targetTime = time;
      }
    }

    function playOnStart() {
      var time = 0;

      if (!active) {
        return;
      }

      //if options.sync, advance to appropriate time
      if (sync && !paused) {
        time = me.currentTime() - options.start + from;
      }
      if (time < to) {
        seek(time);
        popcorn.play();
      } else {
        seek(Math.min(to, duration));
      }
    }

    function mainVideoPaused() {
console.log( "paused event" );
      popcorn.pause();
    }

    function mainVideoSeeking() {
      var time = 0;

      if (!active) {
        return;
      }
      popcorn.pause();

      //if options.sync, advance to appropriate time
      if (sync && !paused) {
        time = me.currentTime() - options.start + from;
      }
      if (time >= to) {
        time = Math.min(to, duration);
      }
      seek(time);
    }

    function mainVideoSeeked() {
      if (!me.paused()) {
        playOnStart();
      }
    }

    function mainVideoVolume() {
      popcorn.volume(me.volume());
      popcorn.muted(me.muted());
    }

    if (!base.target) {
      return;
    }

    if (!options['z-index']) {
      options['z-index'] = options.zindex;
    }

    ['top', 'left', 'width', 'height'].forEach(function(key) {
      if ( parseFloat(options[key]) === options[key] ) {
        options[key] = options[key] + '%';
      }
    });

    //todo: don't require options.source if null player is available
    sources = base.toArray(options.source, /[\n\r]+/);
    if (!sources || !sources.length) {
      return;
    }

    //todo: if no sources pass canPlayType, return null

    //todo: add stylesheet with basePlugin
    if (!styleSheet) {
      styleSheet = document.createElement('style');
      styleSheet.setAttribute('type', 'text/css');
      styleSheet.appendChild(
        document.createTextNode(
          '.popcorn-inception { display: none; }\n' +
          '.popcorn-inception > div.popcorn-inception-container { position: relative; }\n' +
          '.popcorn-inception > div.popcorn-inception-container > * { width: 100%; }\n' +
          '.popcorn-inception.active { display: inline-block; }\n'
      ));
      document.head.appendChild(styleSheet);
    }

    container = options.container = base.makeContainer();
    if (options.id) {
      container.id = options.id;
    }
    base.animate(container);
    div = document.createElement(options.tag || 'div');
    div.className = 'popcorn-inception-container'
    container.appendChild(div);

    if (div.tagName === 'IFRAME') {
      doc = div.contentDocument;
      iframe = div;
      div = doc.body;
    } else {
      doc = document;
    }

    from = options.from && Math.max(Popcorn.util.toSeconds(options.from), 0) || 0;
    to = options.to && Popcorn.util.toSeconds(options.to) || Infinity;
    if (to < from) {
      to = Infinity;
    }

    popcornOptions = Popcorn.extend({}, me.options);
    Popcorn.extend(popcornOptions, options.options || {});

    //use Popcorn.smart if available
    mediaType = options.type || guessMediaType(sources) || '';
    mediaType = mediaType.toLowerCase();
    if (mediaType !== 'video' && mediaType !== 'audio' && Popcorn.smart) {
console.log( "making new smart" );
      popcorn = Popcorn.smart(div, sources, popcornOptions);
      media = popcorn.media;
    } else {
      media = doc.createElement(mediaType || 'video');
      media.setAttribute('preload', 'auto');
      Popcorn.forEach(sources, function(url) {
        var source = doc.createElement('source');

        url += '#t=' + from;
        if (to < Infinity) {
          url += ',' + to;
        }
        source.setAttribute('src', url);
        media.appendChild(source);
      });
      if (options.poster) {
        media.setAttribute('poster', options.poster);
      }
      div.appendChild(media);
      popcorn = Popcorn(media, popcornOptions);
    }

    options.popcorn = popcorn;

    if (options.controls) {
      media.controls = true;
    }

    if (iframe) {
      popcorn.on('loadedmetadata', function() {
        iframe.width = media.videoWidth || media.width;
        iframe.height = media.videoHeight || media.height;
      });
    }

    if (from > 0) {
      seek(from);
    }

    if (to < Infinity) {
      popcorn.cue(to, function() {
        popcorn.pause();
      });
    }

    if (options.volume === true) {
      mainVideoVolume();
      me.on('volumechange', mainVideoVolume);
    }

    popcorn.on('loadedmetadata', function() {
      to = Math.min(to, popcorn.duration());
      to = Math.min(to, from + (options.end - options.start));

      //option to pause main video
      if (options.pause) {
        base.pause((options.pause === true || options.pause === 0) ? to : options.pause, {
          timeFn: function() {
            return popcorn.currentTime();
          },
          onPause: function() {
            paused = true;
          }
        });
      }

    });

    //set up popcorn events
    if (options.events) {
      for (i in Popcorn.registryByName) {
        popcorn.defaults(i, {
          target: div
        });
      }

      if (Popcorn.isArray(options.events)) {
        for (i = 0; i < options.events.length; i++) {
          evt = options.events[i];
          eventType = evt._type;
          if (eventType && Popcorn.registryByName[eventType]) {
            evt = Popcorn.extend({}, evt);
            delete evt._type;
            popcorn[eventType](evt);
          }
        }
      } else if (typeof options.events === 'object') {
        for (eventType in options.events) {
          if (Popcorn.registryByName[eventType]) {
            events = options.events[eventType];
            for (i = 0; i < events.length; i++) {
              evt = eventsp[i];
              popcorn[eventType](evt);
            }
          }
        }
      }
    }

    return {
      start: function(event, options) {
        var time;
        active = true;
        base.addClass(container, 'active');

        if (sync) {
          me.on('pause', mainVideoPaused);
          me.on('seeking', mainVideoSeeking);
          me.on('seeked', mainVideoSeeked);
        }

        if (options.volume === true) {
          mainVideoVolume();
        } else if (!isNaN(options.volume) && options.volume !== false) {
          popcorn.volume(options.volume);
        }

        for (i in Popcorn.registryByName) {
          popcorn.enable(i);
        }

        me.on('play', playOnStart);
        if (!me.paused()) {
          playOnStart();
        }
      },
      end: function(event, options) {
        var i;

        active = false;
        paused = false;
        popcorn.pause();

        //in case there are any lingering popcorn events
        for (i in Popcorn.registryByName) {
          popcorn.disable(i);
        }

        me.off('play', playOnStart);

        base.removeClass(container, 'active');

        //remove any seeking/seeked listeners on 'me'
        me.off('pause', mainVideoPaused);
        me.off('seeking', mainVideoSeeking);
        me.off('seeked', mainVideoSeeked);
      },
      _teardown: function(event, options) {
        me.off('volumechange', mainVideoVolume);
        popcorn.destroy();
      }
    };
  }*/
}(Popcorn));

