/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

(function( Butter ) {

  var Editor = Butter.Editor;

  Editor.register( "gallery", "load!{{baseDir}}templates/assets/editors/gallery/gallery-editor.html",
                   function( rootElement, butter, compiledLayout ) {

    // Defaults
    var DEFAULT_WIDTH = 40,
        DEFAULT_HEIGHT = 50,
        DEFAULT_TOP = 20,
        DEFAULT_LEFT = 20,
        HIGHLIGHT_CLASS = "ui-state-sortable-highlight",
        DEFAULT_TRANSITION = "popcorn-fade",
        API_HANDLERS;

    var _rootElement = rootElement,
        _dropArea = _rootElement.querySelector( ".image-droparea" ),
        _this = this,
        _trackEvent,
        _cachedValues,
        _manageList = _rootElement.querySelector( "#gallery-sortable" ),
        _listContainer = _rootElement.querySelector( "#gallery-fieldset" ),
        _selectedImageId,
        _transitionsContainer = _rootElement.querySelector( ".transitions" ),
        _transitions = _rootElement.querySelector( "#transition-setter" ),
        _galleryURL = _rootElement.querySelector( "#gallery-url" ),
        _media,
        _APIKEY = "&api_key=b939e5bd8aa696db965888a31b2f1964",
        _flickrUrl = window.location.protocol === "https:" ? "https://secure.flickr.com/services/" : "http://api.flickr.com/services/",
        _searchPhotosCmd = _flickrUrl + "rest/?method=flickr.photos.search&page=1&extras=url_m&media=photos&safe_search=1",
        _getPhotosetCmd = _flickrUrl + "rest/?method=flickr.photosets.getPhotos&extras=url_m&media=photos",
        _getPhotoSizesCmd = _flickrUrl + "rest/?method=flickr.photos.getSizes",
        _jsonBits = "&format=json&jsoncallback=flickr",
        _flickrCallback;

    _flickrCallback = function( data ) {

      var _collection = ( data.photos || data.photoset ),
          _photos;

      if ( !_collection ) {
        return;
      }

      _photos = _collection.photo;

      if ( !_photos ) {
        return;
      }

      var currentImages = _trackEvent.popcornOptions.images,
          newImage,
          newImages = [];

      Popcorn.forEach( _photos, function ( item, i ) {

        newImage = {
          src: item.url_m,
          top: DEFAULT_TOP,
          left: DEFAULT_LEFT,
          width: DEFAULT_WIDTH,
          height: DEFAULT_HEIGHT,
          transition: DEFAULT_TRANSITION,
          id: Popcorn.guid( "gallery-image" )
        };
        currentImages.push( newImage );
        newImages.push( newImage );
      });

      _trackEvent.update( currentImages );

      // Add all of them to our editors list.
      for ( var i = 0; i < newImages.length; i++ ) {
        addToList( newImages[ i ] );
      }
    };

    API_HANDLERS = {
      parse: function( url ) {
        // PLACEHOLDER
      },
      imgur: function( url ) {
        // PLACEHOLDER
      },
      /*
       * EG: http://www.flickr.com/photos/etherworks/sets/72157630563520740/
       */
      flickr_url: function( url ) {
        var photoSplit,
            ln,
            url,
            uri,
            photosetId,
            i;

        if ( url.indexOf( "flickr.com" ) === -1 ) {

          _this.setErrorState( "Invalid Flicker Gallery URL. E.G: http://www.flickr.com/photos/etherworks/sets/72157630563520740/" );
          return;
        }

        photoSplit = url.split( "/" );

        // Can't always look for the ID in the same spot depending if the user includes the
        // last slash
        for ( i = 0, ln = photoSplit.length; i < ln; i++ ) {
          url = photoSplit[ i ];
          if ( !isNaN( url ) && url !== "" ) {
            photosetId = url;
            break;
          }
        }

        uri = _getPhotosetCmd + "&photoset_id=" + photosetId + _APIKEY + _jsonBits;
        Popcorn.getJSONP( uri, _flickrCallback );
      },
      flickr_tags: function( tag ) {
        var uri = _searchPhotosCmd + _APIKEY + "&per_page=" + 5 + "&tags=" + tag.substring( 1 ) + _jsonBits;
        Popcorn.getJSONP( uri, _flickrCallback );
      },
      dropbox: function( url ) {
        // PLACEHOLDER
      }
    };

    function updateTrackEvent( te, props ) {
      _this.setErrorState();
      _this.updateTrackEventSafe( te, props );
    }

    function attachDropHandlers() {
      window.EditorHelper.droppable( _trackEvent, _dropArea, function( src ) {
        var currentImages = _trackEvent.popcornOptions.images,
            newImage;

        newImage = {
          src: src,
          top: DEFAULT_TOP,
          left: DEFAULT_LEFT,
          width: DEFAULT_WIDTH,
          height: DEFAULT_HEIGHT,
          transition: DEFAULT_TRANSITION,
          id: Popcorn.guid( "gallery-image" )
        };

        currentImages.push( newImage );
        _trackEvent.update( currentImages );
        addToList( newImage );
      });

      butter.listen( "droppable-unsupported", function error() {
        _this.setErrorState( "Sorry, but your browser doesn't support this feature." );
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

    function attachImageHandlers() {
      var list = _manageList.querySelectorAll( "div" ),
          inOutTimes = _trackEvent.popcornTrackEvent._inOuts;

      function addMouseDown( element, index ) {
        element.onmousedown = function( e ) {
          var images = _trackEvent.popcornOptions.images;

          imageTimes = inOutTimes[ index ];

          for ( var i = 0; i < list.length; i++ ) {
            list[ i ].classList.remove( HIGHLIGHT_CLASS );
          }

          _media.currentTime = imageTimes[ "in" ];
          e.target.classList.add( HIGHLIGHT_CLASS );
          _selectedImageId = e.target.id;
          _transitionsContainer.classList.remove( "hidden" );

          for ( var k = 0; k < images.length; k++ ) {
            if ( images[ k ].id === _selectedImageId ) {
              _transitions.value = images[ k ].transition;
            }
          }
        };
      }

      for ( var k = 0; k < list.length; k++ ) {
        addMouseDown( list[ k ], k );
      }
    }

    function onSortableUpdate( event, ui ) {
      var sortedElement = ui.item[ 0 ],
          images = _trackEvent.popcornOptions.images,
          elementPosition,
          oldImage,
          elements = _manageList.querySelectorAll( "div" );

      for ( var i = 0; i < elements.length; i++ ) {
        if ( elements[ i ].id === sortedElement.id ) {
          elementPosition = i;
          break;
        }
      }

      for ( var k = 0; k < images.length; k++ ) {
        if ( images[ k ].id === sortedElement.id ) {
          oldImage = images[ k ];
          images.splice( k, 1 );
          break;
        }
      }

      images.splice( elementPosition, 0, oldImage );
      _trackEvent.update( images );
      _media.currentTime = _trackEvent.popcornTrackEvent._inOuts[ elementPosition ].in;
      attachImageHandlers();
    }

    function addToList( image ) {
      var item = document.createElement( "div" ),
          closeButton = document.createElement( "span" );

      closeButton.classList.add( "close-button" );
      closeButton.addEventListener( "click", function( e ) {
        removeFromList( e.target.parentNode.id );
      }, false );

      item.id = image.id;
      item.style.backgroundImage = "url( \"" + image.src + "\" )";
      item.appendChild( closeButton );
      _manageList.appendChild( item );
      attachImageHandlers();
    }

    function removeFromList( id ) {
      var element = _manageList.querySelector( "#" + id ),
          images = _trackEvent.popcornOptions.images;

      if ( element && element.parentNode === _manageList ) {
        _manageList.removeChild( element );
      }

      for ( var i = 0; i < images.length; i++ ) {
        if ( images[ i ].id === id ) {
          images.splice( i, 1 );
          _transitionsContainer.classList.add( "hidden" );
          break;
        }
      }

      _trackEvent.update({
        images: images
      });
      attachImageHandlers();
    }

    function generateManageList() {
      var item,
          images = _trackEvent.popcornOptions.images,
          img,
          closeButton;

      for ( var i = 0; i < images.length; i++ ) {
        img = images[ i ];
        item = document.createElement( "div" );
        closeButton = document.createElement( "span" );

        closeButton.classList.add( "close-button" );
        closeButton.addEventListener( "click", function( e ) {
          removeFromList( e.target.parentNode.id );
        }, false );

        item.id = img.id;
        item.appendChild( closeButton );
        item.style.backgroundImage = "url( " + img.src + " )";
        _manageList.appendChild( item );
      }

      window.jQuery( _manageList ).sortable({
        update: onSortableUpdate,
        containment: _listContainer,
        scroll: true,
        scrollSensitivity: 50,
        scrollSpeed: 30
      });

      attachImageHandlers();
    }

    function setup( trackEvent ) {
      var container = _rootElement.querySelector( ".editor-options" ),
          manifestOpts = trackEvent.popcornTrackEvent._natives.manifest.options,
          sortable = document.getElementById( "sortable" );

      function callback( elementType, element, trackEvent, name ) {
        if ( elementType === "select" ) {
          _this.attachSelectChangeHandler( element, trackEvent, name );
        }
      }

      function attachHandlers() {
        attachDropHandlers();
      }

      container.insertBefore( _this.createStartEndInputs( trackEvent, updateTrackEvent ), container.firstChild );

      _this.createPropertiesFromManifest({
        trackEvent: trackEvent,
        callback: callback,
        basicContainer: container,
        ignoreManifestKeys: [ "start", "end" ]
      });

      attachHandlers();
      generateManageList();

      _transitions.addEventListener( "change", function( e ) {
        var newTransition = e.target.value,
            images = _trackEvent.popcornOptions.images;

        for ( var i = 0; i < images.length; i++ ) {
          if ( _selectedImageId && images[ i ].id === _selectedImageId ) {
            images[ i ].transition = newTransition;
            break;
          }
        }

        _trackEvent.update( images );
        attachImageHandlers();
      }, false );

      function addGallery( e ) {
        var val = e.target.value;

        if ( val.indexOf( "flickr.com" ) >= 0 ) {
          API_HANDLERS.flickr_url( val );
        } else if ( val.indexOf( "#" ) === 0 ) {
          API_HANDLERS.flickr_tags( val );
        } else {
          var currentImages = _trackEvent.popcornOptions.images,
              newImage;

          newImage = {
            src: e.target.value,
            top: DEFAULT_TOP,
            left: DEFAULT_LEFT,
            width: DEFAULT_WIDTH,
            height: DEFAULT_HEIGHT,
            transition: DEFAULT_TRANSITION,
            id: Popcorn.guid( "gallery-image" )
          };

          currentImages.push( newImage );
          _trackEvent.update( currentImages );
          addToList( newImage );
        }
      }

      _galleryURL.addEventListener( "blur", addGallery, false );
      _galleryURL.addEventListener( "keypress", function( e ) {
        if ( e.keyCode === 13 ) {
          addGallery( e );
        }
      }, false );

      _this.updatePropertiesFromManifest( trackEvent );
      _this.setTrackEventUpdateErrorCallback( _this.setErrorState );
    }

    function onTrackEventUpdated( e ) {
      _trackEvent = e.target;
      _this.updatePropertiesFromManifest( _trackEvent );
      _this.setErrorState( false );
    }

    Editor.TrackEventEditor.extend( _this, butter, rootElement, {
      open: function( parentElement, trackEvent ) {
        _this.applyExtraHeadTags( compiledLayout );
        _trackEvent = trackEvent;
        _media = butter.currentMedia;
        _trackEvent.listen( "trackeventupdated", onTrackEventUpdated );

        setup( trackEvent );
      },
      close: function() {
        _this.removeExtraHeadTags();
        _trackEvent.unlisten( "trackeventupdated", onTrackEventUpdated );
      }
    });
  });
}( window.Butter ));
