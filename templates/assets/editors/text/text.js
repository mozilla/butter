/*global EditorHelper*/

EditorHelper.addPlugin( "text", function( trackEvent ) {
  var _container,
      media;

  _container = trackEvent.popcornTrackEvent._container;
  media = document.getElementById( trackEvent.track._media.target );

  if ( window.jQuery ) {
    if ( trackEvent.popcornOptions.position === "custom" ) {
      EditorHelper.draggable( trackEvent, _container, media );
    }
    EditorHelper.contentEditable( trackEvent, _container.querySelectorAll( "span div" ) );
  }
});
