/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/logger", "core/eventmanager" ], function( Logger, EventManager ){

  return function( media ){

    var _media = media,
        _zoom = 1,
        _this = this;

    var _element = document.createElement( "div" ),
        _container = document.createElement( "div" );

    _element.appendChild( _container );

    _element.className = "tracks-container-wrapper";
    _container.className = "tracks-container";

    _container.addEventListener( "mousedown", function( e ){
      _this.deselectOthers();
    }, false );

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
      } //for
    });

    function onTrackAdded( e ){
      var trackView = e.data.view;
      _container.appendChild( trackView.element );
      trackView.duration = _media.duration;
      trackView.zoom = _zoom;
      trackView.parent = _this;
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
    });

    _this.update = function(){
      resetContainer();
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
      width: {
        enumerable: true,
        get: function(){
          return _element.getBoundingClientRect().width;
        }
      },
      height: {
        enumerable: true,
        get: function(){
          return _element.getBoundingClientRect().height;
        }
      },
      scrollWidth: {
        enumerable: true,
        get: function(){
          return _element.scrollWidth;
        }
      },
      scrollHeight: {
        enumerable: true,
        get: function(){
          return _element.scrollHeight;
        }
      },
      vScroll: {
        enumerable: true,
        get: function(){
          return _element.scrollTop / _element.scrollHeight;
        },
        set: function( val ){
          _element.scrollTop = _element.scrollHeight * val;
        }
      },
      hScroll: {
        enumerable: true,
        get: function(){
          return _element.scrollLeft / _element.scrollWidth;
        },
        set: function( val ){
          _element.scrollLeft = _element.scrollWidth * val;
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

