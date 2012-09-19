"use strict";

// PLUGIN: IMAGE
// Key
(function ( Popcorn ) {

  var APIKEY = "&api_key=b939e5bd8aa696db965888a31b2f1964",
      flickrUrl = "http://api.flickr.com/services/",
      getPhotoCmd = flickrUrl + "rest/?method=flickr.photos.search&page=1&extras=url_m&media=photos&safe_search=1",
      getPhotosetCmd = flickrUrl + "rest/?method=flickr.photosets.getPhotos&extras=url_m&media=photos",
      jsonBits = "&format=json&jsoncallback=flickr";

  function getFlickrData( tags, count, userId, ready ) {
    var uri = getPhotoCmd + APIKEY + "&per_page=" + count + "&";
    if ( userId && typeof userId !== "function" ) {
      uri += "&user_id=" + userId;
    }
    if ( tags ) {
      uri += "&tags=" + tags;
    }
    uri += jsonBits;
    Popcorn.getJSONP( uri, ready || userId );
  }

  function getPhotoSet( photosetId , ready ) {
    var uri = getPhotosetCmd + "&photoset_id=" + photosetId + APIKEY + jsonBits;
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

  Popcorn.plugin( "image", {

    _setup: function( options ) {

      var _target,
          _link,
          _image,
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
          _link = document.createElement( "a" );
          _link.setAttribute( "href", options.src );
          _link.setAttribute( "target", "_blank" );
          _link.classList.add( "image-plugin-link" );

          _image = document.createElement( "img" );
          _image.addEventListener( "load", function() {
            _image.classList.add( "image-plugin-img" );

            _link.appendChild( _image );
            _container.appendChild( _link );
            if ( _image.getBoundingClientRect().height > _image.getBoundingClientRect().width  ) {
              _link.classList.add( "image-plugin-portrait" );
            }

          }, false );

          _image.src = options.src;

        } else {

          _flickrCallback = function( data ) {

            var _collection = ( data.photos || data.photoset ),
                _photos = _collection.photo,
                _inOuts,
                _lastVisible,
                _url,
                _tagRefs = [],
                _count = options.count || _photos.length;

            if ( !_photos ) {
              return;
            }

            Popcorn.forEach( _photos, function ( item, i ) {

              _url = ( item.media && item.media.m ) || window.unescape( item.url_m );

              if ( i < _count ) {
                _link = document.createElement( "a" );
                _link.setAttribute( "href", item.link || _url );
                _link.setAttribute( "target", "_blank" );
                _link.classList.add( "image-plugin-link" );
                _link.classList.add( "image-plugin-hidden" );

                _image = document.createElement( "img" );
                _image.classList.add( "image-plugin-flickr-image" );
                _image.setAttribute( "src", _url );
                _link.appendChild( _image );
                _container.appendChild( _link );
                _tagRefs.push( _link );
                if ( +item.height_m > +item.width_m ) {
                  _link.classList.add( "image-plugin-portrait" );
                }
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
            getFlickrData( options.tags, options._count || 10, _flickrCallback );
          } else if ( options.photosetId ) {
            getPhotoSet( options.photosetId, _flickrCallback );
          }
        }

        options.toString = function() {
          if ( options.photosetId ) {
            return "Photoset Id: " + options.photosetId;
          } else if ( /^data:/.test( options.src ) ) {
            // might ba a data URI
            return options.src.substring( 0 , 30 ) + "...";
          }
          return options.src || options.tags || "Image Plugin";
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
          optional: true
        },
        count: {
          elem: "input",
          type: "number",
          label: "Flickr: Count",
          optional: true,
          "default": 1
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
