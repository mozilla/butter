/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [], function(){

  var DEFAULT_TRANSITION_TIMEOUT = 15;

  var TRANSFORM_PROPERTY = (function(){
    var div = document.createElement( "div" );
    var choices = "Webkit Moz O ms".split( " " ).map( function( prefix ) { return prefix + "Transform"; } );

    for ( var i = choices.length; i >= 0; --i ) {
      if ( div.style[ choices[ i ] ] !== undefined ) {
        return choices[ i ];
      }
    }

    return "transform";
  }());

  /**
   * HTML escape code from mustache.js, used under MIT Licence
   * https://github.com/janl/mustache.js/blob/master/mustache.js
   **/
  var escapeMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;'
  };

  return {

    // Escape HTML string so it is suitable for use in dom text
    escapeHTML: function( str ) {
      return String( str ).replace( /&(?!\w+;)|[<>"']/g, function ( s ) {
        return escapeMap[ s ] || s;
      });
    },

    extend: function ( obj /* , extra arguments ... */) {
      var dest = obj, src = [].slice.call( arguments, 1 );
      src.forEach( function( copy ) {
        for( var prop in copy ){
          if( copy.hasOwnProperty( prop ) ){
            dest[ prop ] = copy[ prop ];
          }
        }
      });
    }, //extend

    // Convert an SMPTE timestamp to seconds
    smpteToSeconds: function( smpte ){
      var t = smpte.split( ":" );
      if( t.length === 1 ){
        return parseFloat( t[ 0 ], 10 );
      }
      if( t.length === 2 ){
        return parseFloat( t[ 0 ], 10 ) + parseFloat( t[ 1 ] / 12, 10 );
      }
      if( t.length === 3 ){
        return parseInt( t[ 0 ] * 60, 10 ) + parseFloat( t[ 1 ], 10 ) + parseFloat( t[ 2 ] / 12, 10 );
      }
      if( t.length === 4 ){
        return parseInt( t[ 0 ] * 3600, 10 ) + parseInt( t[ 1 ] * 60, 10 ) + parseFloat( t[ 2 ], 10 ) + parseFloat( t[ 3 ] / 12, 10 );
      }
    }, //smpteToSeconds

    secondsToSMPTE: function( time ){
      var timeStamp = new Date( 1970, 0, 1 ),
          seconds;
      timeStamp.setSeconds( time );
      seconds = timeStamp.toTimeString().substr( 0, 8 );
      if( seconds > 86399 ){
        seconds = Math.floor( (timeStamp - Date.parse("1/1/70") ) / 3600000) + seconds.substr(2);
      }
      return seconds;
    }, //secondsToSMPTE

    clone: function( obj ) {
      var newObj = {};
      for ( var prop in obj ) {
        if ( obj.hasOwnProperty( prop ) ) {
          newObj[ prop ] = obj[ prop ];
        } //if
      } //for
      return newObj;
    },

    // Fill in a given object with default properties.  Based on underscore (MIT License).
    // https://github.com/documentcloud/underscore/blob/master/underscore.js
    defaults: function( obj, source ){
      for( var prop in source ){
        if( obj[ prop ] === undefined ){
          obj[ prop ] = source[ prop ];
        }
      }
      return obj;
    },

    domFragment: function( inputString, immediateSelector ) {
      var range = document.createRange(),

          // For particularly speedy loads, 'body' might not exist yet, so try to use 'head'
          container = document.body || document.head,
          fragment,
          child;

      range.selectNode( container );
      fragment = range.createContextualFragment( inputString );

      // If immediateSelector was specified, try to use it to find a child node of the fragment
      // and return it.
      if( immediateSelector ){
        child = fragment.querySelector( immediateSelector );
        if ( child ) {
          // Opera appends children to the <body> in some cases, so the parentNode might not be `fragment` here.
          // So, remove it from whatever its attached to, since it was spawned right here.
          // Note: should be `fragment.removeChild( child );`
          child.parentNode.removeChild( child );
          return child;
        }
      }

      return fragment;
    },

    applyTransitionEndListener: (function() {
      var div = document.createElement( "div" ),
          p,
          pre = [ "OTransition", "webkitTransition", "MozTransition", "transition" ];

      // Check for CSS3 Transition support
      /*jshint loopfunc:true */
      for ( p in pre ) {
        if ( div.style[ pre[ p ] ] !== undefined ) {
          return function( element, listener ) {
            element.addEventListener( "transitionend", listener, false );
            element.addEventListener( "oTransitionEnd", listener, false );
            element.addEventListener( "webkitTransitionEnd", listener, false );
          };
        }
      }
      /*jshint loopfunc:false */

      // Fallback on setTimeout
      return function( element, listener ) {

        // If there was already a timeout waiting on this element, remove it.
        var currentTimeout = element.getAttribute( "data-butter-transition-end" );
        if ( typeof currentTimeout === "string" && currentTimeout !== "" ) {
          clearTimeout( currentTimeout | 0 );
        }

        // Set a timeout which will clear the `data-butter-transition-end` by itself and call the listener when it expires.
        currentTimeout = setTimeout( function() {
          element.removeAttribute( "data-butter-transition-end" );
          listener.apply( this, arguments );
        } , DEFAULT_TRANSITION_TIMEOUT );

        // Add the `data-butter-transition-end` attribute to the element with the value of currentTimeout.
        element.setAttribute( "data-butter-transition-end", currentTimeout );
      };
    }()),

    removeTransitionEndListener: function( element, listener ) {
      element.removeEventListener( "transitionend", listener, false );
      element.removeEventListener( "oTransitionEnd", listener, false );
      element.removeEventListener( "webkitTransitionEnd", listener, false );
    },

    setTransformProperty: function( element, transform ) {
      element.style[ TRANSFORM_PROPERTY ] = transform;
    },

    getTransformProperty: function( element ) {
      return element.style[ TRANSFORM_PROPERTY ];
    }
  };

});
