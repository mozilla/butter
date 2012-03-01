/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [], function(){

  var __container;

  return function( state ){

    if( !__container ){
      __container = document.createElement( "div" );
      __container.id = "butter-modal-container";
      document.body.appendChild( __container );
    } //if

    var _element = document.createElement( "div" ),
        _this = this;

    if( state && typeof( state ) === "string" ){
      _element.setAttribute( "state", state );
    } //if

    _element.className = "layer";

    __container.appendChild( _element );

    this.destroy = function(){
      __container.removeChild( _element );
    }; //destroy

    Object.defineProperties( this, {
      element: {
        enumerable: true,
        get: function(){
          return _element;
        }
      }
    });

  }; //Modal

});
