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

  function TrackEvent( media, bEvent, tlEvent, trackliner, options ){
    var _trackliner = trackliner,
        _media = media,
        _bEvent = bEvent,
        _tlEvent = tlEvent,
        _onMouseDown = options.mousedown, 
        _this = this;

    function onDurationChanged( e ){
    } //onDurationChanged
    onDurationChanged();
    _media.listen( "mediadurationchanged", onDurationChanged );

    _tlEvent.element.setAttribute( "butter-trackevent-type", bEvent.type );
    _tlEvent.element.setAttribute( "butter-trackevent-id", bEvent.id );

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

    _bEvent.listen( "trackeventselected", function( e ){
      _tlEvent.selected = true;
    });

    _bEvent.listen( "trackeventdeselected", function( e ){
      _tlEvent.selected = false;
    });

    _tlEvent.listen( "trackeventmousedown", function( e ){
      _onMouseDown({ trackEvent: _bEvent, originalEvent: e.data });
    });

    _tlEvent.listen( "trackeventdoubleclicked", function( e ){
      _bEvent.dispatch( "trackeventeditrequested", e );
    });

    this.destroy = function() {
    }; //destroy

    Object.defineProperties( this, {
      view: {
        enumerable: true,
        configurable: false,
        get: function(){ return _tlEvent; }
      },
      trackEvent: {
        enumerable: true,
        configurable: false,
        get: function(){ return _bEvent; }
      }
    });

    if( _bEvent.selected ){
      _tlEvent.selected = true;
    } //if

  } //TrackEvent

  return TrackEvent;

});
