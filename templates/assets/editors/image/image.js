/*global EditorHelper*/

EditorHelper.addPlugin( "image", function( trackEvent ) {

  var _popcornOptions = trackEvent.popcornTrackEvent,
      _container = _popcornOptions._container,
      _media = document.getElementById( trackEvent.track._media.target ),
      _title = document.createElement( "span" );

  if ( window.jQuery ) {
    //Change default text to indicate draggable
    if ( _popcornOptions.src && !/^data:image/.test( _popcornOptions.src ) ){
      _title.classList.add( "title" );
      _title.innerHTML = "Drag an image from your desktop";
      _container.insertBefore( _title, _container.firstChild );
    }

    if ( _popcornOptions.src ) {
      window.EditorHelper.droppable( trackEvent, _container );
    }

    window.EditorHelper.resizable( trackEvent, _container, _media, {
      minWidth: 25,
      minHeight: 25
    });
    window.EditorHelper.draggable( trackEvent, _container, _media );
  }
});
