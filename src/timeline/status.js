/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [], function(){

  function Button( className, onClick, toolTip ){
    var _container = document.createElement( "div" ),
        _button = document.createElement( "div" ),
        _icon = document.createElement( "div" ),
        _state = true;

    _container.className = className;
    _button.className = "status-button";
    _button.title = toolTip || "";
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
    } //onMouseUp

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

  function Time( media ){
    var _container = document.createElement( "div" ),
        _timeBox = document.createElement( "input" ),
        _media = media,
        _oldValue = 0,
        _this = this;

    _container.className = "time-container";
    _container.appendChild( _timeBox );
    _timeBox.type = "text";

    var timeCheckRegex = /[^0123456789:\.]/;

    function setTime( time, setCurrentTime ){
      if( typeof( time ) === "string" || !isNaN( time ) ){
        if( setCurrentTime ){
          try {
            _media.currentTime = Popcorn.util.toSeconds( time );
          }
          catch( e ){
            time = _media.currentTime;
          } //try
        } //if

        var timeStamp = new Date( 1970, 0, 1 ),
            seconds;

        timeStamp.setSeconds( time );
        seconds = timeStamp.toTimeString().substr( 0, 8 );

        if( seconds > 86399 ){
          seconds = Math.floor( ( timeStamp - Date.parse( "1/1/70" ) ) / 3600000 ) + seconds.substr( 2 );
        } //if

        _timeBox.value = seconds;
      }
      else {
        _timeBox.value = _oldValue;
      } //if
    } //setTime

    _media.listen( "mediatimeupdate", function( e ){
      setTime( _media.currentTime, false );
    });

    _timeBox.addEventListener( "focus", function( e ){
      _oldValue = _timeBox.value;
    }, false );

    _timeBox.addEventListener( "blur", function( e ){
      if( _timeBox.value !== _oldValue ){
        setTime( _timeBox.value, true );
      } //if
    }, false );

    _timeBox.addEventListener( "keydown", function( e ){
      if( e.which === 13 ){
        _timeBox.blur();
      }
      else if( e.which === 27 ){
        _timeBox.value = _oldValue;
        _timeBox.blur();
      } //if
    }, false );

    setTime( 0, false );

    Object.defineProperties( this, {
      element: {
        enumerable: true,
        get: function(){
          return _container;
        }
      }
    });

  } //Time

  return function( media ){

    var _media = media,
        _statusContainer = document.createElement( "div" ),
        _muteButton,
        _playButton,
        _time,
        _this = this;

    _statusContainer.className = "status-container";

    _time = new Time( _media );

    _muteButton = new Button( "mute-button-container", function( e ){
      _media.muted = !_media.muted;
    }, "Toggle volume on/off" );

    _playButton = new Button( "play-button-container", function( e ){
      if( _media.ended ){
        _media.paused = false;
      }
      else{
        _media.paused = !_media.paused;
      }
    }, "Play/Pause media");

    _media.listen( "mediamuted", function( e ){
      _muteButton.state = false;
    });

    _media.listen( "mediaunmuted", function( e ){
      _muteButton.state = true;
    });

    _media.listen( "mediavolumechange", function( e ){
      _muteButton.state = !_media.muted;
    });

    _media.listen( "mediaended", function( e ){
      _playButton.state = true;
    });

    _media.listen( "mediaplaying", function( e ){
      _playButton.state = false;
    });

    _media.listen( "mediapause", function( e ){
      _playButton.state = true;
    });

    _statusContainer.appendChild( _time.element );
    _statusContainer.appendChild( _playButton.element );

    _this.update = function(){
    }; //update

    _this.destroy = function(){
    }; //destroy

    Object.defineProperties( this, {
      statusElement: {
        enumerable: true,
        get: function(){
          return _statusContainer;
        }
      },
      muteElement: {
        enumerable: true,
        get: function(){
          return _muteButton.element;
        }
      }
    });

  }; //Status

});

