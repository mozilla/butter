"use strict";

// PLUGIN: IMAGE
// Key 
(function ( Popcorn ) {

  var APIKEY = "&api_key=b939e5bd8aa696db965888a31b2f1964",
      flickrUrl = "http://api.flickr.com/services/",
      getUserIdCmd = flickrUrl + "rest/?method=flickr.people.findByUsername",
      getPhotoCmd = flickrUrl + "rest/?method=flickr.photos.search&page=1&extras=url_m&media=photos",
      getPhotosetCmd = flickrUrl + "rest/?method=flickr.photosets.getPhotos&extras=url_m&media=photos",
      jsonBits = "&format=json&jsoncallback=flickr";

  function getFlickrUserId( userName, ready ) {
    var uri = getUserIdCmd + "&username=" + userName + APIKEY + jsonBits;
    Popcorn.getJSONP( uri, ready );
  }

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

  Popcorn.plugin( "image", {

    _setup: function( options ) {

      var _img,
          _target,
          _link,
          _image,
          _container,
          _flickrCallback,
          _this = this;

      options._target = _target = Popcorn.dom.find( options.target );
      options._container = _container = document.createElement( "div" );

      _container.classList.add( "image-plugin-container" );
      _container.classList.add( "image-plugin-hidden" );
      _container.style.width = ( options.width || 100 ) + "%";
      _container.style.height = ( options.height || 100 ) + "%";
      _container.style.top = ( options.top || 0 ) + "%";
      _container.style.left = ( options.left || 0 ) + "%";

      if ( _target ) {

        _target.appendChild( _container );

        if ( options.src ) {

          if( options.href ) {
            _link = document.createElement( "a" );
            _link.href = options.href || options.src;
            _link.target = "_blank";
            _link.classList.add( "image-plugin-link" );
            _container.appendChild( _link );
          }

          _image = document.createElement( "img" );
          _image.addEventListener( "load", function() {
            _image.classList.add( "image-plugin-img" );
            _container.style.height = ( +options.height || 100 ) + "%";
            _container.style.width = ( +options.width || 100 ) + "%";

            ( _link || _container ).appendChild( _image );

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
            };

            Popcorn.forEach( _photos, function ( item, i ) {

              _url = ( item.media && item.media.m ) || unescape( item.url_m );

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
                };
              };
            };

            // Check if should be currently visible
            options._updateImage();

            //  Check if should be updating
            if ( _this.currentTime() >= options.start && _this.currentTime() <= options.end ) {
              _this.on( "timeupdate", options._updateImage );
            }
          };

          if ( options.username ) {
            getFlickrUserId( options.username, function( data ){
              getFlickrData( options.tags, data && data.user && data.user.nsid, _flickrCallback );
            });
          } else if ( options.tags ) {
            getFlickrData( options.tags, options._count || 10, _flickrCallback );
          } else if ( options.photosetId ) {
            getPhotoSet( options.photosetId, _flickrCallback );
          }
        }
      }
    },

    start: function( event, options ) {
      if ( options._container ) {
        options._updateImage && this.on( "timeupdate", options._updateImage );
        options._container.classList.remove( "image-plugin-hidden" );
      }
    },

    end: function( event, options ) {
      if( options._container ) {
        options._updateImage && this.off( "timeupdate", options._updateImage );
        options._container.classList.add( "image-plugin-hidden" );
      }
    },

    _teardown: function( options ) {
      options._updateImage && this.off( options._updateImage );
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
        href: {
          elem: "input",
          type: "url",
          label: "Link URL",
          optional: true
        },
        username: {
          elem: "input",
          type: "text",
          label: "Flickr: User Name",
          optional: true
        },
        tags: {
          elem: "input",
          type: "text",
          label: "Flickr: Tags",
          optional: true
        },
        photosetId: {
          elem: "input",
          type: "text",
          label: "Flickr: Photoset Id",
          optional: true,
          default: "72157630814677262"
        },
        width: {
          elem: "input",
          type: "number",
          label: "Width",
          "default": 100
        },
        count: {
          elem: "input",
          type: "number",
          label: "Flickr: Count",
          optional: true
        },
        height: {
          elem: "input",
          type: "number",
          label: "Height",
          "default": 100
        },
        top: {
          elem: "input",
          type: "number",
          label: "Top",
          "default": 10
        },
        left: {
          elem: "input",
          type: "number",
          label: "Left",
          "default": 10
        },
        start: {
          elem: "input",
          type: "number",
          label: "In"
        },
        end: {
          elem: "input",
          type: "number",
          label: "Out"
        }
      }
    }
  });
})( window.Popcorn );
