/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function( Butter ) {

  var Editor = Butter.Editor;

  Editor.register( "webpage", [ Editor.DefaultEditor.EDITOR_SRC, "load!{{baseDir}}templates/assets/editors/webpage/webpage-editor.html" ],
    function( rootElement, butter, compiledLayout ) {

    var _rootElement = rootElement,
        _this = this;

    function setup( trackEvent ) {
      var container = _rootElement.querySelector( ".editor-options" );

      var warningDiv = compiledLayout.querySelector( ".trackevent-warning" );
      container.appendChild( warningDiv );
    }

    Editor.DefaultEditor.extend( _this, rootElement, butter, compiledLayout, {
      open: function( parentElement, trackEvent ) {
        setup( trackEvent );
      },
      close: function() {
      }
    });

  });

}( window.Butter ));
