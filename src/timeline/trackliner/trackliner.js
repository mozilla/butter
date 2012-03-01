/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/logger", "core/eventmanager", "./track-view" ], function( Logger, EventManager, TrackView ){

  var TrackLiner = function( tlOptions ) {

    tlOptions = tlOptions || {};

    var _tracks = {},
        _trackCount = 0,
        _eventCount = 0,
        _userElement,
        _dynamicTrackCreation = tlOptions.dynamicTrackCreation,
        _parent = document.createElement( "div" ),
        _container = document.createElement( "div" ),
        _eventManager = new EventManager( this ),
        _zoom = 1,
        _duration = 0,
        _this = this;

    if( typeof( tlOptions ) === "string" ){
      _userElement = document.getElementById( tlOptions );
    }
    else {
      _userElement = document.getElementById( tlOptions.element ) || tlOptions.element;
    } //if

    _userElement.appendChild( _parent );
    _parent.appendChild( _container );

    _parent.className = "trackliner-root";
    _container.className = "trackliner-container";

    $( _container ).droppable({
      greedy: true
    });

    var trackEventDropped = function ( track, e, ui ) {
      var eventId = ui.draggable[ 0 ].id,
          trackId = track.id,
          parentId = ui.draggable[ 0 ].parentNode.id;

      if ( _this.getTrack( parentId ) ) {
        track.addTrackEvent( _this.getTrack( parentId ).removeTrackEvent( eventId ) );
      } else {
        var clientRects = _parent.getClientRects();
        track.addTrackEvent( track.createTrackEvent({
            left: ( e.clientX - clientRects[ 0 ].left ),
            width: 50,
            text: ui.draggable[ 0 ].innerHTML
          }, true ));
      } //if
    }; //trackEventDropped

    $( _parent ).droppable({
      // this is dropping an event on empty space
      drop: function( event, ui ) {
        _eventManager.dispatch( "trackrequested", { event: event, ui: ui } );
      } 
    }); //droppable

    this.clear = function () {
      while ( _container.children.length ) {
        _container.removeChild( _container.children[ 0 ] );
      } //while
      _tracks = [];
      _trackCount = 0;
      _eventCount = 0;
    }; //clear

    this.createTrack = function( name ) {
      var track = new TrackView(),
          element = track.element;
      if ( name ) {
        var titleElement = document.createElement( "span" );
        titleElement.innerHTML = name;
        element.appendChild( titleElement );
      } //if
      return _tracks[ element.id ] = track;
    }; //createTrack

    Object.defineProperties( this, {
      tracks: {
        get: function(){
          return _tracks;
        }
      }
    });

    this.getTrack = function( id ){
      return _tracks[ id ];
    }; //getTrack

    this.setTrackOrder = function( track, order ){
      if( _container.childNodes[ order ]  !== track.element ){
        var other = _container.childNodes[ order ];
        _container.insertBefore( track.element, other );
      } //if
    }; //setTrackOrder

    this.addTrack = function( track ){
      _container.appendChild( track.element );
      _tracks[ track.element.id ] = track;
      track.zoom = _zoom;
      track.duration = _duration;
    }; //addTrack

    this.removeTrack = function( track ) {
      _container.removeChild( track.element );
      delete _tracks[ track.element.id ];
      _eventManager.dispatch( "trackremoved", {
        track: track
      });
      return track;
    }; //removeTrack

    this.deselectOthers = function() {
      for ( var j in _tracks ) {
        var events = _tracks[ j ].trackEvents;
        for ( var i in events ) {
          if ( events[ i ].selected ) {
            events[ i ].selected = false;
          } //if
        } //for
      } //for
      return _this;
    }; //deselectOthers

    function resetContainer() {
      _container.style.width = _duration * _zoom + "px";
      _parent.style.width = _duration * _zoom + "px";
    } //resetContainer

    Object.defineProperties( this, {
      zoom: {
        enumerable: true,
        get: function(){ return _zoom; },
        set: function( val ){
          _zoom = val;
          for( var t in _tracks ){
            if( _tracks.hasOwnProperty( t ) ){
              _tracks[ t ].zoom = _zoom;
            } //if
          } //for
          resetContainer();
        }
      },
      duration: {
        enumerable: true,
        get: function(){ return _duration; },
        set: function( val ){
          _duration = val;
          for( var t in _tracks ){
            if( _tracks.hasOwnProperty( t ) ){
              _tracks[ t ].duration = _duration;
            } //if
          } //for
          resetContainer();
        }
      },
      element: {
        enumerable: true,
        get: function(){
          return _parent;
        }
      },
      vScroll: {
        enumerable: true,
        get: function(){ return _parent.scrollTop / _parent.scrollHeight; },
        set: function( val ){
          _parent.scrollTop = _parent.scrollHeight * val;
        }
      },
      hScroll: {
        enumerable: true,
        get: function(){
          return _parent.scrollLeft / _parent.scrollWidth;
        },
        set: function( val ){
          _parent.scrollLeft = _parent.scrollWidth * val;
        }
      },
      element: {
        enumerable: true,
        get: function(){
          return _parent;
        },
      }
    });

  }; //TrackLiner

  return TrackLiner;

});

