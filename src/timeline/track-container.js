/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define(
[
  "core/logger",
  "util/dragndrop"
],
function(
  Logger,
  DragNDrop
) {

  return function( butter, media ){

    var _media = media,
        _zoom = 1,
        _this = this;

    var _element = document.createElement( "div" ),
        _container = document.createElement( "div" );

    var _hScrollbar,
        _vScrollbar;

    var _droppable;

    _element.appendChild( _container );

    _element.className = "tracks-container-wrapper";
    _container.className = "tracks-container";

    _container.addEventListener( "mousedown", function( e ){
      _this.deselectOthers();
    }, false );

    _droppable = DragNDrop.droppable( _element, {
      drop: function( dropped, mousePosition ) {
        if ( dropped.getAttribute( "data-butter-draggable-type" ) === "plugin" ) {
          var newTrack = butter.currentMedia.addTrack(),
              trackRect = newTrack.view.element.getBoundingClientRect(),
              left = mousePosition[ 0 ] - trackRect.left,
              start = left / trackRect.width * newTrack.view.duration;

          newTrack.view.dispatch( "plugindropped", {
            start: start,
            track: newTrack,
            type: dropped.getAttribute( "data-butter-plugin-type" )
          });
        }
      }
    });

    this.setScrollbars = function( hScrollbar, vScrollbar ){
      _hScrollbar = hScrollbar;
      _vScrollbar = vScrollbar;
      _vScrollbar.update();
    };

    this.orderTracks = function( orderedTracks ){
      for( var i=0, l=orderedTracks.length; i<l; ++i ){
        var trackElement = orderedTracks[ i ].view.element;
        if( trackElement !== _container.childNodes[ i ] ){
          orderedTracks[ i ].order = i;
          _container.insertBefore( trackElement, _container.childNodes[ i + 1 ] );
        } //if
      } //for
    }; //orderTracks

    this.deselectOthers = function() {
      for( var i = 0; i < butter.selectedEvents.length; i++ ) {
        butter.selectedEvents[ i ].selected = false;
      } // for
      butter.selectedEvents = [];
      return _this;
    }; //deselectOthers

    function resetContainer() {
      _container.style.width = _media.duration * _zoom + "px";
    } //resetContainer

    _media.listen( "mediaready", function(){
      resetContainer();
      var tracks = _media.tracks;
      for( var i=0, il=tracks.length; i<il; ++i ){
        var trackView = tracks[ i ].view;
        _container.appendChild( trackView.element );
        trackView.duration = _media.duration;
        trackView.zoom = _zoom;
        trackView.parent = _this;
      } //for
    });

    butter.listen( "mediaremoved", function ( e ) {
      if ( e.data === _media && _droppable ){
        _droppable.destroy();
      }
    });

    function onTrackAdded( e ){
      var trackView = e.data.view;
      _container.appendChild( trackView.element );
      trackView.duration = _media.duration;
      trackView.zoom = _zoom;
      trackView.parent = _this;
      if ( _vScrollbar ) {
        _vScrollbar.update();
      }
    }

    var existingTracks = _media.tracks;
    for( var i=0; i<existingTracks.length; ++i ){
      onTrackAdded({
        data: existingTracks[ i ]
      });
    }

    _media.listen( "trackadded", onTrackAdded );

    _media.listen( "trackremoved", function( e ){
      var trackView = e.data.view;
      _container.removeChild( trackView.element );
      if( _vScrollbar ){
        _vScrollbar.update();
      }
    });

    _this.update = function(){
      resetContainer();
    };

    _this.snapTo = function( time ){
      var p = time / _media.duration,
          newScroll = _container.clientWidth * p,
          maxLeft = _container.clientWidth - _element.clientWidth;
      if ( newScroll < _element.scrollLeft || newScroll > _element.scrollLeft + _element.clientWidth ) {
        if ( newScroll > maxLeft ) {
          _element.scrollLeft = maxLeft;
          return;
        }
        _element.scrollLeft = newScroll;
      }
    };

    Object.defineProperties( this, {
      zoom: {
        enumerable: true,
        get: function(){ return _zoom; },
        set: function( val ){
          _zoom = val;
          resetContainer();
          var tracks = _media.tracks;
          for( var i=0, il=tracks.length; i<il; ++i ){
            tracks[ i ].view.zoom = _zoom;
          } //for
        }
      },
      element: {
        enumerable: true,
        get: function(){
          return _element;
        }
      },
      container: {
        enumerable: true,
        get: function(){
          return _container;
        }
      }
    });

  };

});

