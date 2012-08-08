/*global EditorHelper*/

EditorHelper.addPlugin( "webpage", function( trackEvent ) {
  var _popcornOptions = trackEvent.popcornTrackEvent,
      _wrapper = _popcornOptions._wrapper,
      _iframe = _popcornOptions._iframe,
      _media = document.getElementById( trackEvent.track._media.target ),
      _handleElem = document.createElement( "div" );

  _handleElem.innerHTML = "<a class=\"butter-btn btn-light\"><span class=\"icon icon-only icon-move\"></span></a>";

  _handleElem.classList.add( "editor-drag-handle" );

  _wrapper.appendChild( _handleElem );

  function startFn() {
    _iframe.classList.add( "editor-disable-pointer-events" );
  }

  function endFn() {
    _iframe.classList.remove( "editor-disable-pointer-events" );
  }

  window.EditorHelper.resizable( trackEvent, _wrapper, _media, {
    handlePositions: null,
    start: startFn,
    end: endFn
  });

  window.EditorHelper.draggable( trackEvent, _wrapper, _media, {
    handle: _handleElem,
    start: startFn,
    end: endFn
  });

});
