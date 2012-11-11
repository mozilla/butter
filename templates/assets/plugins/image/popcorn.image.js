"use strict";

// PLUGIN: IMAGE
// Key
(function ( Popcorn ) {

  var APIKEY = "&api_key=b939e5bd8aa696db965888a31b2f1964",
      flickrUrl = window.location.protocol === "https:" ? "https://secure.flickr.com/services/" : "http://api.flickr.com/services/",
      searchPhotosCmd = flickrUrl + "rest/?method=flickr.photos.search&page=1&extras=url_m&media=photos&safe_search=1",
      getPhotosetCmd = flickrUrl + "rest/?method=flickr.photosets.getPhotos&extras=url_m&media=photos",
      getPhotoSizesCmd = flickrUrl + "rest/?method=flickr.photos.getSizes",
      jsonBits = "&format=json&jsoncallback=flickr",
      FLICKR_SINGLE_CHECK = "flickr.com/photos/";

  function searchImagesFlickr( tags, count, userId, ready ) {
    var uri = searchPhotosCmd + APIKEY + "&per_page=" + count + "&";
    if ( userId && typeof userId !== "function" ) {
      uri += "&user_id=" + userId;
    }
    if ( tags ) {
      uri += "&tags=" + tags;
    }
    uri += jsonBits;
    Popcorn.getJSONP( uri, ready || userId );
  }

  function getPhotoSet( photosetId , ready, pluginInstance ) {
    var photoSplit,
        ln,
        url,
        uri,
        i;

    /* Allow for a direct gallery URL to be passed or just a gallery ID. This will accept:
     *
     * http://www.flickr.com/photos/etherworks/sets/72157630563520740/
     * or
     * 72157630563520740
     */
    if ( isNaN( photosetId ) ) {

      if ( photosetId.indexOf( "flickr.com" ) === -1 ) {

        pluginInstance.emit( "invalid-flickr-image" );
        return;
      }

      photoSplit = photosetId.split( "/" );

      // Can't always look for the ID in the same spot depending if the user includes the
      // last slash
      for ( i = 0, ln = photoSplit.length; i < ln; i++ ) {
        url = photoSplit[ i ];
        if ( !isNaN( url ) && url !== "" ) {
          photosetId = url;
          break;
        }
      }
    }

    uri = getPhotosetCmd + "&photoset_id=" + photosetId + APIKEY + jsonBits;
    Popcorn.getJSONP( uri, ready );
  }

  function calculateInOutTimes( start, duration, count ) {
    var inArr = [],
        i = 0,
        last = start,
        interval = duration / count;

    while ( i < count ) {
      inArr.push({
        "in": last = Math.round( ( start + ( interval * i++ ) ) * 100 ) / 100,
        out: i < count ? Math.round( ( last + interval ) * 100 ) / 100 : start + duration
      });
    }
    return inArr;
  }

  function validateDimension( value, fallback ) {
    if ( typeof value === "number" ) {
      return value;
    }
    return fallback;
  }

  function createImageDiv( imageUrl, linkUrl, instance ) {
    var div = document.createElement( "div" ),
        link = document.createElement( "a" );

    div.style.backgroundImage = "url( \"" + imageUrl + "\" )";
    div.classList.add( "image-plugin-img" );

    if ( linkUrl ) {
      link.setAttribute( "href", linkUrl );

      link.onclick = function() {
        instance.media.pause();
      };
    }
    link.setAttribute( "target", "_blank" );
    link.classList.add( "image-plugin-link" );

    link.appendChild( div );
    return link;
  }

  Popcorn.plugin( "image", {

    _setup: function( options ) {

      var _target,
          _container,
          _flickrCallback,
          _this = this;

      options._target = _target = Popcorn.dom.find( options.target );
      options._container = _container = document.createElement( "div" );

      _container.classList.add( "image-plugin-container" );
      _container.style.width = validateDimension( options.width, "100" ) + "%";
      _container.style.height = validateDimension( options.height, "100" ) + "%";
      _container.style.top = validateDimension( options.top, "0" ) + "%";
      _container.style.left = validateDimension( options.left, "0" ) + "%";
      _container.style.zIndex = +options.zindex;
      _container.classList.add( options.transition );
      _container.classList.add( "off" );

      if ( _target ) {

        _target.appendChild( _container );

        if ( options.src ) {

          if ( options.src.indexOf( FLICKR_SINGLE_CHECK ) > -1 ) {
            var url = options.src,
                urlSplit,
                uri,
                ln,
                _flickrStaticImage,
                photoId,
                i;

            urlSplit = url.split( "/" );

            for ( i = 0, ln = urlSplit.length; i < ln; i++ ) {
              url = urlSplit[ i ];
              if ( !isNaN( url ) && url !== "" ) {
                photoId = url;
                break;
              }
            }

            uri = getPhotoSizesCmd + APIKEY + "&photo_id=" + photoId + jsonBits;


            _flickrStaticImage = function( data ) {

              if ( data.stat === "ok" ) {

                // Unfortunately not all requests contain an "Original" size option
                // so I'm always taking the second last one. This has it's upsides and downsides
                _container.appendChild( createImageDiv( data.sizes.size[ data.sizes.size.length - 2 ].source, options.linkSrc, _this ) );
              }
            };

            Popcorn.getJSONP( uri, _flickrStaticImage );
          } else {
            _container.appendChild( createImageDiv( options.src, options.linkSrc, _this ) );
          }

        } else {

          _flickrCallback = function( data ) {

            var _collection = ( data.photos || data.photoset ),
                _photos,
                _inOuts,
                _lastVisible,
                _url,
                _link,
                _tagRefs = [],
                _count = options.count || _photos.length;

            if ( !_collection ) {
              return;
            }

            _photos = _collection.photo;

            if ( !_photos ) {
              return;
            }

            Popcorn.forEach( _photos, function ( item, i ) {

              _url = ( item.media && item.media.m ) || window.unescape( item.url_m );

              if ( i < _count ) {
                _link = createImageDiv( _url, _url, _this );
                _link.classList.add( "image-plugin-hidden" );
                _container.appendChild( _link );
                _tagRefs.push( _link );
              }
            });

            _inOuts = calculateInOutTimes( options.start, options.end - options.start, _count );

            options._updateImage = function() {
              var io,
                  ref,
                  currTime = _this.currentTime(),
                  i = _tagRefs.length - 1;
              for ( ; i >= 0; i-- ) {
                io = _inOuts[ i ];
                ref = _tagRefs[ i ];
                if ( currTime >= io[ "in" ] && currTime < io.out && ref.classList.contains( "image-plugin-hidden" ) ) {
                  if ( _lastVisible ) {
                    _lastVisible.classList.add( "image-plugin-hidden" );
                  }
                  ref.classList.remove( "image-plugin-hidden" );
                  _lastVisible = ref;
                  break;
                }
              }
            };

            // Check if should be currently visible
            options._updateImage();

            //  Check if should be updating
            if ( _this.currentTime() >= options.start && _this.currentTime() <= options.end ) {
              _this.on( "timeupdate", options._updateImage );
            }
          };

          if ( options.tags ) {
            searchImagesFlickr( options.tags, options.count || 10, _flickrCallback );
          } else if ( options.photosetId ) {
            getPhotoSet( options.photosetId, _flickrCallback, _this );
          }
        }

        options.toString = function() {
          if ( /^data:/.test( options.src ) ) {
            // might ba a data URI
            return options.src.substring( 0 , 30 ) + "...";
          } else if ( options.src ) {
            return options.src;
          } else if ( options.tags ) {
            return options.tags;
          } else if ( options.photosetId ) {
            return options.photosetId;
          }

          return "Image Plugin";
        };
      }
    },

    start: function( event, options ) {
      if ( options._container ) {
        if ( options._updateImage ) {
          this.on( "timeupdate", options._updateImage );
        }

        options._container.classList.add( "on" );
        options._container.classList.remove( "off" );
      }
    },

    end: function( event, options ) {
      if( options._container ) {
        if ( options._updateImage ) {
          this.off( "timeupdate", options._updateImage );
        }

        options._container.classList.add( "off" );
        options._container.classList.remove( "on" );
      }
    },

    _teardown: function( options ) {
      if ( options._updateImage ) {
        this.off( options._updateImage );
      }
      options._container.parentNode.removeChild( options._container );
      delete options._container;
    },

    manifest: {
      about: {
        name: "Popcorn image Plugin",
        version: "0.1",
        author: "cadecairos",
        website: "https://chrisdecairos.ca/"
      },
      options: {
        target: "video-overlay",
        src: {
          elem: "input",
          type: "url",
          label: "Source URL",
          "default": "http://www.mozilla.org/media/img/home/firefox.png"
        },
        linkSrc: {
          elem: "input",
          type: "url",
          label: "Link URL"
        },
        tags: {
          elem: "input",
          type: "text",
          label: "Flickr: Tags",
          optional: true,
          "default": "Mozilla"
        },
        photosetId: {
          elem: "input",
          type: "text",
          label: "Flickr: Photoset Id",
          optional: true,
          "default": "http://www.flickr.com/photos/etherworks/sets/72157630563520740/"
        },
        count: {
          elem: "input",
          type: "number",
          label: "Flickr: Count",
          optional: true,
          "default": 3,
          MAX_COUNT: 20
        },
        width: {
          elem: "input",
          type: "number",
          label: "Width",
          "default": 80,
          "units": "%",
          hidden: true
        },
        height: {
          elem: "input",
          type: "number",
          label: "Height",
          "default": 80,
          "units": "%",
          hidden: true
        },
        top: {
          elem: "input",
          type: "number",
          label: "Top",
          "default": 10,
          "units": "%",
          hidden: true
        },
        left: {
          elem: "input",
          type: "number",
          label: "Left",
          "default": 10,
          "units": "%",
          hidden: true
        },
        transition: {
          elem: "select",
          options: [ "None", "Pop", "Slide Up", "Slide Down", "Fade" ],
          values: [ "popcorn-none", "popcorn-pop", "popcorn-slide-up", "popcorn-slide-down", "popcorn-fade" ],
          label: "Transition",
          "default": "popcorn-fade"
        },
        start: {
          elem: "input",
          type: "number",
          label: "Start",
          units: "seconds"
        },
        end: {
          elem: "input",
          type: "number",
          label: "End",
          units: "seconds"
        },
        zindex: {
          hidden: true
        }
      }
    }
  });
}( window.Popcorn ));
