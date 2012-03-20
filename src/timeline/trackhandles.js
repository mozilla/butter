/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [
          "dialog/iframe-dialog"
        ], 
        function( IFrameDialog ){

  return function( media, tracksContainer, orderChangedCallback ){

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
        var draggingIndex = ui.placeholder.index(),
            orderedTracks = [];

        for( var i=0, l=_list.childNodes.length; i<l; ++i ){

          var childNode = _list.childNodes[ i ];

          if( childNode !== ui.item[ 0 ] ){

            if( childNode === ui.placeholder[ 0 ] ){
              orderedTracks.push( _tracks[ ui.item[ 0 ].getAttribute( "data-butter-track-id" ) ].track );
            }
            else{
              orderedTracks.push( _tracks[ childNode.getAttribute( "data-butter-track-id" ) ].track );
            } //if

          } //if

        } //for

        orderChangedCallback( orderedTracks );
      }, //change
      stop: function(){
        for( var i=0, l=_menus.length; i<l; ++i ){
          _menus[ i ].style.display = "block";
        } //for
      }
    });

    _media.listen( "trackadded", function( e ){
      var track = e.data,
          trackId = track.id,
          trackName = track.name,
          trackDiv = document.createElement( "div" ),
          menuDiv = document.createElement( "div" ),
          deleteButton = document.createElement( "div" ),
          editButton = document.createElement( "div" );

      menuDiv.className = "menu";
      deleteButton.className = "delete";
      menuDiv.appendChild( deleteButton );

      deleteButton.addEventListener( "click", function( e ){
        var dialog = new IFrameDialog({
          type: "iframe",
          modal: true,
          url: "../dialogs/delete-track.html",
          events: {
            open: function( e ){
              dialog.send( "trackdata", trackName );
            },
            submit: function( e ){
              if( e.data === true ){
                media.removeTrack( track );
              } //if
              dialog.close();
            },
            cancel: function( e ){
              dialog.close();
            }
          }
        });
        dialog.open();
      }, false );

      trackDiv.addEventListener( "dblclick", function( e ){
         var dialog = new IFrameDialog({
          type: "iframe",
          modal: true,
          url: "../dialogs/track-data.html",
          events: {
            open: function( e ){
              dialog.send( "trackdata", track.json );
            }
          }
        });
        dialog.open();
      }, false );

      _menus.push( menuDiv );

      trackDiv.className = "track-handle";
      trackDiv.id = "track-handle-" + trackId;
      trackDiv.setAttribute( "data-butter-track-id", trackId );
      trackDiv.appendChild( document.createTextNode( trackName ) );
      trackDiv.appendChild( menuDiv );

      _list.appendChild( trackDiv );

      _tracks[ trackId ] = {
        id: trackId,
        track: track,
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

    tracksContainer.element.addEventListener( "scroll", function( e ){
      _container.scrollTop = tracksContainer.element.scrollTop;
    }, false );

    this.update = function(){
      _container.scrollTop = tracksContainer.element.scrollTop;
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
