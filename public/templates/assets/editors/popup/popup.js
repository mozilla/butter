/*global EditorHelper*/

EditorHelper.addPlugin( "popup", function( trackEvent ) {
  var _container,
      target;

  _container = trackEvent.popcornTrackEvent._container;
  target = trackEvent.popcornTrackEvent._target;

  if ( window.jQuery ) {
    EditorHelper.contentEditable( trackEvent, _container.querySelectorAll( "span" ) );
    EditorHelper.draggable( trackEvent, _container, target );
    EditorHelper.resizable( trackEvent, _container, target, {
      handlePositions: "e",
      minWidth: 10
    });
  }
});
