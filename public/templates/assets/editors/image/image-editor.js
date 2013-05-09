/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

(function( Butter ) {

  var Editor = Butter.Editor;

  Editor.register( "image", "load!{{baseDir}}templates/assets/editors/image/image-editor.html",
                   function( rootElement, butter, compiledLayout ) {

    var _rootElement = rootElement,
        _tagRadio = _rootElement.querySelector( "#image-tag-radio" ),
        _galleryRadio = _rootElement.querySelector( "#image-gallery-radio" ),
        _tagInput = _rootElement.querySelector( "#image-tag-input" ),
        _galleryInput = _rootElement.querySelector( "#image-gallery-input" ),
        _urlInput = _rootElement.querySelector( "#image-url-input" ),
        _linkInput = _rootElement.querySelector( "#image-link-input" ),
        _countInput = _rootElement.querySelector( "#image-count-input" ),
        _singleImageTab = _rootElement.querySelector( ".image-single" ),
        _flickrImageTab = _rootElement.querySelector( ".image-flickr" ),
        _dropArea = _rootElement.querySelector( ".image-droparea" ),
        _imageToggler = _rootElement.querySelector( "#image-toggler" ),
        _maxImageCount,
        _this = this,
        _trackEvent,
        _galleryActive = false,
        _tagsActive = false,
        _flickrActive = false,
        _singleActive = false,
        _popcornInstance,
        _inSetup,
        _cachedValues;

    function updateTrackEvent( te, props ) {
      _this.setErrorState();
      _this.updateTrackEventSafe( te, props );
    }

    function toggleTabs() {
      _singleImageTab.classList.toggle( "display-off" );
      _flickrImageTab.classList.toggle( "display-off" );
    }

    function attachDropHandlers() {
      window.EditorHelper.droppable( _trackEvent, _dropArea );

      butter.listen( "droppable-unsupported", function unSupported() {
        _this.setErrorState( "Sorry, but your browser doesn't support this feature." );
      });

      butter.listen( "droppable-upload-failed", function failedUpload( e ) {
        _this.setErrorState( e.data );
      });
    }

    function calcImageTime() {
      var imageTime = rootElement.querySelector( ".image-time-bold" ),
          popcornOptions = _trackEvent.popcornOptions,
          eventDuration = popcornOptions.end - popcornOptions.start,
          time;

      time = Math.round( ( eventDuration / popcornOptions.count ) * ( Math.pow( 10, 1 ) ) ) / Math.pow( 10, 1 );
      time = time > 0.01 ? time : 0.01;

      imageTime.innerHTML = time + " seconds";
    }

    function galleryHandler() {
      if ( !_galleryActive && !_inSetup ) {
        _galleryActive = true;
        _trackEvent.update({
          src: "",
          linkSrc: "",
          tags: "",
          photosetId: _cachedValues.photosetId.data
        });
      }
      _tagsActive = _galleryInput.disabled = false;
      _tagInput.disabled = _galleryRadio.checked = true;
      _galleryInput.classList.remove( "butter-disabled" );
      _tagInput.classList.add( "butter-disabled" );
    }

    function tagHandler() {
      if ( !_tagsActive && !_inSetup ) {
        _tagsActive = true;
        _trackEvent.update({
          tags: _cachedValues.tags.data,
          src: "",
          linkSrc: "",
          photosetId: ""
        });
      }

      _galleryActive = _tagInput.disabled = false;
      _tagInput.classList.remove( "butter-disabled" );
      _galleryInput.disabled = _tagRadio.checked = true;
      _galleryInput.classList.add( "butter-disabled" );
    }

    function isEmptyInput( value ) {
      return value === "";
    }

    function isDataURI( url ) {
      return ( /^data:image/ ).test( url );
    }

    function flickrHandler() {
      var popcornOptions = _trackEvent.popcornOptions;

      _flickrActive = true;
      _singleActive = false;

      if ( _flickrImageTab.classList.contains( "display-off" ) ) {
        toggleTabs();
        _imageToggler.value = "image-flickr";
      }

      // Default state is Using a Flickr Tag Search. This ensures that even if the first two conditions are false
      // that a default state is still properly applied
      if ( _tagsActive || popcornOptions.tags || ( !popcornOptions.tags && !popcornOptions.photosetId ) ) {
        tagHandler();
      } else {
        galleryHandler();
      }

      calcImageTime();
    }

    function singleImageHandler() {
      _galleryActive = _tagsActive = _flickrActive = false;

      if ( !_singleActive && !_inSetup ) {
        _singleActive = true;
        _trackEvent.update({
          src: _cachedValues.src.data,
          linkSrc: _cachedValues.linkSrc.data,
          tags: "",
          photosetId: ""
        });
      }

      if ( isDataURI( _trackEvent.popcornOptions.src ) ) {
        _urlInput.value = "data:image";
      }

      if ( _singleImageTab.classList.contains( "display-off" ) ) {
        toggleTabs();
        _imageToggler.value = "image-single";
      }
    }

    // Mode specifies what values should be retrieved from the cached values
    function displayCachedValues( mode ) {
      var element;

      // Repopulate fields with old values to prevent confusion
      for ( var i in _cachedValues ) {
        if ( _cachedValues.hasOwnProperty( i ) ) {
          element = _rootElement.querySelector( "[data-manifest-key='" + i + "']" );

          if ( _cachedValues[ i ].type === mode ) {
            if ( isDataURI( _cachedValues[ i ].data ) ) {
              _urlInput.value = "data:image";
            } else {
              element.value = _cachedValues[ i ].data;
            }
          }
        }
      }
    }

    function setup( trackEvent ) {
      var container = _rootElement.querySelector( ".editor-options" ),
          startEndElement,
          manifestOpts = trackEvent.popcornTrackEvent._natives.manifest.options;

      _inSetup = true;
      _maxImageCount = manifestOpts.count.MAX_COUNT ? manifestOpts.count.MAX_COUNT : 20;

      function callback( elementType, element, trackEvent, name ) {
        if ( elementType === "select" ) {
          _this.attachSelectChangeHandler( element, trackEvent, name );
        }
      }

      function attachHandlers() {
        _this.attachInputChangeHandler( _urlInput, trackEvent, "src", function( te, prop ) {
          var src = prop.src;

          if ( isEmptyInput( src ) ) {
            return;
          }

          // Chrome can't display really long dataURIs in their text inputs. This is to prevent accidentally
          // removing their image
          if ( src === "data:image" &&  isDataURI( te.popcornTrackEvent.src ) ) {
            src = te.popcornTrackEvent.src;
          }

          _cachedValues.src.data = src;

          updateTrackEvent( te, {
            src: src,
            tags: "",
            photosetId: ""
          });
        });

        _this.createTooltip( _linkInput, {
          name: "image-link-tooltip" + Date.now(),
          element: _linkInput.parentElement,
          message: "Links will be clickable when shared.",
          top: "105%",
          left: "50%",
          hidden: true,
          hover: false
        });

        _this.attachInputChangeHandler( _linkInput, trackEvent, "linkSrc", function( te, prop ) {
          _cachedValues.linkSrc.data = prop.linkSrc;

          updateTrackEvent( te, {
            linkSrc: prop.linkSrc
          });
        });

        _this.attachInputChangeHandler( _galleryInput, trackEvent, "photosetId", function( te, prop ) {
          if ( isEmptyInput( prop.photosetId ) ) {
            return;
          }

          _cachedValues.photosetId.data = prop.photosetId;

          updateTrackEvent( te, {
            src: "",
            linkSrc: "",
            tags: "",
            photosetId: prop.photosetId
          });
        });

        _this.attachInputChangeHandler( _tagInput, trackEvent, "tags", function( te, prop ) {
          if ( isEmptyInput( prop.tags ) ) {
            return;
          }

          _cachedValues.tags.data = prop.tags;

          updateTrackEvent( te, {
            src: "",
            linkSrc: "",
            tags: prop.tags,
            photosetId: ""
          });
        });

        _this.attachInputChangeHandler( _countInput, trackEvent, "count", function( te, prop ) {
          var count = prop.count > 0 ? prop.count : 1;

          if ( count > _maxImageCount ) {
            _this.setErrorState( "Error: Image count must not be greater than " + _maxImageCount + "." );
            return;
          }

          if ( isEmptyInput( prop.count ) ) {
            return;
          }

          _cachedValues.count.data = count;

          updateTrackEvent( te, {
            count: count
          });
        });

        // Wrap specific input elements
        _this.wrapTextInputElement( _urlInput );
        _this.wrapTextInputElement( _linkInput );
        _this.wrapTextInputElement( _galleryInput );

        _tagRadio.addEventListener( "click", tagHandler, false );
        _galleryRadio.addEventListener( "click", galleryHandler, false );

        attachDropHandlers();
      }

      startEndElement = _this.createStartEndInputs( trackEvent, updateTrackEvent );
      container.insertBefore( startEndElement, container.firstChild );

      _this.createPropertiesFromManifest({
        trackEvent: trackEvent,
        callback: callback,
        basicContainer: container,
        manifestKeys: [ "transition" ]
      });

      attachHandlers();

      _this.updatePropertiesFromManifest( trackEvent );
      _this.setTrackEventUpdateErrorCallback( _this.setErrorState );

      if ( trackEvent.popcornOptions.src ) {
        _singleActive = true;
        singleImageHandler();
        displayCachedValues( "single" );
      } else {
        flickrHandler();
        displayCachedValues( "flickr" );
      }

      _this.scrollbar.update();
      _inSetup = false;
    }

    function toggleHandler( e ) {
      toggleTabs();

      if ( e.target.value === "image-single" ) {
        singleImageHandler();
      } else {
        flickrHandler();
      }

      _this.scrollbar.update();
    }

    function clickPrevention() {
      return false;
    }

    function onTrackEventUpdated( e ) {
      _trackEvent = e.target;
      calcImageTime();
      _this.updatePropertiesFromManifest( _trackEvent );
      _this.setErrorState( false );

      var links, i, ln,
          src = _trackEvent.popcornOptions.src;

      if ( _trackEvent.popcornTrackEvent._container ) {
        links = _trackEvent.popcornTrackEvent._container.querySelectorAll( "a" );

        if ( links ) {
          for ( i = 0, ln = links.length; i < ln; i++ ) {
            links[ i ].onclick = clickPrevention;
          }
        }
      }

      // Droppable images aren't getting their data URIs cached so just perform a double check here
      // on updating
      if ( src ) {
        _cachedValues.src.data = src;
      }

      // Ensure right group is displayed
      // Mode is flipped here to ensure cached values aren't placed right back in after updating
      if ( src && !_flickrActive ) {
        singleImageHandler();
        displayCachedValues( "flickr" );
      } else if ( _flickrActive ) {
        flickrHandler();
        displayCachedValues( "single" );
      }

      _this.scrollbar.update();
    }

    Editor.TrackEventEditor.extend( _this, butter, rootElement, {
      open: function( parentElement, trackEvent ) {
        var popcornOptions = trackEvent.popcornOptions,
            manifestOpts = trackEvent.popcornTrackEvent._natives.manifest.options;

        if ( !_cachedValues ) {
          _cachedValues = {
            src: {
              data: popcornOptions.src || manifestOpts.src.default,
              type: "single"
            },
            linkSrc: {
              data: popcornOptions.linkSrc,
              type: "single"
            },
            tags: {
              data: popcornOptions.tags || manifestOpts.tags.default,
              type: "flickr"
            },
            photosetId: {
              data: popcornOptions.photosetId || manifestOpts.photosetId.default,
              type: "flickr"
            },
            count: {
              data: popcornOptions.count,
              type: "flickr"
            }
          };
        }

        _popcornInstance = trackEvent.track._media.popcorn.popcorn;
        _imageToggler.addEventListener( "change", toggleHandler, false );

        _this.applyExtraHeadTags( compiledLayout );
        _trackEvent = trackEvent;

        // The current popcorn instance
        _popcornInstance.on( "invalid-flickr-image", function() {
          _this.setErrorState( "Invalid Flicker Gallery URL. E.G: http://www.flickr.com/photos/etherworks/sets/72157630563520740/" );
        });

        _trackEvent.listen( "trackeventupdated", onTrackEventUpdated );

        setup( trackEvent );
      },
      close: function() {
        _imageToggler.removeEventListener( "change", toggleHandler, false );
        _this.removeExtraHeadTags();
        _popcornInstance.off( "invalid-flickr-image" );
        _trackEvent.unlisten( "trackeventupdated", onTrackEventUpdated );
      }
    });
  });
}( window.Butter ));
