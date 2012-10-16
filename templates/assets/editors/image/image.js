/*global EditorHelper*/

EditorHelper.addPlugin( "image", function( trackEvent ) {

  // Sizes of our max embed size
  var MAX_IMAGE_WIDTH = 1280,
      MAX_IMAGE_HEIGHT = 740;

  var _popcornOptions = trackEvent.popcornTrackEvent,
      _container = _popcornOptions._container,
      _media = document.getElementById( trackEvent.track._media.target ),
      _title = document.createElement( "span" );

  if ( window.jQuery ) {
    //Change default text to indicate draggable
    if ( _popcornOptions.src && !/^data:image/.test( _popcornOptions.src ) ){
      _title.classList.add( "title" );
      _title.innerHTML = "Drag an image from your desktop";
      _container.insertBefore( _title, _container.firstChild );
    }

    window.EditorHelper.resizable( trackEvent, _container, _media, {
      minWidth: 25,
      minHeight: 25
    });
    window.EditorHelper.draggable( trackEvent, _container, _media );
  }

  _container.addEventListener( "dragover", function( e ) {
    e.preventDefault();
    _container.classList.add( "butter-dragover" );
  }, false );

  _container.addEventListener( "dragleave", function( e ) {
    e.preventDefault();
    _container.classList.remove( "butter-dragover" );
  }, false );

  _container.addEventListener( "drop", function( e ) {
    _container.classList.add( "butter-dropped" );
    e.preventDefault();
    var file = e.dataTransfer.files[ 0 ],
        imgSrc,
        image,
        imgURI;

    if ( !file ) {
      return;
    }

    if ( window.URL ) {
      imgSrc = window.URL.createObjectURL( file );
    } else if ( window.webkitURL ) {
      imgSrc = window.webkitURL.createObjectURL( file );
    }

    image = document.createElement( "img" );
    image.onload = function() {
      var canvas = document.createElement( "canvas" ),
          width = this.width,
          height = this.height,
          aspectRatio = width / height,
          scaledWidth, scaledHeight, context;

      // Fit image nicely into our largest embed size, using
      // the longest side and aspect ratio.
      if ( width > height ) {
        scaledWidth = MAX_IMAGE_WIDTH;
        scaledHeight = Math.round( scaledWidth * aspectRatio );
      } else {
        scaledHeight = MAX_IMAGE_HEIGHT;
        scaledWidth = Math.round( scaledHeight * aspectRatio );
      }

      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      context = canvas.getContext( "2d" );
      context.drawImage( this, 0, 0, scaledWidth, scaledHeight );

      imgURI = canvas.toDataURL();
      trackEvent.update( { src: imgURI } );
    };
    image.src = imgSrc;

    // Force image to download, esp. Opera. We can't use
    // "display: none", since that makes it invisible, and
    // thus not load.  Opera also requires the image be
    // in the DOM before it will load.
    div = document.createElement( "div" );
    div.setAttribute( "data-butter-exclude", "true" );
    div.className = "butter-image-preload";
    div.appendChild( img );
    document.body.appendChild( div );

  }, false );
});
