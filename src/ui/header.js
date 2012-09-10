define([  "dialog/dialog",
          "util/lang",
          "ui/user-data",
          "ui/widget/tooltip",
          "util/xhr",
          "text!layouts/badges.html",
          "ui/badges"
          ],
  function( Dialog, Lang, UserData, ToolTip, XHR, BADGES_LAYOUT, Badges ) {

  var DEFAULT_AUTH_BUTTON_TEXT = "<span class='icon-user'></span> Sign In / Sign Up",
      DEFAULT_AUTH_BUTTON_TITLE = "Sign in or sign up with Persona";

  return function( butter, options ){

    options = options || {};

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
        _projectTitlePlaceHolderText = _projectName.innerHTML,
        _loginContainer = _rootElement.querySelector( ".butter-login-project-info" ),
        _badgeLayout = Lang.domFragment( BADGES_LAYOUT, ".butter-badge" ),
        _badgeCounter = Lang.domFragment( BADGES_LAYOUT, ".butter-badge-count" );

    // create a tooltip for the projectName element
    ToolTip.create({
      element: _projectTitle,
      top: "50px"
    });

    // This is an easter egg to open a UI kit editor. Hurrah
    _rootElement.querySelector( ".butter-logo" ).addEventListener( "dblclick", function( e ) {
      butter.editor.openEditor( "ui-kit" );
    }, false );

    _this.element = _rootElement;

    _tabzilla.addEventListener( "click", function( e ) {
      document.body.classList.toggle( "tabzilla-open" );
      document.body.classList.remove( "badges-open" );
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

    function checkBadges( badges ) {
      var newBadge,
          badgeLink;

      if ( badges.length > 0 ) {
        newBadge = Badges.makeBadge( badges[ 0 ], "dropdown" );
        badgeLink = Badges.badgeLink();
        badgeLink.addEventListener( "click", function(){
          document.body.classList.toggle( "badges-open" );
          butter.editor.openEditor( "share-properties" );
        }, false );
        newBadge.appendChild( badgeLink );
        _badgeCounter.querySelector( ".butter-badge" ) && _badgeCounter.removeChild( _badgeCounter.querySelector( ".butter-badge" ) ) ;
        _badgeCounter.appendChild( newBadge );
        _badgeCounter.addEventListener( "click", function(){
          newBadge.classList.toggle( "butter-badge-on" );
        }, false );
      }
    }

    function publish() {
      butter.cornfield.publish( butter.project.id, function( e ){
        if( e.error !== "okay" ){
          _userData.showErrorDialog( "There was a problem saving your project. Please try again." );
          return;
        } else {
          butter.editor.openEditor( "share-properties" );
          _previewBtn.classList.remove( "butter-hidden" );
          _previewBtn.href = e.url;
          _rootElement.querySelector( ".butter-badge-img" ).classList.add( "butter-badge-gold" );
          _badgeCounter.querySelector( ".butter-badge-number" ).innerHTML = 1;
        }
      });
    }

    function onMouseOver() {
      _projectTitle.removeEventListener( "mouseover", onMouseOver, false );
      _projectTitle.removeChild( _noProjectNameToolTip );
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

    function onBlur() {
      var node = _projectTitle.querySelector( ".butter-project-name" );

      _projectName.innerHTML = node.value || _projectTitlePlaceHolderText;
      butter.project.name = node.value;

      if ( checkProjectName() ) {
        _userData.save( publish );
      } else {
        _noProjectNameToolTip = _userData.createErrorToolTip( _projectTitle, {
          message: "Please give your project a name before saving",
          hidden: false,
          element: _projectTitle,
          top: "43px"
        }, onMouseOver );
        butter.dispatch( "projectupdated" );
      }
      _projectTitle.replaceChild( _projectName, node );
      node.removeEventListener( "blur", onBlur, false );
      _projectTitle.addEventListener( "click", projectNameClick, false );
    }

    _saveButton.addEventListener( "click", function( e ){
      if ( checkProjectName() ) {
        login( prepare );
        return;
      } else {
        _noProjectNameToolTip = _userData.createErrorToolTip( _projectTitle, {
          message: "Please give your project a name before saving",
          hidden: false,
          element: _projectTitle,
          top: "43px"
        }, onMouseOver );
      }
    }, false );

    function projectNameClick( e ) {
      var input = document.createElement( "input" );

      input.type = "text";

      input.placeholder = _projectTitlePlaceHolderText;
      input.classList.add( "butter-project-name" );
      input.value = _projectName.innerHTML !== _projectTitlePlaceHolderText ? _projectName.innerHTML : "";
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
      var downTick,
          userName;

      downTick = document.createElement( "span" );
      downTick.className = "icon icon-downtick";
      downTick.addEventListener( "click", toggleDropDown, false );

      userName = document.createElement( "span" );
      userName.innerHTML = butter.cornfield.name();
      userName.className = "butter-username";
      userName.addEventListener( "click", toggleDropDown, false );

      _rootElement.classList.add( _loginClass );
      _authButton.classList.remove( _activeClass );
      _authButton.innerHTML = "";
      _authButton.appendChild( userName );
      _authButton.appendChild( downTick );
      _authButton.appendChild( _badgeCounter );
      _authButton.removeEventListener( "click", login, false );
      _logoutBtn.addEventListener( "click", doLogout, false );

      Badges.check( checkBadges );

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
      _projectName.innerHTML = butter.project.name;
    });
    butter.listen( "ready", function() {
      if ( butter.project.name ) {
        _projectName.innerHTML = butter.project.name;
      }
    });
  };
});
