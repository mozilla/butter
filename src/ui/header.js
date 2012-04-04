define( [ "dialog/iframe-dialog" ], function( IFrameDialog ){
  
  var DEFAULT_AUTH_BUTTON_TEXT = "Login / Sign Up";

  return function( butter, options ){

    options = options || {};

    var _rootElement = document.createElement( "div" ),
        _newButton,
        _saveButton,
        _loadButton,
        _shareButton,
        _authButton,
        _logoutButton;

    var title = options.title || "Butter";

    _rootElement.innerHTML = '' +
      '<div class="logo-drop"></div><h1>' + title + '</h1>' +
      '<div class="editor-actions">' +
      '    <button id="butter-header-new">New</button>' +
      '    <button id="butter-header-save">Save</button>' +
      '    <button id="butter-header-load">Load</button>' +
      '    <button id="butter-header-share">Share</button>' +
      '    <button id="butter-header-auth">' + DEFAULT_AUTH_BUTTON_TEXT + '</button>' + 
      '    <button id="butter-header-auth-out">Logout</button>' +
      '</div>';

    _rootElement.setAttribute( "data-butter-exclude", true );
    _rootElement.id = "butter-header";

    document.body.insertBefore( _rootElement, document.body.firstChild );

    _newButton = document.getElementById( "butter-header-new" );
    _saveButton = document.getElementById( "butter-header-save" );
    _loadButton = document.getElementById( "butter-header-load" );
    _shareButton = document.getElementById( "butter-header-share" );
    _authButton = document.getElementById( "butter-header-auth" );
    _logoutButton = document.getElementById( "butter-header-auth-out" );

    var _oldDisplayProperty = _logoutButton.style.display;
    _logoutButton.style.display = "none";

    function doAuth( successCallback, errorCallback ){
      butter.cornfield.login(function( response ){
        if( response.status === "okay" ){
          var email = response.email;
          butter.cornfield.list(function( listResponse ) {
            _authButton.innerHTML = email;
            _logoutButton.style.display = _oldDisplayProperty;
            if( successCallback ){
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

    _newButton.addEventListener( "click", function( e ){
      var dialog = new IFrameDialog({
        type: "iframe",
        modal: true,
        url: "../dialogs/quit-confirmation.html",
        events: {
          submit: function( e ){
            dialog.close();
            window.location.reload();
          },
          cancel: function( e ){
            dialog.close();
          }
        }
      });
      dialog.open();
    }, false );

    _authButton.addEventListener( "click", function( e ){
      if( !butter.cornfield.user() ){
        doAuth();
      }
    }, false );

    _logoutButton.addEventListener( "click", function( e ){
      if( butter.cornfield.user() ){
        butter.cornfield.logout(function( response ){
          _logoutButton.style.display = "none";
          _authButton.innerHTML = DEFAULT_AUTH_BUTTON_TEXT;
        });
      }
    });

    function showErrorDialog( message, callback ){
      var dialog = new IFrameDialog({
        type: "iframe",
        modal: true,
        url: "../dialogs/error-message.html",
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

    _shareButton.addEventListener( "click", function( e ){
      function prepare(){

      }

      if( !butter.cornfield.user() ){
        doAuth( prepare );
      }
      else{
        prepare();
      }
    }, false );

    _saveButton.addEventListener( "click", function( e ){

      function doSave(){
        butter.project.html = butter.getHTML();
        butter.project.data = butter.exportProject();
        var saveString = JSON.stringify( butter.project );
        butter.ui.loadIndicator.start();
        butter.cornfield.saveas( butter.project._id, saveString, function( e ){
          butter.ui.loadIndicator.stop();
          if( e.error !== "okay" || !e.project || !e.project._id ){
            showErrorDialog( "There was a problem saving your project. Please try again." );
            return;
          }
          butter.project.id = e.project._id;
        });
      }

      function prepare() {
        if( !butter.project.name ){
          var dialog = new IFrameDialog({
            type: "iframe",
            modal: true,
            url: "../dialogs/save-as.html",
            events: {
              open: function( e ){
                dialog.send( "name", null );
              },
              submit: function( e ){
                butter.project.name = e.data;
                dialog.close();
                doSave();
              },
              cancel: function( e ){
                dialog.close();
              }
            }
          });
          dialog.open();
        }
        else{
          doSave();
        }
      }

      if( !butter.cornfield.user() ){
        doAuth( prepare );
      }
      else{
        prepare();
      }
    }, false );

    _loadButton.addEventListener( "click", function( e ){
      function prepare(){
        butter.cornfield.list(function( listResponse ) {
          if( listResponse.error !== "okay" ){
            showErrorDialog( "There was an error loading your projects. Please try again." );
            return;
          }
          else{
            var dialog = new IFrameDialog({
              type: "iframe",
              modal: true,
              url: "../dialogs/load-project.html",
              events: {
                open: function( e ){
                  dialog.send( "list", listResponse.projects );
                },
                submit: function( e ){
                  dialog.close();
                  butter.cornfield.load( e.data, function( e ){
                    if( e.error === "okay" ){
                      var projectData;
                      try{
                        projectData = JSON.parse( e.project );
                      }
                      catch( e ){
                        showErrorDialog( "Your project could not be loaded. Please try another." );
                        return;
                      }
                      butter.clearProject();
                      butter.importProject( projectData );
                    }
                    else{
                      showErrorDialog( "Your project could not be loaded. Please try another." );
                    }
                  });
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

      if( !butter.cornfield.user() ){
        doAuth( prepare );
      }
      else{
        prepare();
      }
    }, false );

    function setup(){
      _rootElement.style.width = window.innerWidth + "px";
    }

    window.addEventListener( "resize", setup, false );
    setup();

  };

});