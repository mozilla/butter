/* Copyright 2011, 2012 - Mozilla Foundation
 * This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.opensource.org/licenses/mit-license.php */

define( [ "core/eventmanager", "dialog/iframe-dialog", "dialog/window-dialog" ], function( EventManager, IFrameDialog, WindowDialog ) {

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
          _dialog.send( "trackeventdata", {
            manifest: Popcorn.manifest[ trackEvent.type ],
            popcornOptions: trackEvent.popcornOptions,
            targets: targets,
            media: media
          });
          trackEvent.listen( "trackeventupdated", onTrackEventUpdated );
        },
        submit: function( e ) {
          trackEvent.update( e.data );
        },
        close: function( e ){
          trackEvent.unlisten( "trackeventupdated", onTrackEventUpdated );
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


