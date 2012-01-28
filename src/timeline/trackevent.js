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

define( [], function() {

  function TrackEvent( media, bEvent, tlEvent, trackliner ){
    var _trackliner = trackliner,
        _media = media,
        _bEvent = bEvent,
        _tlEvent = tlEvent,
        _zoom = 100,
        _this = this;

    function onDurationChanged( e ){
    } //onDurationChanged
    onDurationChanged();
    _media.listen( "mediadurationchanged", onDurationChanged );

    _bEvent.listen( "trackeventupdated", function( e ){
      _tlEvent.update( _bEvent.popcornOptions );
    });

    _tlEvent.listen( "trackeventupdated", function( e ){
      var ui = e.data;
      if ( ui ) {
        _bEvent.update({
          start: _tlEvent.start,
          end: _tlEvent.end
        });
      } //if
    });

    _tlEvent.listen( "trackeventclicked", function( e ){
      //butter.targettedEvent = _bEvent;
    });

    _tlEvent.listen( "trackeventdoubleclicked", function( e ){
/*
      if( butter.eventeditor ){
        butter.eventeditor.editTrackEvent( butterTrackEvent );
      }
*/
    });

    Object.defineProperties( this, {
      duration: {
        get: function(){ return _media.duration; },
        set: function( val ){
          _media.duration = val;
        }
      }
    });

  } //TrackEvent

  return TrackEvent;

});
