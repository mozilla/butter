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

define( [ "core/trackevent", "./trackevent" ], function( TrackEvent, TrackEventMap ) {

  function Track( media, bTrack, trackliner, tlTrack ){
    var _media = media,
        _trackliner = trackliner,
        _bTrack = bTrack,
        _tlTrack = tlTrack,
        _events = {},
        _this = this;

    if( !_tlTrack ){
      _tlTrack = _trackliner.createTrack();
      _trackliner.addTrack( _tlTrack );
    } //if

    function onDurationChanged( e ){
      _tlTrack.length = _media.duration;
    } //onDurationChanged
    onDurationChanged();
    _media.listen( "mediadurationchanged", onDurationChanged );

    function removeTrackEvent( bEvent ){
      _events[ bEvent.id ].destroy();
      delete _events[ bEvent.id ];
    } //removeTrackEvent

    function addTrackEvent( bEvent ){
      var tlEvent = _tlTrack.createTrackEvent({
        start: bEvent.popcornOptions.start,
        end: bEvent.popcornOptions.end,
        text: bEvent.type
      });
      tlEvent.zoom = _tlTrack.zoom;
      _events[ bEvent.id ] = new TrackEventMap( _media, bEvent, tlEvent, _trackliner );
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
      if( _events[ e.data ] ){
        removeTrackEvent( e.data );
      }
    });

    _trackliner.listen( "trackupdated", function( event ){
      var track = event.data.track,
          index = event.data.index;
      _bTrack.newPos = index;
      _bTrack.dispatch( "trackmoved", _bTrack );
    });

    _tlTrack.listen( "trackeventrequested", function( e ){
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
        __tlTrackEvents[ _bTrackEvent.id ] = _tlTrackEvent;
        __bTrackEvents[ _tlTrackEvent.element.id ] = _bTrackEvent;
        _bTrack.addTrackEvent( _bTrackEvent );
      }
    });

    _tlTrack.listen( "trackeventadded", function( e ){
    });

    _tlTrack.listen( "trackeventremoved", function( e ){
    });

    var trackEvents = _bTrack.trackEvents;
    for( var i=0; i<trackEvents.length; ++i ){
      var bEvent = trackEvents[ i ];
      addTrackEvent( bEvent, bEvent.popcornOptions );
    } //for

    Object.defineProperty( this, "zoom", {
      get: function(){
        return _tlTrack.zoom;
      },
      set: function( val ){
        _tlTrack.zoom = val;
      }
    });

  } //Track

  return Track;

});
