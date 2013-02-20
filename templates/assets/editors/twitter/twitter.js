/*global EditorHelper*/

EditorHelper.addPlugin( "twitter", function( trackEvent ) {
  var container = trackEvent.popcornTrackEvent._container,
      target = trackEvent.popcornTrackEvent._target;

  if ( trackEvent.popcornTrackEvent.layout === "feed" ) {
    EditorHelper.draggable( trackEvent, container, target );
    EditorHelper.resizable( trackEvent, container, target, {
      handlePositions: "e,se,s",
      minWidth: 30,
      minHeight: 65
    });
  }
});
