/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "editor/editor", "editor/base-editor", "text!layouts/settings-editor.html" ],
  function( Editor, BaseEditor, LAYOUT_SRC ) {

  Editor.register( "settings", LAYOUT_SRC, function( rootElement, butter, compiledLayout ) {

    Editor.BaseEditor( this, butter, rootElement, {
      open: function() {

      },
      close: function() {

      }
    });

  });

});