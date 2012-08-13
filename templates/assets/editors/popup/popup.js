/*global EditorHelper*/

EditorHelper.addPlugin( "popup", function( trackEvent ) {
  var _container,
      media;

  _container = trackEvent.popcornTrackEvent._container;
  media = document.getElementById( trackEvent.track._media.target );

  if ( window.jQuery ) {
    EditorHelper.draggable( trackEvent, _container, media );
    EditorHelper.resizable( trackEvent, _container, media, "e" );
  }
});