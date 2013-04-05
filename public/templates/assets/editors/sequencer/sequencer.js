/*global EditorHelper*/

EditorHelper.addPlugin( "sequencer", function( trackEvent ) {
  var _container,
      _popcornOptions,
      _target;

  _popcornOptions = trackEvent.popcornTrackEvent;
  _container = _popcornOptions._container;
  _target = _popcornOptions._target;

  if ( window.jQuery ) {
    window.EditorHelper.draggable( trackEvent, _container, _target );
    window.EditorHelper.resizable( trackEvent, _container, _target, {
      handlePositions: "e, se, s, sw, w, n, ne",
      minWidth: 10,
      minHeight: 10
    });
  }
});
