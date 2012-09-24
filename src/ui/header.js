define([ "dialog/dialog", "util/lang", "ui/user-data", "ui/widget/tooltip" ],
  function( Dialog, Lang, UserData, ToolTip ) {

  var DEFAULT_AUTH_BUTTON_TEXT = "<span class='icon-user'></span> Sign In / Sign Up",
      DEFAULT_AUTH_BUTTON_TITLE = "Sign in or sign up with Persona";

  return function( butter, options ){

    options = options || {};

    var TOOLTIP_NAME = "name-error-header-tooltip";

    var _this = this,
        _userData = new UserData( butter, options ),
        _rootElement = _userData.rootElement,
        _saveButton = _userData.saveButton,
        _buttonGroup = _userData.buttonGroup,
        _authButton = _userData.authButton,
        _projectTitle = _userData.projectTitle,
        _projectName = _userData.projectName,
        _previewBtn = _rootElement.querySelector( ".butter-preview-btn" ),
        _nameDropDown = _buttonGroup.querySelector( "ul" ),
        _logoutBtn = _nameDropDown.querySelector( ".butter-logout-btn" ),
        _tabzilla = _rootElement.querySelector( "#tabzilla" ),
        _loginClass = "butter-login-true",
        _activeClass = "btn-green",
        _noProjectNameToolTip,
        _projectTitlePlaceHolderText = _projectName.innerHTML;

    // create a tooltip for the projectName element
    ToolTip.create({
      title: "header-title-tooltip",
      message: "Change the name of your project",
      element: _projectTitle,
      top: "60px"
    });

    // This is an easter egg to open a UI kit editor. Hurrah
    _rootElement.querySelector( ".butter-logo" ).addEventListener( "dblclick", function( e ) {
      butter.editor.openEditor( "ui-kit" );
    }, false );

    _this.element = _rootElement;
    ToolTip.apply( _projectTitle );

    _tabzilla.addEventListener( "click", function( e ) {
      document.body.classList.toggle( "tabzilla-open" );
    }, false );

    function login( successCallback, errorCallback ) {
      _userData.authenticationRequired(function() {
        loginDisplay();
        butter.dispatch( "authenticated" );
        if ( successCallback && typeof successCallback === "function" ) {
          successCallback();
        }
      }, errorCallback );
    }

    _authButton.addEventListener( "click", login, false );

    function publish() {
      butter.cornfield.publish( butter.project.id, function( e ){
        if( e.error !== "okay" ){
          _userData.showErrorDialog( "There was a problem saving your project. Please try again." );
          return;
        } else {
          butter.editor.openEditor( "share-properties" );
          _previewBtn.classList.remove( "butter-hidden" );
          _previewBtn.href = e.url;
        }
      });
    }

    function destroyToolTip() {
      if ( _noProjectNameToolTip && !_noProjectNameToolTip.destroyed ) {
        _projectTitle.removeEventListener( "mouseover", destroyToolTip, false );
        _noProjectNameToolTip.destroy();
      }
    }

    function prepare() {
      butter.dispatch( "projectsaved" );
      _userData.save( publish );
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
    function checkProjectName() {
      if ( !butter.project.name || butter.project.name === _projectTitlePlaceHolderText ) {
        return false;
      }
      return true;
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
      butter.project.name = _projectName.textContent;

      if ( checkProjectName() ) {
        _userData.save( publish );
      } else {
        nameError();
        butter.dispatch( "projectupdated" );
      }
      _projectTitle.replaceChild( _projectName, node );
      _projectTitle.addEventListener( "click", projectNameClick, false );
    }

    _saveButton.addEventListener( "click", function( e ){
      if ( checkProjectName() ) {
        login( prepare );
        return;
      } else {
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

    function toggleDropDown() {
      _nameDropDown.classList.toggle( "butter-dropdown-off" );
    }
  
    function doLogout() {
      _userData.logout( logoutDisplay );
      _nameDropDown.classList.add( "butter-dropdown-off" );
    }

    function loginDisplay() {
      _rootElement.classList.add( _loginClass );
      _authButton.classList.remove( _activeClass );
      _authButton.innerHTML = "<span class='icon icon-user'></span> " + butter.cornfield.name() + "<i class=\"icon icon-downtick\"></i>";
      _authButton.title = "This is you!";
      _authButton.addEventListener( "click", toggleDropDown, false );
      _logoutBtn.addEventListener( "click", doLogout, false );
    }

    function logoutDisplay() {
      _rootElement.classList.remove( _loginClass );
      _buttonGroup.classList.remove( "btn-group" );
      _authButton.classList.add( _activeClass );
      _authButton.removeEventListener( "click", doLogout, false );
      _authButton.innerHTML = DEFAULT_AUTH_BUTTON_TEXT;
      _authButton.title = DEFAULT_AUTH_BUTTON_TITLE;
      _authButton.addEventListener( "click", login, false );
      _previewBtn.classList.add( "butter-hidden" );
      _previewBtn.href = "";
      _authButton.removeEventListener( "click", toggleDropDown, false );
    }

    if ( butter.cornfield.authenticated() ) {
      loginDisplay();
    } else {
      logoutDisplay();
      butter.listen( "autologinsucceeded", function onAutoLoginSucceeded( e ) {
        butter.unlisten( "autologinsucceeded", onAutoLoginSucceeded );
        loginDisplay();
      });
    }

    this.attachToDOM = function() {
      document.body.classList.add( "butter-header-spacing" );
      document.body.insertBefore( _rootElement, document.body.firstChild );
    };

    butter.listen( "authenticated", function() {
      loginDisplay();
    });
    butter.listen( "projectsaved", function() {
      _projectName.textContent = butter.project.name;
    });
    butter.listen( "ready", function() {
      if ( butter.project.name ) {
        _projectName.textContent = butter.project.name;
      }
    });
  };
});
