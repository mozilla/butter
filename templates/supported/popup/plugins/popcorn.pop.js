// PLUGIN: pop
// http://www.youtube.com/watch?v=CwnnSSs0kFA
/*

Default sound by Herbert Boland
Creative Commons Attribution
http://www.freesound.org/people/HerbertBoland/sounds/33369/

*/
/*

todo: animate top, left and other styles (color, font size, etc.)

*/

(function (Popcorn) {

"use strict";

  var styleSheet,
    svg, clipPath, ellipse,
    sounds = {},
    events = [],
    soundIndex = 0,
    nop = {
      start: function() {},
      end: function() {}
    },
    MAX_AUDIO_TIME = 2,
    fontLoaded = false,
    fontLoadedQueue = [],
    startedLoadingExternal = false,
    externalLoadedQueue = [];
  
  function loadExternal(callback) {
    function checkExternal() {
      var fn;
      if (window.WebFont) {
        while (externalLoadedQueue.length) {
          fn = externalLoadedQueue.shift();
          fn();
        }

        return;
      }
      
      setTimeout(checkExternal, 0);
    }

    var script;
    
    if (window.WebFont) {
      if (callback && typeof callback === 'function') {
        callback();
        return;
      }
    }

    if (!startedLoadingExternal) {
      if (!window.WebFont) {
        script = document.createElement('script');
        script.src = ('https:' == document.location.protocol ? 'https' : 'http') + '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
        script.async = true;
        document.head.appendChild(script);
      }

      startedLoadingExternal = true;
      setTimeout(checkExternal, 0);
    }
    
    if (callback && typeof callback === 'function') {
      externalLoadedQueue.push(callback);
    }
  }

  function createSVGElement(name) {
    return document.createElementNS("http://www.w3.org/2000/svg",name);
  }

  Popcorn.plugin( 'pop' , function(options) {
    var popcorn,
      video,
      target,
      container,
      textContainer,
      innerDiv,
      lastScale = 1,
      lastOpacity = 1,
      text, node, i,
      duration, fadeTime = 0.3,
      img, audio,
      callback,
      loaded = false;
    
    function selectAudio(src) {
      var i, j, n, event, diff,
        eligibleAudio,
        audio;
      
      function resetAudio() {
        var that = this;
        this.currentTime = 0;
        this.pause();
      }
      
      if (!sounds[src]) {
        audio = document.createElement('audio');
        audio.src = src;
        audio.id = 'popcorn-pop-sound-' + soundIndex;
        soundIndex++;
        audio.preload = true;
        audio.style.display = 'none';
        audio.addEventListener('ended', resetAudio, false);

        document.body.appendChild(audio);
        sounds[src] = [audio];
        return audio;
      }
      
      audio = sounds[src][0];
      if (audio.duration) {
        diff = Math.min(audio.duration, MAX_AUDIO_TIME);
      } else {
        diff = MAX_AUDIO_TIME;
      }
      
      //make sure there are no other events using this sound at the same time
      eligibleAudio = sounds[src].slice(0);
      for (i = 0; i < events.length; i++) {
        event = events[i];
        if (event.sound === options.sound &&
          event.start <= options.start + diff &&
          event.start + diff >= options.start) {

          j = eligibleAudio.indexOf(event.audio);
          if (j >= 0) {
            eligibleAudio.splice(j, 1);
          }
        }
      }
      
      if (eligibleAudio.length) {
        audio = eligibleAudio[0];
      } else {
        audio = sounds[src][0].cloneNode(true);
        audio.id = 'popcorn-pop-sound-' + soundIndex;
        soundIndex++;

        // not sure whether cloning copies the events in all browsers,
        // so remove it and add again just in case
        audio.removeEventListener('ended', resetAudio, false);
        audio.addEventListener('ended', resetAudio, false);

        document.body.appendChild(audio);
        sounds[src].push(audio);
      }
      
      return audio;
    }
    
    if (!options) {
      return nop;
    }

    if (!options.target || !options.text && !options.image) {
      return nop;
    }

    popcorn = this;
    video = popcorn.media;

    target = options.target;

    if (typeof target === 'string') {

      target = document.getElementById(target);
      
      if (!target) {
        return nop;
      }
    }
    
    //default styles in a style sheet so they can be overridden
    if (!styleSheet) {
      styleSheet = document.createElement('style');
      styleSheet.setAttribute('type', 'text/css');
      styleSheet.appendChild(document.createTextNode("@font-face { font-family: 'Varela Round'; font-style: normal; font-weight: normal; src: local('Varela Round'), local('VarelaRound-Regular'), url('http://themes.googleusercontent.com/static/fonts/varelaround/v1/APH4jr0uSos5wiut5cpjrqRDOzjiPcYnFooOUGCOsRk.woff') format('woff');}\n" +
      '.popcorn-pop { background-color: black; border-radius: 12px; color: black; padding: 4px 9px; font-family: \'Varela Round\', sans-serif; font-size: 16px; }\n' +
      '.popcorn-pop > div { background-color: white; border-radius: 8px; padding: 4px; position: relative; }\n' +
      '.popcorn-pop .image { clip-path: url("#popcorn-pop-clip-path"); }\n' +
      '.popcorn-pop .icon { position: absolute; z-index: 2; top: -50%;}\n' +
      '.popcorn-pop .icon + div { padding-left: 12px; }\n' +
      '#popcorn-pop-svg { display:none; }'
      ));
      document.head.appendChild(styleSheet);
      
      //making a dummy placeholder to force the font to load
      node = document.createElement('div');
      node.style.visibility = 'hidden';
      node.style.fontFamily = 'Varela Round';
      node.innerHTML = 'I have no responsibilities here whatsoever';
      document.body.appendChild(node);
    }
    
    container = document.createElement('div');
    container.style.cssText = options.style || '';

    i = options.top;
    if (i || i === 0) {
      if (!isNaN(i)) {
        i += 'px';
      }
      container.style.top = i;
      container.style.position = 'absolute';
    }

    i = options.left;
    if (i || i === 0) {
      if (!isNaN(i)) {
        i += 'px';
      }
      container.style.left = i;
      container.style.position = 'absolute';
    }
    
    i = options.right;
    if (i || i === 0) {
      if (!isNaN(i)) {
        i += 'px';
      }
      container.style.right = i;
      container.style.position = 'absolute';
    }
    
    i = options.bottom;
    if (i || i === 0) {
      if (!isNaN(i)) {
        i += 'px';
      }
      container.style.bottom = i;
      container.style.position = 'absolute';
    }
    
    if (options.align) {
      container.style.textAlign = options.align;
    }
    

    container.style.visibility = 'hidden';
    if (options.classes) {
      if (options.classes.length && options.classes.join) {
        //an array works
        container.setAttribute('class', 'popcorn-pop ' + options.classes.join(' '));
      } else {
        container.setAttribute('class', 'popcorn-pop ' + options.classes.split(/,\s\n\r/).join(' '));
      }
    } else {
      container.setAttribute('class', 'popcorn-pop');
    }
    
    innerDiv = document.createElement('div');
    container.appendChild(innerDiv);
    
    if (options.link) {
      textContainer = document.createElement('a');
      textContainer.setAttribute('href', options.link);
      if (options.linkTarget) {
        textContainer.setAttribute('target', options.linkTarget);
      } else {
        textContainer.setAttribute('target', '_new');
      }

      //pause video when link is clicked
      textContainer.addEventListener('click', function() {
        video.pause();
      }, false);

      innerDiv.appendChild(textContainer);
    } else {
      textContainer = innerDiv;
    }
    
    text = options.text.split(/[\n\r]/);
    for (i = 0; i < text.length; i++) {
      if (i) {
        textContainer.appendChild(document.createElement('br'));
      }
      node = document.createElement('span');
      node.appendChild(document.createTextNode(text[i]));
      textContainer.appendChild(node);
    }
    
    if (options.image) {
      if (!svg) {
        svg = createSVGElement('svg');
        svg.id = 'popcorn-pop-svg';

        clipPath = createSVGElement('clipPath');
        clipPath.id = 'popcorn-pop-clip-path';
        clipPath.setAttribute('clipPathUnits', 'objectBoundingBox');
        svg.appendChild(clipPath);

        ellipse = createSVGElement('clipPath');
        ellipse.setAttribute('cx', 0.5);
        ellipse.setAttribute('cy', 0.5);
        ellipse.setAttribute('rx', 0.95);
        ellipse.setAttribute('ry', 0.95);
        svg.appendChild(clipPath);
        
        document.body.appendChild(svg);
      }
    } else if (options.icon) {
      img = document.createElement('img');
      img.setAttribute('class', 'icon');
      img.src = options.icon;
      img.addEventListener('load', function() {
        var width = img.width || img.naturalWidth,
          height = img.height || img.naturalHeight;
        
        if (height > 60) {
          width = 60 * width / height;
          height = 60;
          img.style.width = width + 'px';
        }
        
        img.style.left = -(width - 16) + 'px';
        if (container.offsetHeight) {
          img.style.top = (container.offsetHeight - height) / 2 - 4 + 'px';
        }				
        container.insertBefore(img, container.firstChild);
      }, false);
    }
    
    target.appendChild(container);
    options.container = container;
    
    //load up sound.
    if (options.sound !== false) {
      if (!options.sound) {
        options.sound = 'sounds/mouthpop.ogg'; //temporary default
      } else if (options.sound instanceof HTMLMediaElement) {
        audio = options.sound;
        options.sound = audio.currentSrc;
      }
      
      if (!audio) {
        audio = selectAudio(options.sound);
        options.audio = audio;
      }
    }
    
    events.push(options);
    
    callback = function() {
      var fontLoader;
      
      var fontLoadedCallback = function() {
        fontLoaded = true;
        loaded = true;
        if (container) {
          container.style.visibility = '';
          container.style.display = 'none';
          if (typeof options.onLoad === 'function') {
            options.onLoad(options);
          }
        }
      };

      if (fontLoaded) {
        fontLoadedCallback();
        return;
      } else if (!fontLoadedQueue.length) {
        WebFont.load({
          google: {
            families: ['Varela+Round::latin']
          },
          fontactive: function() {
            var fn;
            while (fontLoadedQueue.length) {
              fn = fontLoadedQueue.shift();
              fn();
            }
          }
        });
      }
      fontLoadedQueue.push(fontLoadedCallback);
    };
    loadExternal(callback);

    //if event callbacks are strings, swap them out for functions
    (function() {
      var i, event, events = ['onLoad', 'onStart', 'onFrame', 'onEnd'];
      for (i = 0; i < events.length; i++) {
        event = events[i];
        if (options[event] && typeof options[event] === 'string') {
          if (window[ options[event] ] && typeof window[ options[event] ] === 'function') {
            options[event] = window[ options[event] ];
          }
        }
      }
    }());
    
    if (options.exit !== undefined && !isNaN(options.exit)) {
      fadeTime = options.exit;
      options.exit = 'fade';
    } else if (!options.exit ||
      ['fade', 'cut', 'fly'].indexOf(options.exit) < 0) {

      options.exit = 'fade';
    }

    duration = Math.min(0.25, options.end - options.start - 0.25);		
    fadeTime = Math.min(fadeTime, options.end - options.start - 0.25 - fadeTime);

    return {
      start: function( event, options ) {
        if (options.container) {
          options.container.style.visibility = 'visible';
          options.container.style.display = '';
        }
        
        if (audio && audio.duration && !video.paused &&
          video.currentTime - 1 < options.start) {

          audio.volume = video.volume;
          audio.muted = video.muted;
          audio.play();
          if (!audio.duration || isNaN(audio.duration) || audio.duration > MAX_AUDIO_TIME) {
            setTimeout(function() {
              audio.currentTime = 0;
              audio.pause();
            }, MAX_AUDIO_TIME);
          }
        }

        if (typeof options.onStart === 'function') {
          try {
            options.onStart(options);
          } catch (e) {
          }
        }
      },
      frame: function(event, options, time){
        var scale = 1, opacity = 1,
          t = time - options.start,
          div = options.container,
          transform;

        if (!options.container) {
          return;
        }

        if (t < duration) {
          scale = ( 1 - Math.pow( (t / duration) / 0.7 - 1, 2) ) / 0.8163;					
        } else if (options.exit === 'fade') {
          t = time - (options.end - fadeTime);
          
          if (t > 0) {
            opacity = 1 - (t / fadeTime);
          }
        }
        
        if (lastScale !== scale) {
          transform = 'scale(' + scale + ')';
          container.style.MozTransform = transform;
          container.style.webkitTransform = transform;
          container.style.ieTransform = transform;
          container.style.oTransform = transform;
          container.style.transform = transform;
          lastScale = scale;
        }

        if (lastOpacity !== opacity) {
          container.style.opacity = opacity;
          lastOpacity = opacity;
        }

        if (typeof options.onFrame === 'function') {
          try {
            options.onFrame(options, time);
          } catch (e) {
          }
        }
      },
      end: function( event, options ) {
        if (options.container) {
          options.container.style.display = 'none';
        }
        
        if (typeof options.onEnd === 'function') {
          try {
            options.onEnd(options);
          } catch (e) {
          }
        }
      },
      _teardown: function( options ) {
        var i;
        
        //remove from font-loading callback queue
        if (callback) {
          i = externalLoadedQueue.indexOf(callback);
          if (i >= 0) {
            externalLoadedQueue.splice(i, 1);
          }
          callback = null;
        }
        
        //remove our claim on the sound file
        i = events.indexOf(options);
        if (i >= 0) {
          events.splice(i, 1);
        }
        
        if (options.container && options.container.parentNode) {
          options.container.parentNode.removeChild(options.container);
          container = null;
          delete options.container;
        }
      }
    };
  },
  {
    about: {
      name: 'Popcorn "Pop-Over" Video Plugin',
      version: 0.1,
      author: 'Brian Chirls',
      website: 'http://chirls.com'
    },
    options: {
      start: {elem:'input', type:'text', label:'In'},
      end: {elem:'input', type:'text', label:'Out'},
      text: {
        elem:'input',
        type:'text',
        label:'Text'
      },
      link: {
        elem:'input',
        type:'text',
        label:'Link (URL)'
      },
      classes: {
        elem:'input',
        type:'text',
        label:'List of classes to apply to text container'
      },
      style: {
        elem:'input',
        type:'text',
        label:'CSS to apply to text'
      },
      align: {
        elem:'select',
        label:'CSS to apply to text'
      },
      top: {
        elem:'input',
        type:'number',
        label:'Top position'
      },
      left: {
        elem:'input',
        type:'number',
        label:'Left position'
      },
      bottom: {
        elem:'input',
        type:'number',
        label:'Bottom position'
      },
      right: {
        elem:'input',
        type:'number',
        label:'Right position'
      },
      target: {
        elem:'input',
        type:'text',
        label:'Target Element'
      },
      icon: {
        elem:'input',
        type:'text',
        label:'Pop Icon'
      }/*,
      onSetup: {
        type: "function",
        label: "onSetup callback function"
      },
      onLoad: {
        type: "function",
        label: "onLoad callback function"
      },
      onStart: {
        type: "function",
        label: "onStart callback function"
      },
      onEnd: {
        type: "function",
        label: "onEnd callback function"
      },
      onFrame: {
        type: "function",
        label: "onFrame callback function"
      }*/
    }
  });
})( Popcorn );
