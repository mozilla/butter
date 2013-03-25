/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define([ "ui/widget/tooltip" ], function( Tooltip ) {

  return function( editorAreaDOMRoot, editorModule ) {
    var _mediaButton = editorAreaDOMRoot.querySelector( ".butter-editor-header-media" ),
        _popcornButton = editorAreaDOMRoot.querySelector( ".butter-editor-header-popcorn" ),
        _projectButton = editorAreaDOMRoot.querySelector( ".butter-editor-header-share" ),
        _loginToShareTooltip,
        _waitForMediaTooltip;

    var _focusMap = {
      "media-editor": _mediaButton,
      "plugin-list": _popcornButton,
      "project-editor": _projectButton
    };

    var _currentFocus;

    // Create a message for the disabled share editor.
    // Note: this can return null if the `login-to-share` Tooltip isn't registered
    // (e.g. in tests). So, null checks need to be performed below.
    _loginToShareTooltip = Tooltip.create({
      name: "login-to-share",
      message: "Login and Save your project to share",
      element: _projectButton,
      top: "60px"
    });

    // Create a message for the disabled plugin list.
    _waitForMediaTooltip = Tooltip.create({
      name: "wait-for-media",
      message: "Waiting for media to load",
      element: _popcornButton,
      top: "60px"
    });

    _mediaButton.addEventListener( "click", function() {
      editorModule.openEditor( "media-editor" );
    }, false );

    function openPluginList() {
      editorModule.openEditor( "plugin-list" );
    }

    function openProjectEditor() {
      editorModule.openEditor( "project-editor" );
    }

    _popcornButton.classList.add( "butter-editor-btn-disabled" );

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

    Object.defineProperty( this, "focusMap", {
      enumerable: true,
      writeable: false,
      configurable: false,
      get: function() {
        return _focusMap;
      }
    });

    this.views = {
      unSaved: function() {
        _loginToShareTooltip.classList.remove( "tooltip-off" );
        _projectButton.classList.add( "butter-editor-btn-disabled" );
        _projectButton.removeEventListener( "click", openProjectEditor, false );
        // If the project editor is open, open the media editor instead.
        if ( _currentFocus === _projectButton ) {
          editorModule.openEditor( "media-editor" );
        }
      },
      saved: function() {
        _loginToShareTooltip.classList.add( "tooltip-off" );
        _projectButton.classList.remove( "butter-editor-btn-disabled" );
        _projectButton.addEventListener( "click", openProjectEditor, false );
      },
      enablePlugins: function() {
        _waitForMediaTooltip.classList.add( "tooltip-off" );
        _popcornButton.classList.remove( "butter-editor-btn-disabled" );
        _popcornButton.addEventListener( "click", openPluginList, false );
      },
      disablePlugins: function() {
        _waitForMediaTooltip.classList.remove( "tooltip-off" );
        _popcornButton.classList.add( "butter-editor-btn-disabled" );
        _popcornButton.removeEventListener( "click", openPluginList, false );
      }
    };

  };

});
