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
      for( var i = 0; i < butter.selectedEvents.length; i++ ) {
        if( butter.selectedEvents[ i ] ) {
          event.preventDefault();
          var cornOptions = butter.selectedEvents[ i ].popcornOptions,
              inc = event.shiftKey ? 2.5 : 0.25;
          if( !event.ctrlKey && !event.metaKey ) {
            if( cornOptions.start > inc ) {
              cornOptions.start -= inc;
              cornOptions.end -= inc;
            } else {
              cornOptions.end = cornOptions.end - cornOptions.start;
              cornOptions.start = 0;
            } // if
          } else if ( cornOptions.end - cornOptions.start > inc ) {
            cornOptions.end -= inc;
          } else {
            cornOptions.end = cornOptions.start + 0.25;
          } // if
          butter.selectedEvents[ i ].update( cornOptions );
        } // if
      } // for
    }; //moveFrameLeft

    this.moveFrameRight = function( event ){
      for( var i = 0; i < butter.selectedEvents.length; i++ ) {
        if( butter.selectedEvents[ i ] ) {
          event.preventDefault();
          var cornOptions = butter.selectedEvents[ i ].popcornOptions,
              inc = event.shiftKey ? 2.5 : 0.25;
          if( cornOptions.end < butter.duration - inc ) {
            cornOptions.end += inc;
            if( !event.ctrlKey && !event.metaKey ) {
              cornOptions.start += inc;
            }
          } else {
            if( !event.ctrlKey && !event.metaKey ) {
              cornOptions.start += butter.duration - cornOptions.end;
            }
            cornOptions.end = butter.duration;
          }
          butter.selectedEvents[ i ].update( cornOptions );
        } // if
      } // for
    }; //moveFrameRight

    butter.listen( "mediaadded", function( event ){
      var mediaObject = event.data,
          media = new Media( butter, mediaObject );

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

    var orderedTrackEvents = butter.orderedTrackEvent = [];

    butter.listen( "trackeventadded", function( e ) {
      var trackEvent = e.data,
          index = 0;
      if( orderedTrackEvents.indexOf( trackEvent ) === -1 ){
        while( orderedTrackEvents[ index ] && orderedTrackEvents[ index ].popcornOptions.start <= trackEvent.popcornOptions.start ){
          index++;
        } // while
        orderedTrackEvents.splice( index, 0, trackEvent );
      } // if
    }); // listen

    butter.listen( "trackeventremoved", function( e ) {
      var index = orderedTrackEvents.indexOf( e.data );
      if( index > -1 ){
        orderedTrackEvents.splice( index, 1 );
      } // if
    }); // listen

    butter.listen( "trackeventupdated", function( e ) {
      var trackEvent = e.target,
          index = orderedTrackEvents.indexOf( trackEvent );
      if( index > -1 ){
        orderedTrackEvents.splice( index, 1 );
      } // if
      index = 0;
      while( orderedTrackEvents[ index ] && orderedTrackEvents[ index ].popcornOptions.start <= trackEvent.popcornOptions.start ){
        index++;
      } // while
      orderedTrackEvents.splice( index, 0, trackEvent );
    }); // listen

    var processKey = {
      32: function( e ) { // space key
        butter.currentMedia.paused = !butter.currentMedia.paused;
      }, // space key
      37: function( e ) { // left key
        if( butter.selectedEvents.length ) {
          butter.timeline.moveFrameLeft( e );
        } else {
          butter.currentTime -= e.shiftKey ? 2.5 : 0.25;
        } // if
      }, // left key
      38: function( e ) { // up key
        var track,
            trackEvent,
            nextTrack;
        for( var i = 0; i < butter.selectedEvents.length; i++ ) {
          trackEvent = butter.selectedEvents[ i ];
          track = trackEvent.track;
          nextTrack = butter.tracks[ butter.tracks.indexOf( track ) - 1 ]
          if( nextTrack ) {
            track.removeTrackEvent( trackEvent );
            nextTrack.addTrackEvent( trackEvent );
          } // if
        } // for
      }, // up key
      39: function( e ) { // right key
        if( butter.selectedEvents.length ) {
          butter.timeline.moveFrameRight( e );
        } else {
          butter.currentTime += e.shiftKey ? 2.5 : 0.25;
        } // if
      }, // right key
      40: function( e ) { // down key
        var track,
            trackEvent,
            nextTrack;
        for( var i = 0; i < butter.selectedEvents.length; i++ ) {
          trackEvent = butter.selectedEvents[ i ];
          track = trackEvent.track;
          nextTrack = butter.tracks[ butter.tracks.indexOf( track ) + 1 ]
          if( nextTrack ) {
            track.removeTrackEvent( trackEvent );
            nextTrack.addTrackEvent( trackEvent );
          } // if
        } // for
      }, // down key
      27: function( e ) { // esc key
        for( var i = 0; i < butter.selectedEvents.length; i++ ) {
          butter.selectedEvents[ i ].selected = false;
        } // for
        butter.selectedEvents = [];
      }, // esc key
      8: function( e ) { // del key
        if( butter.selectedEvents.length ) {
          e.preventDefault();
          for( var i = 0; i < butter.selectedEvents.length; i++ ) {
            butter.selectedEvents[ i ].track.removeTrackEvent( butter.selectedEvents[ i ] );
          } // for
        } // if
      }, // del key
      9: function( e ) { // tab key
        if( butter.selectedEvents.length <= 1 ){
          e.preventDefault();
          var index = 0,
              direction = e.shiftKey ? -1 : 1;
          if( orderedTrackEvents.indexOf( butter.selectedEvents[ 0 ] ) > -1 ){
            index = orderedTrackEvents.indexOf( butter.selectedEvents[ 0 ] );
            if( orderedTrackEvents[ index+direction ] ){
              index+=direction;
            } else if( !e.shiftKey ){
              index = 0;
            } else {
              index = orderedTrackEvents.length - 1;
            } // if
          } // if
          for( var i = 0; i < butter.selectedEvents.length; i++ ) {
            butter.selectedEvents[ i ].selected = false;
          } // for
          butter.selectedEvents = [];
          orderedTrackEvents[ index ].selected = true;
          butter.selectedEvents.push( orderedTrackEvents[ index ] );
        } // if
      } // tab key
    };

    window.addEventListener( "keypress", function( e ){
      var key = e.which || e.keyCode;
      // this allows backspace and del to do the same thing on windows and mac keyboards
      key = key === 46 ? 8 : key;
      if( processKey[ key ] && __unwantedKeyPressElements.indexOf( e.target.nodeName ) === -1 ){
        processKey[ key ]( e );
      } // if
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
