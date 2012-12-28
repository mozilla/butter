/*global EditorHelper*/

EditorHelper.addPlugin( "text", function( trackEvent ) {
  var _container,
      target;

  _container = trackEvent.popcornTrackEvent._container;
  target = trackEvent.popcornTrackEvent._target;

  if ( window.jQuery ) {
    if ( trackEvent.popcornOptions.position === "custom" ) {
      EditorHelper.draggable( trackEvent, _container, target );
      EditorHelper.resizable( trackEvent, _container, target, {
        minWidth: 10,
        handlePositions: "e,w"
      });
    }
    EditorHelper.contentEditable( trackEvent, _container.querySelectorAll( "span" ) );
  }
});