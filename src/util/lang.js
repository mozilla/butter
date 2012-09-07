/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [], function(){

  var DEFAULT_TRANSITION_TIMEOUT = 15;

  return {

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
        setTimeout( listener, DEFAULT_TRANSITION_TIMEOUT );
      };
    }()),

    removeTransitionEndListener: function( element, listener ) {
      element.removeEventListener( "transitionend", listener, false );
      element.removeEventListener( "oTransitionEnd", listener, false );
      element.removeEventListener( "webkitTransitionEnd", listener, false );
    }
  };

});
