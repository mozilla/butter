/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [], function(){

  var __timeAccuracy = 5;

  /**
   * Member: roundTime
   *
   * Rounds a number to a set accuracy
   * Accuracy of 5:
   * 1.012345 -> 1.01234
   * Accuracy of 2:
   * 1.012345 -> 1.01
   *
   * @param {Number} time: Time to round given existing accuracy
   */
  function roundTime( time ){
    return Math.round( time * ( Math.pow( 10, __timeAccuracy ) ) ) / Math.pow( 10, __timeAccuracy );
  }

  /**
   * Member: toSeconds
   *
   * toSeconds converts a timecode string to seconds.
   * "HH:MM:SS.DD" -> seconds
   * examples:
   * "1:00:00" -> 3600
   * "-1:00:00" -> -3600
   * it also converts strings with seconds to seconds
   * " 003600.00" -> 3600
   * " 003600.99" -> 3600.99
   *
   * @param {String} time: Timecode to which is converted to seconds
   */
  function toSeconds( time ) {
    var splitTime,
        seconds,
        minutes,
        hours,
        isNegative = 1;

    if ( typeof time === "number" ) {
      return time;
    }

    if ( typeof time !== "string" ) {
      return 0;
    }

    time = time.trim();
    if ( time.substring( 0, 1 ) === "-" ) {
      time = time.replace( "-", "" );
      isNegative = -1;
    }

    splitTime = time.split( ":" );
    seconds = +splitTime[ splitTime.length - 1 ] || 0;
    minutes = +splitTime[ splitTime.length - 2 ] || 0;
    hours = +splitTime[ splitTime.length - 3 ] || 0;

    seconds += hours * 3600;
    seconds += minutes * 60;

    return seconds * isNegative;
  }

  /**
   * Member: toTimecode
   *
   * toTimecode converts seconds to a timecode string.
   * seconds -> "HH:MM:SS.DD"
   * examples:
   * 3600 -> "1:00:00"
   * -3600 -> "-1:00:00"
   * it also converts strings to timecode
   * "  00:00:01" -> "1"
   * "  000:01:01.00" -> "1:01"
   * "3600" -> "1:00:00"
   *
   * @param {Number} time: Seconds to which is converted to timecode
   */
  function toTimecode( time, zeroPadding ){
    var hours,
        minutes,
        seconds,
        timeString,
        isNegative = "";

    if ( typeof time === "string" ) {
      time = toSeconds( time );
    }

    if ( typeof time !== "number" ) {
      return 0;
    }

    if ( time < 0 ) {
      isNegative = "-";
      time = -time;
    }

    hours = Math.floor( time / 3600 );
    minutes = Math.floor( ( time % 3600 ) / 60 );
    __timeAccuracy = 2;
    seconds = roundTime( time % 60 );
    timeString = seconds + "";

    if ( !minutes && !hours ) {
      return isNegative + timeString;
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

    return isNegative + timeString;
  }

  var utils = {
    roundTime: roundTime,
    toSeconds: toSeconds,
    toTimecode: toTimecode
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
