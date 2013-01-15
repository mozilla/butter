/*global EditorHelper*/

EditorHelper.addPlugin( "container", function( trackEvent ) {
  var _container,
      target;

  _container = trackEvent.popcornTrackEvent._container;
  target = trackEvent.popcornTrackEvent._target;

  if ( window.jQuery ) {
    EditorHelper.draggable( trackEvent, _container, target );
    EditorHelper.resizable( trackEvent, _container, target, {
      minWidth: 10,
      minHeight: 10,
      handlePositions: "n,ne,se,sw,nw,e,s,w"
    });
  }
});
