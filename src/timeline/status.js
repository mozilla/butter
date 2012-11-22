/*! This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "util/lang" ], function( util ){

  function Button( parentNode, className, onClick ) {
    var _container = parentNode.querySelector( className ),
        _button = _container.querySelector( ".status-button" ),
        _state = true;

    function update() {
      if( _state ){
        _button.removeAttribute( "data-state" );
      }
      else {
        _button.setAttribute( "data-state", true );
      }
    }

    _button.addEventListener( "click", onClick, false );

    Object.defineProperties( this, {
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
  }

  function Time( parentNode, media ){
    var _container = parentNode.querySelector( ".time-container" ),
        _timeBox = _container.querySelector( "input" ),
        _media = media,
        _oldValue = 0;

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

        _timeBox.value = util.secondsToSMPTE( time );
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

  }

  return function Status( media, statusArea ) {

    var _media = media,
        _statusContainer = statusArea.querySelector( ".status-container" ),
        _muteButton,
        _playButton,
        _time;

    _statusContainer.className = "status-container";

    _time = new Time( statusArea, _media );

    _muteButton = new Button( statusArea, ".mute-button-container", function( e ) {
      _media.muted = !_media.muted;
    });

    _playButton = new Button( statusArea, ".play-button-container", function( e ) {
      if ( _media.ended ) {
        _media.paused = false;
      }
      else {
        _media.paused = !_media.paused;
      }
    });

    // Ensure default state is correct
    _playButton.state = true;

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

    _media.listen( "mediaplay", function( e ){
      _playButton.state = false;
    });

    _media.listen( "mediapause", function( e ){
      _playButton.state = true;
    });

    _media.listen( "mediacontentchanged", function( e ){
      _playButton.state = true;
    });

  };

});

