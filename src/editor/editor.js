/*********************************************************************************

Copyright (C) 2011 by Mozilla Foundation

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

define( [ "core/eventmanager", "dialog/iframe-dialog", "dialog/window-dialog", "util/time" ], function( EventManager, TimeUtil ) {

  var DEFAULT_DIMS = [ 400, 400 ],
      DEFAULT_FRAME_TYPE = "window";

  var __guid = 0;

  function Editor( butter, source, type, frameType, options ) {
    var _id = __guid++,
        _frameType = frameType || DEFAULT_FRAME_TYPE,
        _source = source,
        _type = type,
        _dims = DEFAULT_DIMS.slice(),
        _em = new EventManager( "Editor-" + _type ),
        _dialog,
        _dialogOptions = {
          type: _frameType,
          modal: "behind-timeline",
          url: source,
        },
        _currentTarget,
        _this = this;

    _dims[ 0 ] = options.width || _dims[ 0 ];
    _dims[ 1 ] = options.height || _dims[ 1 ];

    this.open = function( trackEvent ) {
      if( !_dialog ){
        if( _frameType === "iframe" ){
          _dialog = new IFrameDialog( _dialogOptions );
        }
        else{
          _dialog = new WindowDialog( _dialogOptions );
        } //if
      } //if

      if( !_dialog.closed ){
        return;
      } //if

      function onTrackEventUpdated( e ){
        _dialog.send( "trackeventupdated", trackEvent.popcornOptions );
      } //onTrackEventUpdated

      function blinkTarget(){
        if( _currentTarget === "Media Element" ){
          butter.currentMedia.view.blink();
        }
        else{
          var target = butter.getTargetByType( "elementID", _currentTarget );
          if( target ){
            target.view.blink();
          } //if
        } //if
      } //blinkTarget

      function onTrackEventUpdateFailed( e ) {
        butter.dialog.send( _dialogName, "trackeventupdatefailed", e.data );
      } //onTrackEventUpdateFailed

      _dialog.open({
        open: function( e ) {
          var targets = [],
              media = {
                name: butter.currentMedia.name,
                target: butter.currentMedia.target
              };
          for( var i = 0, l = butter.targets.length; i < l; i++ ) {
            targets.push( butter.targets[ i ].element.id );
          }
          var corn = trackEvent.popcornOptions;
          _dialog.send( "trackeventdata", {
            manifest: Popcorn.manifest[ trackEvent.type ],
            popcornOptions: corn,
            targets: targets,
            media: media
          });
          _currentTarget = corn.target; 
          blinkTarget();
          trackEvent.listen( "trackeventupdated", onTrackEventUpdated );
          trackEvent.listen( "trackeventupdatefailed", onTrackEventUpdateFailed );
        },
        submit: function( e ) {
          var duration = TimeUtil.roundTime( butter.currentMedia.duration );
          if( e.data &&
              ( e.data.start < 0 ||
                e.data.end > duration ||
                e.data.start > e.data.end ) ){
            trackEvent.dispatch( "trackeventupdatefailed", {
              error: "trackeventupdate::invalidtime",
              message: "Invalid start/end times.",
              attemptedData: e.data
            });
          }
          else{
            if( e.data.target !== _currentTarget ){
              _currentTarget = e.data.target;
              blinkTarget();
            } //if
            trackEvent.update( e.data );
          } //if
        },
        close: function( e ){
          trackEvent.unlisten( "trackeventupdated", onTrackEventUpdated );
          trackEvent.unlisten( "trackeventupdatefailed", onTrackEventUpdateFailed );
        }
      });
    }; //open

    Object.defineProperties( _this, {
      type: {
        enumerable: true,
        get: function() {
          return _type;
        }
      },
      frame: {
        enumerable: true,
        get: function() {
          return _frameType === "window";
        }
      },
      size: {
        enumerable: true,
        get: function() {
          return { width: _dims[ 0 ], height: _dims[ 1 ] };
        },
        set: function( val ) {
          val = val || {};
          _dims[ 0 ] = val.width || _dims[ 0 ];
          _dims[ 1 ] = val.height || _dims[ 1 ];
        }
      }
    });

  } //Editor

  return Editor;

});


