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

define( [], function(){

  function Button( className, onClick ){
    var _container = document.createElement( "div" ),
        _button = document.createElement( "div" ),
        _icon = document.createElement( "div" ),
        _state = true;

    _container.className = className;
    _button.className = "status-button";
    _icon.className = "status-button-icon";

    _container.appendChild( _button );
    _button.appendChild( _icon );

    function update(){
      if( _state ){
        _icon.removeAttribute( "state" );
      }
      else {
        _icon.setAttribute( "state", true );
      } //if
    } //update

    function onMouseUp( e ){
      _button.removeAttribute( "mouse-state" );
      window.removeEventListener( "mouseup", onMouseUp, false );
    }

    _button.addEventListener( "mousedown", function( e ){
      _button.setAttribute( "mouse-state", "depressed" );
      window.addEventListener( "mouseup", onMouseUp, false );
    }, false );
    _button.addEventListener( "click", onClick, false );

    Object.defineProperties( this, {
      element: {
        enumerable: true,
        get: function(){ return _container; }
      },
      state: {
        enumerable: true,
        get: function(){
          return _state;
        },
        set: function( val ){
          _state = val;
          update();
        }
      }
    });

  } //Button

  return function( parentElement, media ){

    var _parent = parentElement,
        _media = media,
        _statusContainer = document.createElement( "div" ),
        _durationContainer = document.createElement( "div" ),
        _muteButton,
        _playButton,
        _this = this;

    _statusContainer.className = "status-container";
    _durationContainer.className = "duration-container";
    
    _muteButton = new Button( "mute-button-container", function( e ){
      _media.muted = !_media.muted;
    });

    _playButton = new Button( "play-button-container", function( e ){
      _media.paused = !_media.paused;
    });

    _media.listen( "mediamuted", function( e ){
      _muteButton.state = false;
    });

    _media.listen( "mediaunmuted", function( e ){
      _muteButton.state = true;
    });

    _media.listen( "mediavolumechange", function( e ){
      _muteButton.state = !_media.muted;
    });

    _media.listen( "mediaplaying", function( e ){
      _playButton.state = false;
    });

    _media.listen( "mediapause", function( e ){
      _playButton.state = true;
    });

    _statusContainer.appendChild( _muteButton.element );
    _statusContainer.appendChild( _playButton.element );
    _parent.appendChild( _statusContainer );

    _this.update = function(){
    }; //update

    _this.destroy = function(){
    }; //destroy
    
  }; //Status

});

