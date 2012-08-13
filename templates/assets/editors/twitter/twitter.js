/*global EditorHelper*/

EditorHelper.addPlugin( "twitter", function( trackEvent ) {
  var container = trackEvent.popcornTrackEvent._container,
      media = document.getElementById( trackEvent.track._media.target );

  if ( trackEvent.popcornTrackEvent.layout === "feed" ) {
    EditorHelper.draggable( trackEvent, container, media );
  }
});