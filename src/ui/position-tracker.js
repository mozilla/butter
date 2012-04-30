define([], function(){

  var POLL_INTERVAL = 20;
  
  return function( object, movedCallback ){
    var _rect = {},
        interval;

    interval = setInterval( function(){
      var newPos = object.getBoundingClientRect();
      if( newPos.left !== _rect.left ||
          newPos.right !== _rect.right ||
          newPos.top !== _rect.top ||
          newPos.bottom !== _rect.bottom ){
        _rect = newPos;
        movedCallback( _rect );
      }
    }, POLL_INTERVAL );

    return {
      destroy: function(){
        clearInterval(interval);
      }
    };
  };

});