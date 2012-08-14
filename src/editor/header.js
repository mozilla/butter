/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define([], function(){
  
  return function( editorAreaDOMRoot, editorModule ) {
    var _mediaButton = editorAreaDOMRoot.querySelector( ".butter-editor-header-media" ),
        _popcornButton = editorAreaDOMRoot.querySelector( ".butter-editor-header-popcorn" ),
        _shareButton = editorAreaDOMRoot.querySelector( ".butter-editor-header-share" ),
        _settingsButton = editorAreaDOMRoot.querySelector( ".butter-editor-header-settings" );

    var _focusMap = {
      "media-properties": _mediaButton,
      "plugin-list": _popcornButton,
      "share-properties": _shareButton,
      "settings": _settingsButton
    };

    var _currentFocus;

    _mediaButton.addEventListener( "click", function( e ) {
      editorModule.openEditor( "media-properties" );
    }, false );

    _popcornButton.addEventListener( "click", function( e ) {
      editorModule.openEditor( "plugin-list" );
    }, false );

    _shareButton.addEventListener( "click", function( e ) {
      editorModule.openEditor( "share-properties" );
    }, false );

    _settingsButton.addEventListener( "click", function( e ) {
      editorModule.openEditor( "settings" );
    }, false );

    // This is an easter egg to open a UI kit editor. Hurrah
    _settingsButton.addEventListener( "dblclick", function( e ) {
      editorModule.openEditor( "ui-kit" );
    }, false );

    this.setFocus = function( editorName ) {
      var focusCandidate = _focusMap[ editorName ];
      if ( _currentFocus ) {
        _currentFocus.classList.remove( "butter-active" );
      }
      if ( focusCandidate ) {
        focusCandidate.classList.add( "butter-active" );
        _currentFocus = focusCandidate;
      }
    };

  };

});
