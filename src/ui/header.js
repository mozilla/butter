define( [ "dialog/dialog", "util/lang", "text!layouts/header.html", "ui/widget/tooltip" ],
  function( Dialog, Lang, HEADER_TEMPLATE, ToolTip ){

  var DEFAULT_AUTH_BUTTON_TEXT = "<span class='icon-user'></span> Sign In / Sign Up",
      DEFAULT_AUTH_BUTTON_TITLE = "Sign in or sign up with Persona";

  return function( butter, options ){

    options = options || {};

    var _this = this,
        _rootElement = Lang.domFragment( HEADER_TEMPLATE, ".butter-header" ),
        _saveButton = _rootElement.querySelector( ".butter-save-btn" ),
        _buttonGroup = _rootElement.querySelector( ".butter-login-project-info"),
        _authButton = _rootElement.querySelector( ".butter-login-btn" ),
        _projectTitle = _rootElement.querySelector( ".butter-project-title" ),
        _projectName = _projectTitle.querySelector( ".butter-project-name" ),
        _loginClass = "butter-login-true",
        _activeClass = "btn-green",
        _noProjectNameToolTip,
        _projectTitlePlaceHolderText = _projectName.innerHTML;

    // create a tooltip for the projectName element
    ToolTip.create({
      element: _projectTitle,
      top: "43px"
    });

    _this.element = _rootElement;
    ToolTip.apply( _projectTitle );

    function authenticationRequired( successCallback, errorCallback ){
      if ( butter.cornfield.authenticated() && successCallback && typeof successCallback === "function" ) {
        successCallback();
        return;
      }

      butter.cornfield.login(function( response ){
        if ( !response.error ) {
          butter.cornfield.list(function( listResponse ) {
            loginDisplay();
            if ( successCallback && typeof successCallback === "function" ) {
              successCallback();
            }
          });
        }
        else{
          showErrorDialog( "There was an error logging in. Please try again." );
          if( errorCallback ){
            errorCallback();
          }
        }
      });
    }

    _authButton.addEventListener( "click", authenticationRequired, false );

    function showErrorDialog( message, callback ){
      var dialog = Dialog.spawn( "error-message", {
        data: message,
        events: {
          cancel: function( e ){
            dialog.close();
            if( callback ){
              callback();
            }
          }
        }
      });
      dialog.open();
    }

    function doSave( callback ){

      function execute(){
        butter.project.data = butter.exportProject();
        var saveString = JSON.stringify( butter.project, null, 4 );
        butter.ui.loadIndicator.start();
        butter.cornfield.save( butter.project.id, saveString, function( e ){
          butter.ui.loadIndicator.stop();
          if( e.error !== "okay" || !e.project || !e.project._id ){
            showErrorDialog( "There was a problem saving your project. Please try again." );
            return;
          }
          butter.project.id = e.project._id;
          if( callback ){
            callback();
          }
          butter.dispatch( "projectsaved" );
        });
      }

      if( !butter.project.name ){
        var dialog = Dialog.spawn( "save-as", {
          events: {
            submit: function( e ){
              butter.project.name = e.data;
              dialog.close();
              execute();
            }
          }
        });
        dialog.open();
      }
      else{
        execute();
      }
    }

    function publish(){
      butter.cornfield.publish( butter.project.id, function( e ){
        if( e.error !== "okay" ){
          showErrorDialog( "There was a problem saving your project. Please try again." );
          return;
        }
        else{
          var url = e.url;
          Dialog.spawn( "share", {
            data: url
          }).open();
        }
      });
    }

    function prepare() {
      doSave( publish );
    }

    function onMouseOver() {
      _projectTitle.removeEventListener( "mouseover", onMouseOver, false );
      _projectTitle.removeChild( _noProjectNameToolTip );
    }

    function createErrorToolTip() {
      _projectTitle.removeEventListener( "mouseover", onMouseOver, false );

      if ( _projectTitle.querySelector( ".tooltip-error" ) ) {
        _projectTitle.removeChild( _noProjectNameToolTip );
      }

      if ( butter.project.name && butter.project.name !== _projectTitlePlaceHolderText ) {
        return;
      }

      _noProjectNameToolTip = ToolTip.create({
        message: "Please give your project a name before saving",
        hidden: false,
        element: _projectTitle,
        top: "43px"
      });

      _noProjectNameToolTip.classList.add( "tooltip-error" );
      _projectTitle.addEventListener( "mouseover", onMouseOver, false );
      return true;
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

    function onBlur() {
      var node = _projectTitle.querySelector( ".butter-project-name" );

      _projectName.innerHTML = node.value || _projectTitlePlaceHolderText;
      butter.project.name = node.value;

      createErrorToolTip();
      _projectTitle.replaceChild( _projectName, node );
      node.removeEventListener( "blur", onBlur, false );
      _projectTitle.addEventListener( "click", projectNameClick, false );
    }

    _saveButton.addEventListener( "click", function( e ){
      if ( createErrorToolTip() ) {
        return;
      }
      authenticationRequired( prepare );
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

    _projectTitle.addEventListener( "click", projectNameClick, false );


    function doLogout() {
      butter.cornfield.logout( logoutDisplay );
    }

    function loginDisplay() {
      _buttonGroup.classList.add( "btn-group" );
      _rootElement.classList.add( _loginClass );
      _authButton.classList.remove( _activeClass );
      _authButton.removeEventListener( "click", authenticationRequired, false );
      _authButton.innerHTML = "<span class='icon icon-user'></span> " + butter.cornfield.name();
      _authButton.title = "This is you!";
      _authButton.addEventListener( "click", doLogout, false );
    }

    function logoutDisplay() {
      _rootElement.classList.remove( _loginClass );
      _buttonGroup.classList.remove( "btn-group" );
      _authButton.classList.add( _activeClass );
      _authButton.removeEventListener( "click", doLogout, false );
      _authButton.innerHTML = DEFAULT_AUTH_BUTTON_TEXT;
      _authButton.title = DEFAULT_AUTH_BUTTON_TITLE;
      _authButton.addEventListener( "click", authenticationRequired, false );
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

  };

});
