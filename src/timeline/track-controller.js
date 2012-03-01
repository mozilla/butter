/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/trackevent", "core/eventmanager", "./trackevent-controller" ], function( TrackEvent, EventManager, TrackEventController ) {

  function Track( media, bTrack, trackliner, tlTrack, options ){
    var _media = media,
        _trackliner = trackliner,
        _bTrack = bTrack,
        _tlTrack = tlTrack,
        _em = new EventManager( this ),
        _events = {},
        _onMouseDown = options.mousedown,
        _onMouseOver = options.mouseover,
        _onMouseOut = options.mouseout,
        _this = this;

    if( !_tlTrack ){
      _tlTrack = _trackliner.createTrack();
      _trackliner.addTrack( _tlTrack );
    } //if

    function onDurationChanged( e ){
    } //onDurationChanged
    onDurationChanged();
    _media.listen( "mediadurationchanged", onDurationChanged );

    function removeTrackEvent( bEvent ){
      _events[ bEvent.id ].destroy();
      _tlTrack.removeTrackEvent( _events[ bEvent.id ].view.id );
      delete _events[ bEvent.id ];
    } //removeTrackEvent

    this.deselectEvents = function( except ){
      for( var e in _events ){
        if( _events.hasOwnProperty( e ) ){
          if( _events[ e ].trackEvent !== except ){
            _events[ e ].trackEvent.selected = false;
          } //if
        } //if
      } //for
    }; //deselectEvents

    function addTrackEvent( bEvent ){
      var tlEvent = _tlTrack.createTrackEvent({
        start: bEvent.popcornOptions.start,
        end: bEvent.popcornOptions.end,
        text: bEvent.type
      });
      _events[ bEvent.id ] = new TrackEventController( _media, bEvent, tlEvent, _trackliner, {
        mousedown: _onMouseDown,
        mouseover: _onMouseOver,
        mouseout: _onMouseOut
      });
    } //addTrackEvent

    this.destroy = function(){
      _trackliner.removeTrack( _tlTrack );
    }; //destroy

    _bTrack.listen( "trackorderchanged", function( e ){
      _trackliner.setTrackOrder( _tlTrack, e.data );
    });

    this.getTrackEventById = function( id ){
      for( var e in _events ){
        if( _events.hasOwnProperty( e ) && _events[ e ].trackEvent.id === id ){
          return _events[ e ];
        } //if
      } //for
    }; //getTrackEventById

    _bTrack.listen( "trackeventadded", function( e ){
      var bEvent = e.data,
          tlEvent = _events[ bEvent.id ];
      if( !tlEvent ){
        addTrackEvent( bEvent );
      }
    });

    _bTrack.listen( "trackeventremoved", function( e ){
      if( _events[ e.data.id ] ){
        removeTrackEvent( e.data );
      } //if
    });

    _trackliner.listen( "trackupdated", function( event ){
      var track = event.data.track,
          index = event.data.index;
      _bTrack.newPos = index;
      _bTrack.dispatch( "trackmoved", _bTrack );
    });

    _tlTrack.listen( "trackeventrequested", function( e ){
      var element = e.data.ui.draggable[ 0 ],
          left = element.offsetLeft,
          start,
          id = element.getAttribute( "butter-trackevent-id" ),
          trackRect = _tlTrack.element.getBoundingClientRect(),
          left = id ? left : ( e.data.event.clientX - trackRect.left );

      start = left / trackRect.width * _media.duration;

      var type = element.id.split( "-" );
      if( type.length === 3 ){
        type = type[ 2 ];
      } //if

      _em.dispatch( "trackeventrequested", {
        event: id,
        start: start,
        track: _bTrack,
        type: type
      });

    });

    _tlTrack.listen( "trackeventadded", function( e ){
    });

    _tlTrack.listen( "trackeventremoved", function( e ){
    });

    _trackliner.listen( "trackremoved", function( e ){
    });

    var trackEvents = _bTrack.trackEvents;
    for( var i=0; i<trackEvents.length; ++i ){
      var bEvent = trackEvents[ i ];
      addTrackEvent( bEvent, bEvent.popcornOptions );
    } //for

    Object.defineProperties( this, {
      track: {
        enumerable: true,
        configurable: false,
        get: function() {
          return _bTrack;
        }
      },
      view: {
        enumerable: true,
        configurable: false,
        get: function() {
          return _tlTrack;
        }
      }
    });

  } //Track

  return Track;

});
