/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [
          "dialog/iframe-dialog",
          "util/dragndrop"
        ], 
        function( IFrameDialog, DragNDrop ){

  var ADD_TRACK_BUTTON_Y_ADJUSTMENT = 35;

  return function( butter, media, tracksContainer, orderChangedCallback ){

    var _media = media,
        _container = document.createElement( "div" ),
        _listElement = document.createElement( "div" ),
        _addTrackButton = document.createElement( "button" ),
        _tracks = {},
        _menus = [],
        _this = this;

    _container.className = "track-handle-container";
    _listElement.className = "handle-list";

    _container.appendChild( _listElement );

    _addTrackButton.id = "add-track";
    _addTrackButton.innerHTML = "+Track";

    _container.appendChild( _addTrackButton );

    _addTrackButton.addEventListener( "click", function( e ){
      butter.currentMedia.addTrack();
    }, false );

    var _sortable = DragNDrop.sortable( _listElement, {
      change: function( elements ){
        var orderedTracks = [];
        for( var i=0, l=elements.length; i<l; ++i ){
          var id = elements[ i ].getAttribute( "data-butter-track-id" );
          orderedTracks.push( _tracks[ id ].track );
        }
        orderChangedCallback( orderedTracks );
      }
    });

    var existingTracks = _media.tracks;
    for( var i=0; i<existingTracks.length; ++i ){
      onTrackAdded({
        data: existingTracks[ i ]
      });
    }

    function onTrackAdded( e ){
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

      _sortable.addItem( trackDiv );

      _listElement.appendChild( trackDiv );

      _tracks[ trackId ] = {
        id: trackId,
        track: track,
        element: trackDiv,
        menu: menuDiv
      };

      _addTrackButton.style.top = _listElement.offsetHeight - ADD_TRACK_BUTTON_Y_ADJUSTMENT + "px";
    }

    _media.listen( "trackadded", onTrackAdded );

    _media.listen( "trackremoved", function( e ){
      var trackId = e.data.id;
      _listElement.removeChild( _tracks[ trackId ].element );
      _sortable.removeItem( _tracks[ trackId ].element );
      _menus.splice( _menus.indexOf( _tracks[ trackId ].menu ), 1 );
      delete _tracks[ trackId ];
      _addTrackButton.style.top = _listElement.offsetHeight - ADD_TRACK_BUTTON_Y_ADJUSTMENT + "px";
    });

    tracksContainer.element.addEventListener( "scroll", function( e ){
      _container.scrollTop = tracksContainer.element.scrollTop;
    }, false );

    this.update = function(){
      _container.scrollTop = tracksContainer.element.scrollTop;
      _addTrackButton.style.top = _listElement.offsetHeight - ADD_TRACK_BUTTON_Y_ADJUSTMENT + "px";
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
