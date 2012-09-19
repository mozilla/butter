/*global EditorHelper*/

EditorHelper.addPlugin( "wikipedia", function( trackEvent ) {
  var _container,
      _popcornOptions,
      media;

  _popcornOptions = trackEvent.popcornTrackEvent;
  _container = _popcornOptions._container;
  media = document.getElementById( trackEvent.track._media.target );

  if ( window.jQuery ) {

    window.EditorHelper.resizable( trackEvent, _container, media, {
      minWidth: 40,
      minHeight: 40
    });
    window.EditorHelper.draggable( trackEvent, _container, media );
  }

});