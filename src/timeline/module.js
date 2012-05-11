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

  var Timeline = function( butter, options ){

    var _media = {},
        _currentMedia,
        _parentElement = document.createElement( "div" );

    _parentElement.id = "butter-timeline";

    _parentElement.classList.add( "fadable" );

    this._start = function( onModuleReady ){
      butter.ui.areas.work.addComponent( _parentElement, {
        states: [ "timeline" ],
        transitionIn: function(){
          _parentElement.style.display = "block";
          setTimeout(function(){
            _parentElement.style.opacity = "1";
          }, 0);
        },
        transitionInComplete: function(){

        },
        transitionOut: function(){
          _parentElement.style.opacity = "0";
        },
        transitionOutComplete: function(){
          _parentElement.style.display = "none";
        }
      });

      butter.ui.registerStateToggleFunctions( "timeline", {
        transitionIn: function(){
          _parentElement.removeAttribute( "data-butter-disabled" );
        },
        transitionOut: function(){
          _parentElement.setAttribute( "data-butter-disabled", true );
        }
      });

      butter.ui.pushContentState( "timeline" );
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

    Object.defineProperties( this, {
      zoom: {
        get: function(){
          return _currentMedia.zoom;
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
