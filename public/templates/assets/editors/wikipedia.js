/*global EditorHelper*/

EditorHelper.addPlugin( "wikipedia", function( trackEvent ) {
  var _container,
      _popcornOptions,
      target;

  _popcornOptions = trackEvent.popcornTrackEvent;
  _container = _popcornOptions._container;
 target = _popcornOptions._target;

  if ( window.jQuery ) {
    window.EditorHelper.draggable( trackEvent, _container, target );
    window.EditorHelper.resizable( trackEvent, _container, target, {
      minWidth: 40,
      minHeight: 40,
      handlePositions: "n,ne,e,se,s,sw,w"
    });
  }

});
