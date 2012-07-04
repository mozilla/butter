/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "util/lang", "text!layouts/toggler.html" ], function( LangUtils, TOGGLER_LAYOUT ){
  return function( clickHandler, elementTitle ){
    var _element = LangUtils.domFragment( TOGGLER_LAYOUT );

    _element.title = elementTitle || "Show/Hide";

    if ( clickHandler ) {
      _element.addEventListener( "click", clickHandler, false );
    }

    Object.defineProperties( this, {
      element: {
        enumerable: true,
        get: function(){
          return _element;
        }
      },
      state: {
        enumerable: true,
        get: function() {
          return _element.classList.contains( "toggled" );
        },
        set: function( state ) {
          if ( state ) {
            _element.classList.add( "toggled" );
          }
          else {
            _element.classList.remove( "toggled" ); 
          }
        }
      },
      visible: {
        enumerable: true,
        get: function(){
          return _element.style.display !== "none";
        },
        set: function( val ){
          _element.style.display = val ? "block" : "none";
        }
      }
    });

  };
});
