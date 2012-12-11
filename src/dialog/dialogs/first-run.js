/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "text!dialog/dialogs/first-run.html", "dialog/dialog" ],
  function( LAYOUT_SRC, Dialog ) {
    Dialog.register( "first-run", LAYOUT_SRC, function ( dialog ) {
      dialog.assignEscapeKey( "default-close" );
    });
});
