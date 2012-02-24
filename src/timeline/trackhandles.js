define( [], function(){

  return function( media, friendContainer ){

    var _media = media,
        _container = document.createElement( "div" ),
        _list = document.createElement( "div" ),
        _tracks = {},
        _this = this;

    _container.className = "track-handle-container";
    _list.className = "handle-list";

    _container.appendChild( _list );

    $( _list ).sortable({
      axis: "y",
      placeholder: "placeholder",
      start: function( e, ui ){
        // put this first to make ordering sane
        _list.insertBefore( ui.item[ 0 ], _list.firstChild );
      },
      change: function( e, ui ){

        var draggingIndex = ui.placeholder.index();

        for( var id in _tracks ){
          var track = _tracks[ id ],
              element = track.element,
              elementIndex = $( element ).index();

          if( element === ui.item[ 0 ] ){
            track.track.order = draggingIndex - 1;
          }
          else {
            track.track.order = elementIndex - 1;
          } //if
        } //for

      } //change
    });

    _media.listen( "trackadded", function( e ){
      var trackId = e.data.id,
          trackDiv = document.createElement( "div" );
      trackDiv.className = "track-handle";
      trackDiv.id = "track-handle-" + trackId;
      trackDiv.appendChild( document.createTextNode( e.data.name ) );
      _list.appendChild( trackDiv );
      _tracks[ trackId ] = {
        id: trackId,
        track: e.data,
        element: trackDiv
      };
    });

    _media.listen( "trackremoved", function( e ){
      var trackId = e.data.id;
      _list.removeChild( _tracks[ trackId ].element );
      delete _tracks[ trackId ];
    });

    friendContainer.addEventListener( "scroll", function( e ){
      _container.scrollTop = friendContainer.scrollTop;
    }, false );

    this.update = function(){
      _container.scrollTop = friendContainer.scrollTop;
    }; //update

    _this.update();

    Object.defineProperties( this, {
      element: {
        enumerable: true,
        get: function(){
          return _container;
        }
      }
    });

  }; //TrackHandles

});
