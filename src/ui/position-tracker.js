define([], function(){

  var requestAnimFrame = (function(){
      return  window.requestAnimationFrame       ||
              window.webkitRequestAnimationFrame ||
              window.mozRequestAnimationFrame    ||
              window.oRequestAnimationFrame      ||
              window.msRequestAnimationFrame     ||
              function( callback ){
                window.setTimeout(callback, 1000 / 60);
              };
      }());

  return function( object, movedCallback ){
    var _rect = {},
        _stopFlag = false;

    function check () {
      var newPos = object.getBoundingClientRect();
      if (  newPos.left !== _rect.left ||
            newPos.top !== _rect.top ){
        _rect = {
          left: newPos.left,
          top: newPos.top,
          width: newPos.width,
          height: newPos.height
        };
        if ( document.body.scrollTop < 0 ) {
          _rect.top += document.body.scrollTop;
        }
        movedCallback( _rect );
      }
    }

    function loop () {
      check();
      if ( !_stopFlag ) {
        requestAnimFrame( loop );
      }
    }

    loop();

    window.addEventListener( "scroll", check, false );

    return {
      destroy: function(){
        _stopFlag = true;
        window.removeEventListener( "scroll", check, false );
      }
    };
  };

});