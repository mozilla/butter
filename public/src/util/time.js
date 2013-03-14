/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

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
   * @param {Number} time: Time which will be rounded
   * @param {Number} accuracy: A one time accuracy to round to
   */
  function roundTime( time, accuracy ){
    accuracy = accuracy >= 0 ? accuracy : __timeAccuracy;
    return Math.round( time * ( Math.pow( 10, accuracy ) ) ) / Math.pow( 10, accuracy );
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
   * @param {String} time: Timecode to be converted to seconds
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
   * Accuracy of 5:
   * 1.012345 -> "0:01.01234"
   * Accuracy of 2:
   * 1.012345 -> "0:01.01"
   * Defaults to 2
   *
   * @param {Number} time: Seconds to be converted to timecode
   * @param {Number} accuracy: A one time accuracy to round to
   */
  function toTimecode( time, accuracy ){
    var hours,
        minutes,
        seconds,
        timeString,
        isNegative = "";

    if ( !accuracy && accuracy !== 0 ) {
      accuracy = 2;
    }

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
    seconds = roundTime( time % 60, accuracy );
    timeString = seconds + "";

    if ( !minutes && !hours ) {
      if ( seconds < 10 ) {
        timeString = "0" + timeString;
      }
      return isNegative + "0:" + timeString;
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

  /**
   * Member: toPrettyString
   *
   * toPrettyString converts a time in ms to something pretty for display.
   *
   * Examples:
   * 12341 -> "less than a minute"
   * 123411 -> "2 minutes"
   * 123411234 -> "10 hours"
   * 1234112341 -> "14 days"
   *
   * @param {Number} ms: A number of ms
   */
  function toPrettyString( ms ) {
    var round = Math.round,
        t, seconds, minutes, hours, days;

    t = ms / 1000;
    seconds = round( t % 60 );
    t /= 60;
    minutes = round( t % 60 );
    t /= 60;
    hours = round( t % 24 );
    t /= 24;
    days = round( t );

    if( days >= 1 ) {
      return "" + days + ( days === 1 ? " day" : " days" );
    } else if( hours >= 1 ) {
      return "" + hours + ( hours === 1 ? " hour" : " hours" );
    } else if( minutes >= 1 ) {
      return "" + minutes + ( minutes === 1 ? " minute" : " minutes" );
    } else {
      return "less than a minute";
    }
  }

  var utils = {
    roundTime: roundTime,
    toSeconds: toSeconds,
    toTimecode: toTimecode,
    toPrettyString: toPrettyString
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
