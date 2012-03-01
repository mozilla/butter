define( [], function(){

  var __timeAccuracy = 3;

  function roundTime( time ){
    return Math.round( time * ( Math.pow( 10, __timeAccuracy ) ) ) / Math.pow( 10, __timeAccuracy );
  } //roundTime

  var utils = {
    roundTime: roundTime
  }; //utils

  Object.defineProperties( utils, {
    timeAccuracy: {
      enumerable: true,
      get: function(){
        return __timeAccuracy;
      },
      set: function( val ){
        __timeAccuracy = val;
      }
    }
  });

  return utils;

});
