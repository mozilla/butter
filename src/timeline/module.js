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

define( [
          "core/logger", 
          "./media",
          "./timebar"
        ], 
        function( 
          Logger, 
          Media
        ){

  var unwantedKeyPressElements = [
    "TEXTAREA",
    "INPUT"
  ];

  var Timeline = function( butter, options ){

    var _media = {},
        _currentMedia;

    if( butter.ui ){
      butter.ui.listen( "uivisibilitychanged", function( e ){
        for( var m in _media ){
          if( _media.hasOwnProperty( m ) ){
            _media[ m ].shrunken = !e.data;
          } //if
        } //for
      });
    } //if

    this.findAbsolutePosition = function( obj ){
      var curleft = curtop = 0;
      if( obj.offsetParent ) {
        do {
          curleft += obj.offsetLeft;
          curtop += obj.offsetTop;
        } while ( obj = obj.offsetParent );
      }
      //returns an array
      return [ curleft, curtop ];
    }; //findAbsolutePosition

    this.moveFrameLeft = function( event ){
      if( butter.targettedEvent ) {
        event.preventDefault();
        var cornOptions = butter.targettedEvent.popcornOptions,
            inc = event.shiftKey ? 2.5 : 0.25;
        if( cornOptions.start > inc ) {
          cornOptions.start -= inc;
          if( !event.ctrlKey && !event.metaKey ) {
            cornOptions.end -= inc;
          }
        } else {
          if( !event.ctrlKey ) {
            cornOptions.end = cornOptions.end - cornOptions.start;
          }
          cornOptions.start = 0;
        }
        butter.targettedEvent.update( cornOptions );
      }
    }; //moveFrameLeft

    this.moveFrameRight = function( event ){
      if( butter.targettedEvent ) {
        event.preventDefault();
        var cornOptions = butter.targettedEvent.popcornOptions,
            inc = event.shiftKey ? 2.5 : 0.25;
        if( cornOptions.end < butter.duration - inc ) {
          cornOptions.end += inc;
          if( !event.ctrlKey && !event.metaKey ) {
            cornOptions.start += inc;
          }
        } else {
          if( !event.ctrlKey ) {
            cornOptions.start += butter.duration - cornOptions.end;
          }
          cornOptions.end = butter.duration;
        }
        butter.targettedEvent.update( cornOptions );
      }
    }; //moveFrameRight

    butter.listen( "mediaadded", function( event ){
      var mediaObject = event.data,
          media = new Media( mediaObject );

      _media[ mediaObject.id ] = media;
      butter.ui.element.appendChild( media.element );

      function mediaReady( e ){
        butter.dispatch( "timelineready" );
      } //mediaReady

      function mediaChanged( event ){
        if ( _currentMedia !== _media[ event.data.id ] ){
          _currentMedia && _currentMedia.hide();
          _currentMedia = _media[ event.data.id ];
          _currentMedia && _currentMedia.show();
          butter.dispatch( "timelineready" );
        }
      }
    
      function mediaRemoved( event ){
        var mediaObject = event.data;
        if( _media[ mediaObject.id ] ){
          _media[ mediaObject.id ].destroy();
        }
        delete _media[ mediaObject.id ];
        if( _currentMedia && ( mediaObject.id === _currentMedia.media.id ) ){
          _currentMedia = undefined;
        }
        butter.unlisten( "mediachanged", mediaChanged );
        butter.unlisten( "mediaremoved", mediaRemoved );
      } //mediaRemoved

      butter.listen( "mediachanged", mediaChanged );
      butter.listen( "mediaremoved", mediaRemoved );
    });

    this.currentTimeInPixels = function( pixel ){
      if( pixel != null ){
        butter.currentTime = pixel / _currentMedia.container.offsetWidth * _currentMedia.duration;
        butter.dispatch( "mediatimeupdate", _currentMedia.media, "timeline" );
      } //if
      return butter.currentTime / _currentMedia.duration * ( _currentMedia.container.offsetWidth );
    }; //currentTimeInPixels

    window.addEventListener( "keypress", function( e ){
      if( e.which === 32 && unwantedKeyPressElements.indexOf( e.target.nodeName ) === -1 ){
        butter.currentMedia.paused = !butter.currentMedia.paused;
      } //if
    }, false );

    Object.defineProperties( this, {
      zoom: {
        get: function(){
          return _currentMediaInstace.zoom;
        },
        set: function( val ){
          _currentMedia.zoom = val;
        }
      }
    });

  }; //Timeline

  return Timeline;
}); //define

