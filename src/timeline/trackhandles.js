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
    _addTrackButton.title = "Add a new Track for your events";

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

    function onTrackAdded( e ){
      var track = e.data,
          trackId = track.id,
          trackName = track.name,
          trackDiv = document.createElement( "div" ),
          menuDiv = document.createElement( "div" ),
          deleteButton = document.createElement( "div" );

      menuDiv.className = "menu";
      deleteButton.className = "delete";
      menuDiv.appendChild( deleteButton );

      deleteButton.addEventListener( "click", function( e ){
        var dialog = new IFrameDialog({
          type: "iframe",
          modal: true,
          url: butter.ui.dialogDir + "delete-track.html",
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
          url: butter.ui.dialogDir + "track-data.html",
          events: {
            open: function( e ) {
              dialog.send( "trackdata", track.json );
            },
            submit: function( e ) {
              // wrap in a try catch so we know right away about any malformed JSON
              try {
                var trackData = JSON.parse( e.data ),
                    trackEvents = track.trackEvents,
                    trackDataEvents = trackData.trackEvents,
                    dontRemove = {},
                    toAdd = [],
                    i,
                    l;

                trackDiv.childNodes[ 0 ].textContent = track.name = trackData.name;
                // update every trackevent with it's new data
                for ( i = 0, l = trackDataEvents.length; i < l; i++ ) {
                  var teData = trackDataEvents[ i ],
                      te = track.getTrackEventById( teData.id );

                  // check to see if the current track event exists already
                  if ( te ) {
                    te.update( teData.popcornOptions );
                    /* remove it from our reference to the array of track events so we know
                     * which ones to remove later
                     */
                    dontRemove[ teData.id ] = teData;
                  // if we couldn't find the track event, it must be a new one
                  } else {
                    toAdd.push( { type: teData.type, popcornOptions: teData.popcornOptions } );
                  }
                }

                // remove all trackEvents that wern't updated
                for ( i = trackEvents.length, l = 0; i >= l; i-- ) {
                  if ( trackEvents[ i ] && !dontRemove[ trackEvents[ i ].id ] ) {
                    track.removeTrackEvent( trackEvents[ i ] );
                  }
                }

                // add all the trackEvents that didn't exist so far
                for ( i = 0, l = toAdd.length; i < l; i++ ) {
                  track.addTrackEvent( toAdd[ i ] );
                }
                // let the dialog know things went well
                dialog.send( "trackupdated", true );
              } catch ( error ) {
                // inform the dialog about the issue
                console.log( error );
                dialog.send( "trackupdated", false );
              }
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

    var existingTracks = _media.tracks;
    for( var i=0; i<existingTracks.length; ++i ){
      onTrackAdded({
        data: existingTracks[ i ]
      });
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
