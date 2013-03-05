/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "util/time" ], function( util ){

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
            time = util.toSeconds( time );
            _media.currentTime = time;
          }
          catch( e ){
            time = _media.currentTime;
          } //try
        } //if

        _timeBox.value = util.toTimecode( time, 0 );
      }
      else {
        _timeBox.value = _oldValue;
      } //if
    } //setTime

    _media.listen( "mediatimeupdate", function(){
      setTime( _media.currentTime, false );
    });

    _timeBox.addEventListener( "focus", function(){
      _oldValue = _timeBox.value;
    }, false );

    _timeBox.addEventListener( "blur", function(){
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

    _muteButton = new Button( statusArea, ".mute-button-container", function() {
      _media.muted = !_media.muted;
    });

    _playButton = new Button( statusArea, ".play-button-container", function() {
      if ( _media.ended ) {
        _media.paused = false;
      }
      else {
        _media.paused = !_media.paused;
      }
    });

    // Ensure default state is correct
    _playButton.state = true;

    _media.listen( "mediamuted", function(){
      _muteButton.state = false;
    });

    _media.listen( "mediaunmuted", function(){
      _muteButton.state = true;
    });

    _media.listen( "mediavolumechange", function(){
      _muteButton.state = !_media.muted;
    });

    _media.listen( "mediaended", function(){
      _playButton.state = true;
    });

    _media.listen( "mediaplay", function(){
      _playButton.state = false;
    });

    _media.listen( "mediapause", function(){
      _playButton.state = true;
    });

    _media.listen( "mediacontentchanged", function(){
      _playButton.state = true;
    });

  };

});

