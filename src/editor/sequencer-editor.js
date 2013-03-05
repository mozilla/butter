/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "util/mediatypes", "editor/editor", "util/time",
          "util/uri", "ui/widget/textbox", "text!layouts/sequencer-editor.html"  ],
  function( MediaUtils, Editor, Time, URI, Textbox, LAYOUT_SRC ) {

  Editor.register( "sequencer", LAYOUT_SRC,
    function( rootElement, butter ) {
    var _this = this;

    var _rootElement = rootElement,
        _trackEvent,
        _butter,
        _manifest,
        _popcornOptions,
        _mediaType;

    var _fields = {};

    // Creates an "off-on" toggler
    function Toggler( el, property, isReverse, customUpdateUI ) {
      var hiddenInput = el.querySelector( "input" );

      function updateUI() {
        var val = _popcornOptions[ property ];
        if ( val && !isReverse || !val && isReverse ) {
          el.classList.add( "on" );
        } else {
          el.classList.remove( "on" );
        }
        hiddenInput.checked = val;
        if ( customUpdateUI ) {
          customUpdateUI( el );
        }
      }

      function updateTrackEvent( val ) {
        var properties = {};
        properties[ property ] = val;
        updateUI( val );
        _this.updateTrackEventSafe( _trackEvent, properties );
      }

      el.addEventListener( "click", function() {
        // Toggle the state
        updateTrackEvent( !hiddenInput.checked );
      }, false );

      updateUI( _popcornOptions[ property ] );

      return {
        el: el,
        updateUI: updateUI,
      };

    }

    // Creates a standard input
    function Input( el, property, callback, customUpdate ) {
      _this.attachInputChangeHandler( el, _trackEvent, property, callback );

      function updateUI() {
        var val = _popcornOptions[ property ];
        el.value = val;
        if ( customUpdate ) {
          customUpdate( el );
        }
      }

      updateUI( _popcornOptions[ property ] );

      return {
        el: el,
        updateUI: updateUI
      };
    }

    function StartEnd( el ) {
      var container = _this.createStartEndInputs( _trackEvent, _this.updateTrackEventSafe ),
          startEl = container.querySelector( "[data-manifest-key=start]" ),
          endEl = container.querySelector( "[data-manifest-key=end]" );

      el.appendChild( container );

      function updateUI() {
        startEl.value = Time.toTimecode( _popcornOptions.start );
        endEl.value = Time.toTimecode( _popcornOptions.end );
      }

      updateUI();

      return {
        el: el,
        updateUI: updateUI
      };
    }

    function Slider( el, property ) {
      var scrubber = el.querySelector( ".butter-slider-scrubber" ),
          MAX_VAL = el.getAttribute( "data-max" ) || 100;

      function toReal( n ) {
        var maxUI = el.offsetWidth;
        return ( n / maxUI ) * MAX_VAL;
      }

      function toUI( n ) {
        var maxUI = el.offsetWidth;
        return ( n / MAX_VAL ) * maxUI;
      }

      function normalize( n ) {
        if ( n < 0 ) {
          n = 0;
        } else if ( n > MAX_VAL ) {
          n = MAX_VAL;
        }
        return n;
      }

      function updateUI() {
        scrubber.style.left = toUI( _popcornOptions[ property ] ) + "px";
      }

      function updateTrackEvent( options) {
        _this.updateTrackEventSafe( _trackEvent, options );
        updateUI();
      }

      var firstX,
          startLeft;

      function onSlideStop() {
        document.removeEventListener( "mousemove", onSliding, false );
        document.removeEventListener( "mouseup", onSlideStop, false );
      }

      function onSliding( e ) {
        var left = startLeft + e.clientX - firstX,
            properties = {};
        properties[ property ] = normalize( toReal( left ) );
        updateTrackEvent( properties );
      }

      function onSlideStart( e ) {
        e.preventDefault();
        firstX = e.clientX;
        startLeft = scrubber.offsetLeft;
        document.addEventListener( "mousemove", onSliding, false );
        document.addEventListener( "mouseup", onSlideStop, false );
      }

      scrubber.addEventListener( "mousedown", onSlideStart, false );
      updateUI();
    }

    // Our custom trimmer thingy
    function Trimmer( el ) {

      var MIN_VISUAL_WIDTH = 5;

      var rightHandle = el.querySelector( ".trimmer-resizable-e" ),
          leftHandle = el.querySelector( ".trimmer-resizable-w" ),
          outInput = _rootElement.querySelector( ".trimmer-input-right" ),
          inInput = _rootElement.querySelector( ".trimmer-input-left" ),
          clipSection = el.querySelector( ".clip-section" ),
          clipEndLable = el.querySelector( ".clip-end" );

      var firstX,
          startLeft,
          startWidth,
          activeHandle,
          updateOptions = {};

      // Converting px <=> time, normalizing
      function positionToTime( pos ) {
        var max1 = _popcornOptions.duration,
            max2 = el.offsetWidth;
        return ( pos / max2 ) * max1;
      }

      function timeToPosition( time ) {
        var max1 = _popcornOptions.duration,
            max2 = el.offsetWidth;
        return ( time / max1 ) * max2;
      }

      // Updating functions
      function updateUI( options ) {
        options = options || _popcornOptions;

        var start = ( options.start || options.start === 0 ) && options.start || _popcornOptions.start,
            end = options.end || ( options.end || options.end === 0 ) && options.end || _popcornOptions.end,
            from = options.from || ( options.from || options.from === 0 ) && options.from || _popcornOptions.from;

        // Adjust UI to account for very small durations
        if ( timeToPosition( end - start ) < MIN_VISUAL_WIDTH ) {
          clipSection.classList.add( "small" );
        } else {
          clipSection.classList.remove( "small" );
        }

        if ( options.from ) {
          clipSection.style.left = timeToPosition( from ) + "px";
          inInput.value = Time.toTimecode( from );
          outInput.value = Time.toTimecode( from + end - start );
        }

        if ( options.end || options.start ) {
          clipSection.style.width = timeToPosition( end - start ) + "px";
          outInput.value = Time.toTimecode( from + end - start );
        }

        if ( options.duration ) {
          clipEndLable.innerHTML = Time.toTimecode( options.duration );
        }

      }

      function updateEndAfterExpand() {
        var track = _trackEvent.track;
        track.removeTrackEvent( _trackEvent );
        track.addTrackEvent( _trackEvent );
        _this.updateTrackEventSafe( _trackEvent, updateOptions );
        _butter.unlisten( "mediaready", updateEndAfterExpand );
        updateOptions = {};
        updateUI();
      }

      function updateTrackEvent( options ) {
        // If the end time is greater than the duration of the video, expand it to fit.
        // We have to set an event listener on "mediaready" to update the trackevent after the base duration has been changed
        if ( options.end && options.end > _butter.duration ) {
          _butter.currentMedia.url = "#t=," + options.end;
          _butter.listen( "mediaready", updateEndAfterExpand );
        } else {
          _this.updateTrackEventSafe( _trackEvent, options );
          updateOptions = {};
          updateUI();
        }
      }

      function onResizeStop() {
        var accuracy,
            start = updateOptions.start || _popcornOptions.start,
            end = updateOptions.end || _popcornOptions.end;

        el.classList.remove( "editing" );

        if ( activeHandle === "left" ) {
          accuracy = start * Math.pow( 10, Time.timeAccuracy - 1 );
          butter.currentTime = start === 0 ? start : Math.ceil( start * accuracy ) / accuracy;
        } else if ( activeHandle === "right" ) {
          accuracy = end * Math.pow( 10, Time.timeAccuracy - 1 );
          butter.currentTime = Math.floor( end * accuracy ) / accuracy;
        }

        updateTrackEvent( updateOptions );
        activeHandle = "";

        document.removeEventListener( "mousemove", onResizingRight, false );
        document.removeEventListener( "mousemove", onResizingLeft, false );
        document.removeEventListener( "mouseup", onResizeStop, false );
      }


      function onResizingLeft( e ) {
        e.preventDefault();
        var left = startLeft + e.clientX - firstX,
            width = startWidth - ( e.clientX - firstX );

        if ( left < 0 || width < 0 ) {
          return;
        }

        updateOptions.end = _popcornOptions.start + positionToTime( width );
        updateOptions.from = positionToTime( left );

        updateUI({
          from: updateOptions.from,
          end: updateOptions.end
        });

      }

      function onResizingRight( e ) {
        e.preventDefault();
        var left = clipSection.offsetLeft,
            width = startWidth + e.clientX - firstX;

        if ( left + width > el.offsetWidth || width < 0 ) {
          return;
        }

        updateOptions.end = _popcornOptions.start + positionToTime( width );
        updateUI({
          end: updateOptions.end
        });

      }

      function onResizeStart( e ) {
        e.preventDefault(); // Prevent selection
        el.classList.add( "editing" );

        firstX = e.clientX;
        startLeft = clipSection.offsetLeft;
        startWidth = clipSection.offsetWidth;

        if ( this === rightHandle ) {
          document.addEventListener( "mousemove", onResizingRight, false );
          activeHandle = "right";
        } else if ( this === leftHandle ) {
          activeHandle = "left";
          document.addEventListener( "mousemove", onResizingLeft, false );
        }
        document.addEventListener( "mouseup", onResizeStop, false );
      }


      function onDragStop() {
        el.classList.remove( "editing" );
        updateTrackEvent( updateOptions );
        document.removeEventListener( "mouseup", onDragStop, false );
        document.removeEventListener( "mousemove", onDragging, false );
      }

      function onDragging( e ) {
        e.preventDefault(); // Prevent selection
        var left = startLeft + e.clientX - firstX,
            width = clipSection.offsetWidth;

        if ( left < 0 || ( left + width ) > el.offsetWidth ) {
          return;
        }

        updateOptions.from = positionToTime( left );
        updateUI({
          from: updateOptions.from
        });
      }

      function onDragStart( e ) {
        e.preventDefault();
        if ( e.target !== clipSection ) {
          // We are resizing, not dragging.
          return;
        }

        el.classList.add( "editing" );

        firstX = e.clientX;
        startLeft = clipSection.offsetLeft;
        startWidth = clipSection.offsetWidth;
        document.addEventListener( "mousemove", onDragging, false );
        document.addEventListener( "mouseup", onDragStop, false );
      }

      function onRightInputChange() {
        var val = Time.toSeconds( this.value );
        updateOptions.end = _popcornOptions.start + val - _popcornOptions.from;
        updateTrackEvent( updateOptions );
      }

      function onLeftInputChange() {
        var val = Time.toSeconds( this.value );
        updateOptions.from = val;
        updateOptions.end = _popcornOptions.end + ( _popcornOptions.from - val );
        updateTrackEvent( updateOptions );
      }

      // Setup
      outInput.addEventListener( "change", onRightInputChange, false );
      inInput.addEventListener( "change", onLeftInputChange, false );
      rightHandle.addEventListener( "mousedown", onResizeStart, false );
      leftHandle.addEventListener( "mousedown", onResizeStart, false );
      clipSection.addEventListener( "mousedown", onDragStart, false );
      updateUI();

      return {
        el: el,
        updateUI: updateUI
      };
    }

    function metaDataBox( el ) {
      function updateUI() {
        if ( !Array.isArray( _popcornOptions.source ) ) {
          _popcornOptions.source = [ _popcornOptions.source ];
        }

        MediaUtils.getMetaData( _popcornOptions.source[ 0 ], function( data ) {
          var titleEl = el.querySelector( ".mg-title" ),
              typeEl = el.querySelector( ".mg-type" ),
              durationEl = el.querySelector( ".mg-duration" ),
              thumbnailEl.querySelector( ".mg-thumbnail" ),
              thumbnailImg;

          el.classList.add( "loaded" );
          titleEl.innerHTML = data.title;
          typeEl.innerHTML = data.type;
          durationEl.innerHTML = Time.toTimecode( data.duration ) || "???";

          if ( data.type === "html5" ) {
            thumbnailImg = data.thumbnail;
            fallbackContainer.classList.add( "show" );
          } else {
            thumbnailImg = document.createElement( "img" );
            thumbnailImg.src = data.thumbnail;
            thumbnailEl.appendChild( thumbnailImg );
            fallbackContainer.classList.remove( "show" );
          }

          el.classList.add( "mg-" + data.type );
          el.querySelector( ".mg-thumbnail" ).addEventListener( "click", function( e ) {
            _butter.editor.openEditor( "media-editor" );
          }, false );

        });
      return {
        el: el,
        updateUI: updateUI
      };
    }


    function setup( trackEvent ) {
      _trackEvent = trackEvent;
      _popcornOptions = _trackEvent.popcornOptions,
      _manifest = _trackEvent.manifest.options;

      var sourceEl = _rootElement.querySelector( "[data-manifest-key=source]" ),
          startEndContainer = _rootElement.querySelector( ".start-end-container" ),
          fallbackEl = _rootElement.querySelector( "[data-manifest-key=fallback]" ),
          fallbackContainer = _rootElement.querySelector( ".fallback-container" ),
          muteEl = _rootElement.querySelector( "#mute-toggler" ),
          hiddenEl = _rootElement.querySelector( "#hidden-toggler" ),
          titleEl = _rootElement.querySelector( "[data-manifest-key=title]" ),
          clipTrimmerEl = _rootElement.querySelector( ".clip-duration" ),
          sliderEl = _rootElement.querySelector( "[data-manifest-key=volume]" ),
          sliderContainer = _rootElement.querySelector( ".volume-slider-container" );

      // Custom callbacks and UI updating functions
      var fallbackUpdateUI = function( el ) {
        if ( !Array.isArray( _popcornOptions.fallback ) ) {
          _popcornOptions.fallback = [ _popcornOptions.fallback ];
        }
        el.value = URI.stripUnique( _popcornOptions.fallback[ 0 ] ).toString();
      },
      muteUpdateUI = function() {
        if ( _popcornOptions.mute === true ) {
          sliderContainer.classList.add( "disabled" );
        } else {
          sliderContainer.classList.remove( "disabled" );
        }
      };

      _fields.startEnd = new StartEnd( startEndContainer, "start", _this.updateTrackEventSafe );
      _fields.fallback = new Input( fallbackEl, "fallback", _this.updateTrackEventSafe, fallbackUpdateUI );
      _fields.title = new Input( titleEl, "title", _this.updateTrackEventSafe );
      _fields.mute = new Toggler( muteEl, "mute", "reverse", muteUpdateUI );
      _fields.volume = new Slider( sliderEl, "volume" );
      _fields.hidden = new Toggler( hiddenEl, "hidden", "reverse" );
      _fields.from = new Trimmer( clipTrimmerEl );
      _fields.source = new MetadataBox( sourceEl );
      };

      _fields.source.updateUI();

    } //setup

    function onTrackEventUpdated( e ) {
      _trackEvent = e.target,
      _popcornOptions = _trackEvent.popcornOptions;

      for ( var key in _manifest ) {
        if ( _manifest.hasOwnProperty( key ) ) {
          if ( key === "start" || key === "end" ) {
            key = "startEnd";
          }
          if ( _fields[ key ] && _fields[ key ].updateUI ) {
            _fields[ key ].updateUI();
          }
        }
      }

      _this.setErrorState( false );
    }

    // Extend this object to become a TrackEventEditor
    Editor.TrackEventEditor.extend( _this, butter, rootElement, {
      open: function( parentElement, trackEvent ) {

        _butter = butter;

        // Update properties when TrackEvent is updated
        trackEvent.listen( "trackeventupdated", onTrackEventUpdated );
        setup( trackEvent );
      },
      close: function() {
        _trackEvent.unlisten( "trackeventupdated", onTrackEventUpdated );
      }
    });
  });
});
