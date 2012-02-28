define( [], function(){

  return function( media, friendContainer ){

    var _media = media,
        _container = document.createElement( "div" ),
        _list = document.createElement( "div" ),
        _tracks = {},
        _menus = [],
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
        for( var i=0, l=_menus.length; i<l; ++i ){
          _menus[ i ].style.display = "none";
        } //for
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

      }, //change
      stop: function(){
        for( var i=0, l=_menus.length; i<l; ++i ){
          _menus[ i ].style.display = "block";
        } //for
      }
    });

    _media.listen( "trackadded", function( e ){
      var trackId = e.data.id,
          trackDiv = document.createElement( "div" ),
          menuDiv = document.createElement( "div" ),
          deleteButton = document.createElement( "div" ),
          editButton = document.createElement( "div" );

      menuDiv.className = "menu";
      deleteButton.className = "delete";
      //editButton.className = "edit";

      //menuDiv.appendChild( editButton );
      menuDiv.appendChild( deleteButton );

      _menus.push( menuDiv );

      trackDiv.className = "track-handle";
      trackDiv.id = "track-handle-" + trackId;
      trackDiv.appendChild( document.createTextNode( e.data.name ) );
      trackDiv.appendChild( menuDiv );

      _list.appendChild( trackDiv );

      _tracks[ trackId ] = {
        id: trackId,
        track: e.data,
        element: trackDiv,
        menu: menuDiv
      };
    });

    _media.listen( "trackremoved", function( e ){
      var trackId = e.data.id;
      _list.removeChild( _tracks[ trackId ].element );
      _menus.splice( _menus.indexOf( _tracks[ trackId ].menu ), 1 );
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
