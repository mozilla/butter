// PLUGIN: gallery

(function ( Popcorn ) {

  function createImageDiv( imageInfo ) {
    var div = document.createElement( "div" );

    div.style.backgroundImage = "url( \"" + imageInfo.src + "\" )";
    div.classList.add( "gallery-plugin-img" );
    div.classList.add( imageInfo.transition );
    div.classList.add( "off" );
    div.style.top = imageInfo.top + "%";
    div.style.left = imageInfo.left + "%";
    div.style.height = imageInfo.height + "%";
    div.style.width = imageInfo.width + "%";

    return div;
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

  Popcorn.plugin( "gallery", {

    manifest: {
      about: {
        name: "Popcorn Gallery Plugin",
        version: "0.1",
        author: "@mjschranz"
      },
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
        images: {
          "default": [
            {
              src: "http://www.mozilla.org/media/img/home/firefox.png",
              transition: "popcorn-fade",
              top: 10,
              left: 10,
              width: 50,
              height: 50
            },
            {
              src: "http://upload.wikimedia.org/wikipedia/commons/thumb/a/af/DaveMustaine2010.jpg/800px-DaveMustaine2010.jpg",
              transition: "popcorn-pop",
              top: 40,
              left: 40,
              width: 50,
              height: 50
            }
          ],
          hidden: true
        },
        zindex: {
          hidden: true
        }
      }
    },

    _setup: function( options ) {
      var target = Popcorn.dom.find( options.target ),
          container = options._container = document.createElement( "div" ),
          self = this,
          lastVisible,
          inOuts,
          image,
          imageInfo,
          count = options.images.length,
          imageRefs = [];

      if ( !target ) {
        target = self.media.parentNode;
      }

      options._target = target;
      container.style.display = "none";
      container.id = Popcorn.guid( "gallery" );
      container.style.zIndex = +options.zindex;
      container.classList.add( "gallery-plugin-container" );
      target.appendChild( container );

      for ( var i = 0; i < count; i++ ) {
        imageInfo = options.images[ i ];
        image = createImageDiv( imageInfo );
        container.appendChild( image );
        imageRefs.push( image );
      }

      inOuts = calculateInOutTimes( options.start, options.end - options.start, count );

      options._updateImage = function() {
        var io,
            ref,
            currTime = self.currentTime(),
            i = imageRefs.length - 1;

        for ( ; i >= 0; i-- ) {
          io = inOuts[ i ];
          ref = imageRefs[ i ];
          if ( currTime >= io[ "in" ] && currTime < io.out  ) {
            if ( lastVisible ) {
              lastVisible.classList.remove( "on" );
              lastVisible.classList.add( "off" );
            }
            ref.classList.add( "on" );
            ref.classList.remove( "off" );
            lastVisible = ref;
            break;
          }
        }
      };

      // Check if any need to be displayed immediately.
      options._updateImage();

      options.toString = function() {
        // use the default option if it doesn't exist
        return "LOL THIS IS A GALLERY";
      };
    },

    start: function( event, options ) {
      if ( options._container ) {
        if ( options._updateImage ) {
          this.on( "timeupdate", options._updateImage );
        }

        options._container.style.display = "block";
      }
    },

    end: function( event, options ) {
      if ( options._container ) {
        if ( options._updateImage ) {
          this.off( "timeupdate", options._updateImage );
        }

        options._container.style.display = "none";
      }
    },

    _teardown: function( options ) {
      if ( options._target ) {
        options._target.removeChild( options._container );
      }

      if ( options._updateImage ) {
        this.off( options._updateImage );
      }
    }
  });
}( window.Popcorn ));
