/*global EditorHelper*/

EditorHelper.addPlugin( "gallery", function( trackEvent ) {
  var _container,
      target;

  _container = trackEvent.popcornTrackEvent._container;
  target = trackEvent.popcornTrackEvent._target;

  if ( window.jQuery ) {
    var images = _container.querySelectorAll( "div" );

    function callback( image ) {
      var popcornImages = trackEvent.popcornOptions.images;

      for ( var k = 0; k < popcornImages.length; k++ ) {
        if ( popcornImages[ k ].id === image._elementId ) {
          popcornImages[ k ].top = image.top;
          popcornImages[ k ].left = image.left;
          popcornImages[ k ].width = image.width;
          popcornImages[ k ].height = image.height;
          trackEvent.update( popcornImages );
          break;
        }
      }
    }

    for ( var i = 0; i < images.length; i++ ) {
      EditorHelper.draggable( trackEvent, images[ i ], target, null, callback );
      EditorHelper.resizable( trackEvent, images[ i ], target, null, callback );
    }
  }
});
