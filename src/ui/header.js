define( [
  "dialog/iframe-dialog",
  "text!layouts/header.html"
], function(
  IFrameDialog,
  HEADER_TEMPLATE
) {

  var DEFAULT_AUTH_BUTTON_TEXT = "Login / Sign Up",
      DEFAULT_AUTH_BUTTON_TITLE = "Login using BrowserID authentication";

  return function( butter, options ){

    options = options || {};

    var _rootElement = document.createElement( "div" ),
        _title,
        _projectsButton,
        _saveButton,
        _shareButton,
        _loginButton,
        _logoutButton;

    _rootElement.innerHTML = HEADER_TEMPLATE;
    _title = _rootElement.querySelector(".name");
    _title.innerHTML = options.value( "title" ) || "Butter";

    _rootElement.setAttribute( "data-butter-exclude", true );
    _rootElement.id = "butter-header";

    document.body.insertBefore( _rootElement, document.body.firstChild );

    _projectsButton = document.getElementById( "butter-header-projects" );
    _saveButton = document.getElementById( "butter-header-save" );
    _shareButton = document.getElementById( "butter-header-share" );
    _loginButton = document.getElementById( "butter-header-auth" );
    _logoutButton = document.getElementById( "butter-header-auth-out" );

    _saveButton.title = "Save your project";
    _shareButton.title = "Generate a link to share this project with the world";
    _logoutButton.title = "Logout";
    _loginButton.title = DEFAULT_AUTH_BUTTON_TITLE;

    document.body.classList.add( "butter-header-spacing" );

    var _oldDisplayProperty = _logoutButton.style.display;
    _logoutButton.style.display = "none";

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

    _loginButton.addEventListener( "click", authenticationRequired, false );

    _logoutButton.addEventListener( "click", function( e ){
      butter.cornfield.logout( logoutDisplay );
    });

    function showErrorDialog( message, callback ){
      var dialog = new IFrameDialog({
        type: "iframe",
        modal: true,
        url: butter.ui.dialogDir + "error-message.html",
        events: {
          open: function( e ){
            dialog.send( "message", message );
          },
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

    _projectsButton.addEventListener( "click", function() {
      window.location = "/dashboard";
    });

    _shareButton.addEventListener( "click", function( e ){
      function publish(){
        butter.cornfield.publish( butter.project.id, function( e ){
          if( e.error !== "okay" ){
            showErrorDialog( "There was a problem saving your project. Please try again." );
            return;
          }
          else{
            var url = e.url;
            var dialog = new IFrameDialog({
              type: "iframe",
              modal: true,
              url: butter.ui.dialogDir + "share.html",
              events: {
                open: function( e ){
                  dialog.send( "url", url );
                },
                cancel: function( e ){
                  dialog.close();
                }
              }
            });
            dialog.open();
          }
        });
      }

      function prepare(){
        if( butter.project.id ){
          publish();
        }
        else{
          doSave( publish );
        }
      }

      authenticationRequired( prepare );
    }, false );

    function doSave( callback ){

      function execute(){
        butter.project.html = butter.getHTML();
        butter.project.data = butter.exportProject();
        var saveString = JSON.stringify( butter.project );
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
        });
      }

      if( !butter.project.name ){
        var dialog = new IFrameDialog({
          type: "iframe",
          modal: true,
          url: butter.ui.dialogDir + "save-as.html",
          events: {
            open: function( e ){
              dialog.send( "name", null );
            },
            submit: function( e ){
              butter.project.name = e.data;
              dialog.close();
              execute();
            },
            cancel: function( e ){
              dialog.close();
            }
          }
        });
        dialog.open();
      }
      else{
        execute();
      }
    }

    _saveButton.addEventListener( "click", function( e ){
      authenticationRequired( doSave );
    }, false );

    function loginDisplay() {
      _loginButton.innerHTML = butter.cornfield.email();
      _loginButton.title = "This is you!";
      _loginButton.disabled = true;
      _logoutButton.style.display = _oldDisplayProperty;
    }

    function logoutDisplay() {
      _logoutButton.style.display = "none";
      _loginButton.innerHTML = DEFAULT_AUTH_BUTTON_TEXT;
      _loginButton.disabled = false;
      _loginButton.title = DEFAULT_AUTH_BUTTON_TITLE;
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

    function setup(){
      _rootElement.style.width = window.innerWidth + "px";
    }

    window.addEventListener( "resize", setup, false );
    setup();

  };

});
