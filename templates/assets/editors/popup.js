/*global EditorHelper*/

EditorHelper.addPlugin( "popup", function( trackEvent ) {
  var _container,
      _popcornOptions,
      _context,
      media;

  _popcornOptions = trackEvent.popcornTrackEvent;
  _container = _popcornOptions._container;
  media = document.getElementById( trackEvent.track._media.target );

  if ( window.jQuery ) {
    window.EditorHelper.draggable( trackEvent, _container, media );
  }
});