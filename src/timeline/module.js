/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [
          "core/logger", 
          "./media"
        ], 
        function( 
          Logger, 
          Media
        ){

  var __unwantedKeyPressElements = [
    "TEXTAREA",
    "INPUT",
    "VIDEO",
    "AUDIO"
  ];

  var Timeline = function( butter, options ){

    var _media = {},
        _currentMedia,
        _parentElement = document.createElement( "div" );

    _parentElement.id = "butter-timeline";

    this._start = function( onModuleReady ){
      butter.ui.addToArea( "main", "timeline", _parentElement );
      butter.ui.pushContentState( "timeline" );
      butter.ui.listen( "contentstatechanged", function( e ){
        if( e.data !== "timeline" ){
          _parentElement.setAttribute( "data-butter-disabled", true );
        }
        else{
          _parentElement.removeAttribute( "data-butter-disabled" );
        }
      });
      onModuleReady();
    };

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
      var curleft = 0,
          curtop = 0;

      if( obj.offsetParent ) {
        do {
          curleft += obj.offsetLeft;
          curtop += obj.offsetTop;
        } while ( ( obj = obj.offsetParent ) );
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
          media = new Media( butter, mediaObject );

      _media[ mediaObject.id ] = media;
      _parentElement.appendChild( media.element );

      function mediaReady( e ){
        butter.dispatch( "timelineready" );
      } //mediaReady

      function mediaChanged( event ){
        if ( _currentMedia !== _media[ event.data.id ] ){
          if ( _currentMedia ) {
            _currentMedia.hide();
          }
          _currentMedia = _media[ event.data.id ];
          if ( _currentMedia ) {
            _currentMedia.show();
          }
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

    window.addEventListener( "keypress", function( e ){
      if( e.which === 32 && __unwantedKeyPressElements.indexOf( e.target.nodeName ) === -1 ){
        if( butter.currentMedia.ended ){
          console.log( "ended" );
          butter.currentMedia.paused = false;
        }
        else{
          butter.currentMedia.paused = !butter.currentMedia.paused;
        }
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

  Timeline.__moduleName = "timeline";

  return Timeline;
}); //define

