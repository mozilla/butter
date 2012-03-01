/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [], function() {

  function TrackEvent( media, bEvent, tlEvent, trackliner, options ){
    var _trackliner = trackliner,
        _media = media,
        _bEvent = bEvent,
        _tlEvent = tlEvent,
        _onMouseDown = options.mousedown || function(){}, 
        _onMouseOver = options.mouseover || function(){}, 
        _onMouseOut = options.mouseout || function(){}, 
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

    _tlEvent.listen( "trackeventmouseover", function( e ){
      _onMouseOver({ trackEvent: _bEvent, originalEvent: e.data });
    });

    _tlEvent.listen( "trackeventmouseout", function( e ){
      _onMouseOut({ trackEvent: _bEvent, originalEvent: e.data });
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
