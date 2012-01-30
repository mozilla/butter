/**********************************************************************************

Copyright (C) 2012 by Mozilla Foundation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

**********************************************************************************/

define( [ "core/trackevent", "core/eventmanager", "./trackevent" ], function( TrackEvent, EventManager, TrackEventView ) {

  function Track( media, bTrack, trackliner, tlTrack ){
    var _media = media,
        _trackliner = trackliner,
        _bTrack = bTrack,
        _tlTrack = tlTrack,
        _em = new EventManager( this ),
        _events = {},
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

    function addTrackEvent( bEvent ){
      var tlEvent = _tlTrack.createTrackEvent({
        start: bEvent.popcornOptions.start,
        end: bEvent.popcornOptions.end,
        text: bEvent.type
      });
      _events[ bEvent.id ] = new TrackEventView( _media, bEvent, tlEvent, _trackliner );
    } //addTrackEvent

    this.destroy = function(){
      _trackliner.removeTrack( _tlTrack );
    }; //destroy

    _bTrack.listen( "trackeventadded", function( e ){
      var bEvent = e.data,
          tlEvent = _events[ bEvent.id ];
      if( !tlEvent ){
        addTrackEvent( bEvent );
      }
      //butter.targettedEvent = _bTrackEvent;
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
          id = element.getAttribute( "butter-trackevent-id" )
          trackRect = _tlTrack.element.getBoundingClientRect();
      _em.dispatch( "trackeventrequested", {
        event: id,
        start: left / trackRect.width * _media.duration
      });
/*
      var _tlTrack = e.data.track,
          _bTrack = __bTracks[ _tlTrack.id ],
          _tlTrackEvent = e.data.trackEvent,
          _bTrackEvent = __bTrackEvents[ _tlTrackEvent.element.id ],
          name = e.data.name;
      if( !_bTrackEvent ){
        var start = _tlTrackEvent.options.left / _container.offsetWidth * _media.duration,
            end = start + ( _tlTrackEvent.options.width / _container.offsetWidth * _media.duration ),
            type = e.data.trackEvent.element.children[ 0 ].title || e.data.trackEvent.options.innerHTML;
        _bTrackEvent = new TrackEvent({
          popcornOptions: {
            start: start,
            end: end },
          type: type
        });
        // make a function for this
        _tlTrackEvents[ _bTrackEvent.id ] = _tlTrackEvent;
        _bTrackEvents[ _tlTrackEvent.element.id ] = _bTrackEvent;
        _bTrack.addTrackEvent( _bTrackEvent );
      }
*/
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
