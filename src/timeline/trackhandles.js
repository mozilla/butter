/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [
          "dialog/iframe-dialog",
          "util/dragndrop"
        ], 
        function( IFrameDialog, DragNDrop ){

  return function( media, tracksContainer, orderChangedCallback ){

    var _media = media,
        _container = document.createElement( "div" ),
        _droppableContainer = document.createElement( "div" ),
        _listElement = document.createElement( "div" ),
        _tracks = {},
        _menus = [],
        _this = this;

    _container.className = "track-handle-container";
    _listElement.className = "handle-list";

    _container.appendChild( _listElement );

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
            },
            trackupdated: function( e ) {
              dialog.send( "trackupdated", { success: false });
            }
          }
        });
        dialog.trackupdated = function( e ) {
          console.log( "called", e );
        };
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
              var comm = dialog.comm;
              // listen for trackupdated from the dialog
              comm.listen( "trackupdated", function( e ) {
                // wrap in a try catch so we know right away about any malformed JSON
                try {
                  var tracks = _media.tracks,
                      track,
                      i,
                      l,
                      trackEvents,
                      trackData = JSON.parse( e.data ),
                      trackDataEvents = trackData.trackEvents;

                  // find the correct track
                  for( i = 0, l = tracks.length; i < l; i++ ) {
                    if ( trackData.id === tracks[ i ].id ) {
                      track = tracks[ i ];
                    }
                  }

                  // update every trackevent with it's new data
                  for( i = 0, l = trackDataEvents.length; i < l; i++ ) {
                    var trackevent = trackDataEvents[ i ],
                        te = track.getTrackEventById( trackevent.id );
                    te.update( trackevent.popcornOptions );
                  }
                  // let the dialog know things went well
                  dialog.send( "trackupdated", true );
                } catch ( error ) {
                  // inform the dialog about the issue
                  dialog.send( "trackupdated", false );
                }
              });
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
    });

    _media.listen( "trackremoved", function( e ){
      var trackId = e.data.id;
      _listElement.removeChild( _tracks[ trackId ].element );
      _sortable.removeItem( _tracks[ trackId ].element );
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
