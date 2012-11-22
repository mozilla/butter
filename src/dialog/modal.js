/*! This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [], function(){

  var __container = document.createElement( "div" );

  var Modal = function( childElement, createOverlay ){

    if( !__container.parentNode ){
      __container.className = "butter-modal-container";
      __container.setAttribute( "data-butter-exclude", true );
      document.body.appendChild( __container );
    }


      var _element = document.createElement( "div" );

      _element.classList.add( "butter-modal-overlay" );
      if ( createOverlay || createOverlay === undefined ) {
        _element.classList.add( "butter-modal-overlay-dark-bg" );
      }
      __container.appendChild( _element );

    // need to wait an event-loop cycle to apply this class
    // ow, opacity transition fails to render
    setTimeout( function(){
      if ( _element ) {
        _element.classList.add( "fade-in" );
      }
    }, 10 );

    _element.appendChild( childElement );

    this.destroy = function(){
      __container.removeChild( _element );
      _element = null;
    };

    Object.defineProperties( this, {
      element: {
        enumerable: true,
        get: function(){
          return _element;
        }
      }
    });

  };

  Modal.element = __container;

  return Modal;

});
