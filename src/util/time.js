/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [], function(){

  var __timeAccuracy = 5;

  function roundTime( time, accuracy ){
    accuracy = accuracy || __timeAccuracy;
    return Math.round( time * ( Math.pow( 10, accuracy ) ) ) / Math.pow( 10, accuracy );
  } //roundTime

  function toSeconds( time ){
    var splitTime,
        seconds,
        minutes,
        hours;

    if ( !time ) {
      return time;
    }

    splitTime = time.split( ":" );
    seconds = +splitTime[ splitTime.length - 1 ];
    minutes = +splitTime[ splitTime.length - 2 ];
    hours = +splitTime[ splitTime.length - 3 ];

    if ( hours ) {
      seconds += hours * 3600;
    }

    if ( minutes ) {
      seconds += minutes * 60;
    }
        
    return seconds;
  }

  function parse( time ){
    var hours,
        minutes,
        seconds,
        timeString;

    if ( typeof time === "string" ) {
      time = toSeconds( time );
    }

    hours = Math.floor( time / 3600 );
    minutes = Math.floor( ( time % 3600 ) / 60 );
    seconds = roundTime( time % 60, 2 );
    timeString = seconds + "";

    if ( !minutes && !hours ) {
      return timeString;
    }

    if ( !seconds ) {
      timeString = ":00";
    } else if ( seconds < 10 ) {
      timeString = ":0" + seconds;
    } else {
      timeString = ":" + timeString;
    }

    if ( !minutes ) {
      timeString = "00" + timeString;
    } else if ( hours && minutes < 10 ) {
      timeString = "0" + minutes + timeString;
    } else {
      timeString = minutes + timeString;
    }

    if ( hours ) {
      timeString = hours + ":" + timeString;
    }

    return timeString;
  }

  var utils = {
    roundTime: roundTime,
    timecode: {
      toSeconds: toSeconds,
      parse: parse
    }
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
