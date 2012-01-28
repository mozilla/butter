define( [ "core/logger", "core/eventmanager", "./trackliner-track" ], function( Logger, EventManager, Track ){

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

    $( _container ).sortable({
      containment: "parent",
      tolerance: "pointer",
      update: function( event, ui ) {
        _eventManager.dispatch( "trackupdated", {
          track: _this.getTrack( ui.item[ 0 ].id ),
          index: ui.item.index()
        });
      }
    }).droppable({
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
        if ( dynamicTrackCreation && ui.draggable[ 0 ].className.indexOf( "ui-draggable" ) > -1 ) {
          var newTrack = _this.createTrack();
          _this.addTrack( newTrack );
          trackEventDropped( newTrack, event, ui );
        } //if
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
      var track = new Track(),
          element = track.element;
      if ( name ) {
        var titleElement = document.createElement( "span" );
        titleElement.innerHTML = name;
        element.appendChild( titleElement );
      } //if
      return _tracks[ element.id ] = track;
    };

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

    this.addTrack = function( track ){
      _container.appendChild( track.element );
      _tracks[ track.element.id ] = track;

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

  }; //TrackLiner

  return TrackLiner;

});

