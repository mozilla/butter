/*global EditorHelper*/

EditorHelper.addPlugin( "sequencer", function( trackEvent ) {
  var _container,
      _popcornOptions,
      target;

  _popcornOptions = trackEvent.popcornTrackEvent;
  _container = _popcornOptions._container;
 target = _popcornOptions._target;

  if ( window.jQuery ) {

    window.EditorHelper.resizable( trackEvent, _container, target, {
      minWidth: 40,
      minHeight: 40
    });
    window.EditorHelper.draggable( trackEvent, _container, target );
  }
});
