define([ "dialog/dialog", "util/lang", "text!layouts/header.html", "ui/user-data", "ui/webmakernav/webmakernav", "ui/widget/tooltip" ],
  function( Dialog, Lang, HEADER_TEMPLATE, UserData, WebmakerBar, ToolTip ) {

  return function( butter, options ){

    options = options || {};

    var TOOLTIP_NAME = "name-error-header-tooltip";

    var _this = this,
        _userData = new UserData( butter, options ),
        _rootElement = Lang.domFragment( HEADER_TEMPLATE, ".butter-header" ),
        _webmakerNavBar = _rootElement.querySelector( "#webmaker-nav" ),
        _saveButton = _rootElement.querySelector( ".butter-save-btn"),
        _projectTitle = _rootElement.querySelector( ".butter-project-title" ),
        _projectName = _projectTitle.querySelector( ".butter-project-name" ),
        _previewBtn = _rootElement.querySelector( ".butter-preview-btn" ),
        _tabzilla = _rootElement.querySelector( "#tabzilla" ),
        _noProjectNameToolTip,
        _projectTitlePlaceHolderText = _projectName.innerHTML,
        _webmakerNav;

    // create a tooltip for the plrojectName element
    ToolTip.create({
      title: "header-title-tooltip",
      message: "Change the name of your project",
      element: _projectTitle,
      top: "60px"
    });

    _this.element = _rootElement;
    
    ToolTip.apply( _projectTitle );

    _tabzilla.addEventListener( "click", function() {
      document.body.classList.toggle( "tabzilla-open" );
    }, false );

    function toggleSaveButton( on ) {
      if ( on ) {
        _saveButton.classList.remove( "butter-disabled" );
      } else {
        _saveButton.classList.add( "butter-disabled" );
      }
    }

    function togglePreviewButton( on ) {
      if ( on ) {
        _previewBtn.classList.remove( "butter-disabled" );
        _previewBtn.href = butter.project.publishUrl;
        _previewBtn.onclick = function() {
          return true;
        };
      } else {
        _previewBtn.classList.add( "butter-disabled" );
        _previewBtn.href = "";
        _previewBtn.onclick = function() {
          return false;
        };
      }
    }

    this.views = {
      dirty: function() {
        togglePreviewButton( false );
        toggleSaveButton( true );
      },
      clean: function() {
        togglePreviewButton( true );
        toggleSaveButton( false );
      },
      login: function() {
        togglePreviewButton( false );
        toggleSaveButton( false );
        _previewBtn.style.display = "";
        _projectTitle.style.display = "";
        _saveButton.innerHTML = "Save";
      },
      logout: function() {
        togglePreviewButton( false );
        toggleSaveButton( true );
        _previewBtn.style.display = "none";
        _projectTitle.style.display = "none";
        _saveButton.innerHTML = "Sign in to save";
      }
    };

    function feedbackCallback() {
      var dialog = Dialog.spawn( "feedback" );
      dialog.open();
    }

    _webmakerNav = new WebmakerBar({
      container: _webmakerNavBar,
      onLogin: _userData.authenticationRequired,
      onLogout: _userData.logout,
      feedbackCallback: feedbackCallback
    });


    function onLogin() {
      _webmakerNav.views.login( butter.cornfield.username() );
    }
    
    butter.listen( "autologinsucceeded", onLogin, false );
    butter.listen( "authenticated", onLogin, false );
    butter.listen( "logout", _webmakerNav.views.logout, false );

    function destroyToolTip() {
      if ( _noProjectNameToolTip && !_noProjectNameToolTip.destroyed ) {
        _projectTitle.removeEventListener( "mouseover", destroyToolTip, false );
        _noProjectNameToolTip.destroy();
      }
    }

    function prepare() {
      function afterSave() {
        butter.editor.openEditor( "share-properties" );
        togglePreviewButton( true );
      }

      if ( !butter.project.isSaved ) {
        // If saving fails, restore the "Save" button so the user can try again.
        _userData.save( function() { afterSave(); },
                        function() { toggleSaveButton( true );
                                     togglePreviewButton( false ); } );
      } else {
        afterSave();
      }
    }

    function onKeyPress( e ) {
      var node = _projectTitle.querySelector( ".butter-project-name" );

      // if this wasn't the 'enter' key, return early
      if ( e.keyCode !== 13 ) {
        return;
      }

      node.blur();
      node.removeEventListener( "keypress", onKeyPress, false );
    }

    /*
     * Function: checkProjectName
     *
     * Checks whether the current projects name is a valid one or not.
     * @returns boolean value representing whether or not the current project name is valid
     */
    function checkProjectName( name ) {
      return !!name && name !== _projectTitlePlaceHolderText;
    }

    function nameError() {
      destroyToolTip();

      _projectTitle.addEventListener( "mouseover", destroyToolTip, false );

      ToolTip.create({
        name: TOOLTIP_NAME,
        message: "Please give your project a name before saving",
        hidden: false,
        element: _projectTitle,
        top: "50px",
        error: true
      });

      _noProjectNameToolTip = ToolTip.get( TOOLTIP_NAME );
    }

    function onBlur() {
      var node = _projectTitle.querySelector( ".butter-project-name" );
      node.removeEventListener( "blur", onBlur, false );

      _projectName.textContent = node.value || _projectTitlePlaceHolderText;
      if( checkProjectName( _projectName.textContent ) ) {
        butter.project.name = _projectName.textContent;
        _userData.authenticationRequired( prepare );
      } else {
        nameError();
      }

      _projectTitle.replaceChild( _projectName, node );
      _projectTitle.addEventListener( "click", projectNameClick, false );
    }

    _saveButton.addEventListener( "click", function( e ) {
      if ( !butter.cornfield.authenticated() ) {
        _userData.authenticationRequired();
      }
      else if ( butter.project.isSaved ) {
        return;
      }
      else if ( checkProjectName( butter.project.name ) ) {
        _userData.authenticationRequired( prepare, nameError );
        return;
      }
      else {
        nameError();
      }
    }, false );

    function projectNameClick( e ) {
      var input = document.createElement( "input" );

      input.type = "text";

      input.placeholder = _projectTitlePlaceHolderText;
      input.classList.add( "butter-project-name" );
      input.value = _projectName.textContent !== _projectTitlePlaceHolderText ? _projectName.textContent : "";
      _projectTitle.replaceChild( input, _projectName );
      _projectTitle.removeEventListener( "click", projectNameClick, false );
      input.focus();
      input.addEventListener( "blur", onBlur, false );
      input.addEventListener( "keypress", onKeyPress, false );
    }

    _projectName.addEventListener( "click", projectNameClick, false );

    this.attachToDOM = function() {
      document.body.classList.add( "butter-header-spacing" );
      document.body.insertBefore( _rootElement, document.body.firstChild );
    };

    butter.listen( "autologinsucceeded", _this.views.login, false );
    butter.listen( "authenticated", _this.views.login, false );
    butter.listen( "logout", _this.views.logout, false );

    //Default view
    _this.views.logout();

    butter.listen( "projectsaved", function() {
      // Disable "Save" button
      _this.views.clean();
      _projectName.textContent = butter.project.name;
    });
    butter.listen( "projectchanged", function() {
      // Re-enable "Save" button to indicate things are not saved
      _this.views.dirty();
    });
    butter.listen( "ready", function() {
      if ( butter.project.name ) {
        _projectName.textContent = butter.project.name;
      }
    });

  };
});
