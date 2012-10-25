/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define([], function(){
  
  return function( editorAreaDOMRoot, editorModule ) {
    var _mediaButton = editorAreaDOMRoot.querySelector( ".butter-editor-header-media" ),
        _popcornButton = editorAreaDOMRoot.querySelector( ".butter-editor-header-popcorn" ),
        _shareButton = editorAreaDOMRoot.querySelector( ".butter-editor-header-share" );

    var _focusMap = {
      "media-properties": _mediaButton,
      "plugin-list": _popcornButton,
      "share-properties": _shareButton
    };

    var _currentFocus;

    _mediaButton.addEventListener( "click", function( e ) {
      editorModule.openEditor( "media-editor" );
    }, false );

    _popcornButton.addEventListener( "click", function( e ) {
      editorModule.openEditor( "plugin-list" );
    }, false );

    _shareButton.addEventListener( "click", function( e ) {
      editorModule.openEditor( "share-properties" );
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
