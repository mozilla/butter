/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "editor/editor", "editor/base-editor", "text!layouts/ui-kit.html" ],
  function( Editor, BaseEditor, LAYOUT_SRC ) {
    var ACTIVE_CLASS = "butter-btn-active";

    function toggleRadio( e ) {
      var target = e.target.tagName === "A" ? e.target : e.target.parentNode,
          selected = this.querySelector( "." + ACTIVE_CLASS );
      if ( selected ) {
        selected.classList.remove( ACTIVE_CLASS );
      }
      target.classList.toggle( ACTIVE_CLASS );
    }

    function toggleCheckbox() {
      this.classList.toggle( ACTIVE_CLASS );
    }

    function attachOnClick( nodeList, fn ) {
      for ( var i = 0, l = nodeList.length; i < l; i++ ) {
        nodeList[ i ].addEventListener( "click", fn, false );
      }
    }

  Editor.register( "ui-kit", LAYOUT_SRC, function( rootElement, butter, compiledLayout ) {
    Editor.BaseEditor.extend( this, butter, rootElement, {
      open: function() {
        var radios = rootElement.querySelectorAll( ".butter-btn-radio" ),
            checkboxes = rootElement.querySelectorAll( ".butter-btn-checkbox" );
        attachOnClick( radios, toggleRadio );
        attachOnClick( checkboxes, toggleCheckbox );
      },
      close: function() {
      }
    });
  });
});
