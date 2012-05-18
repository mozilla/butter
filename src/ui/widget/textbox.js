/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

/**
 * Butter Textbox Widget Wrapper
 *
 * A simple input textbox with cross-browser click-to-select functionality.
 * Clicking this textbox will cause the contents to be selected.  The next
 * click will position the cursor.  Getting this to work cross-browser is
 * harder than it should be, especially on Chrome.  See:
 * http://code.google.com/p/chromium/issues/detail?id=4505
 *
 * The textbox manages listeners carefully in order to have mouse clicks
 * do what the user expects.  On creation, `focus` and `mouseup` handlers
 * are added to the element.  When the first `focus` event happens, the
 * contents of the element are selected, and the `focus` handler is removed,
 * so that the next click doesn't re-select.  The `mouseup` event that
 * follows the `focus` click is ignored (needed on WebKit), but subsequent
 * `mouseup` events are processed normally, so the selection can be broken.
 * Once the element receives `blur` the handlers are added back.
 **/

define( [], function(){

  function __highlight( e ){
    var input = e.target;
    input.select();
    input.removeEventListener( "focus", __highlight, false );
  }

  function __ignoreMouseUp( e ){
    e.preventDefault();
    var input = e.target;
    input.removeEventListener( "mouseup", __ignoreMouseUp, false );
  }

  function __addListeners( input ){
    input.addEventListener( "focus", __highlight, false );
    input.addEventListener( "mouseup", __ignoreMouseUp, false );
  }

  return function( input ){
    if( !(input && input.type === "text" ) ){
      throw "Textbox: Expected an input element of type text";
    }

    input.addEventListener( "blur", function( e ){
        __addListeners( e.target );
    }, false);

    __addListeners( input );

    return input;
  };

});
