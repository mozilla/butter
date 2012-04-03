define( [ "dialog/iframe-dialog" ], function( IFrameDialog ){
  
  return function( butter, options ){

    options = options || {};

    var _rootElement = document.createElement( "header" );

    _rootElement.id = "butter-header";

    var title = options.title || "Butter";

    _rootElement.innerHTML = '' +
      '<div class="logo-drop"></div><h1>' + title + '</h1>' +
      '<div class="editor-actions">' +
      '    <button id="butter-header-new">New</button>' +
      '    <button id="butter-header-save">Save</button>' +
      '    <button id="butter-header-load">Load</button>' +
      '    <button id="butter-header-share">Share</button>' +
      '    <button id="butter-header-auth">Login</button> |' + 
      '    <button id="butter-header-auth-out">Logout</button>' +
      '</div>';

    _rootElement.setAttribute( "data-butter-exclude", true );

    document.body.insertBefore( _rootElement, document.body.firstChild );

    var newButton = document.getElementById( "butter-header-new" ),
        saveButton = document.getElementById( "butter-header-save" ),
        loadButton = document.getElementById( "butter-header-load" ),
        shareButton = document.getElementById( "butter-header-share" ),
        authButton = document.getElementById( "butter-header-auth" ),
        logoutButton = document.getElementById( "butter-header-auth-out" );

    var oldDisplayProperty = saveButton.style.display;

    newButton.addEventListener( "click", function( e ){
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

    authButton.addEventListener( "click", function( e ){
      if( !butter.cornfield.user() ){
        butter.cornfield.login(function( response ){
          if( response.status === "okay" ){
            var email = response.email;
            butter.cornfield.list(function( listResponse ) {
              authButton.innerHTML = email;
              saveButton.style.display = oldDisplayProperty;
              loadButton.style.display = oldDisplayProperty;
              shareButton.style.display = oldDisplayProperty;
            });
          }
          else{
            showErrorDialog( "There was an error logging in. Please try again." );
          }
        });
      }
    }, false );

    logoutButton.addEventListener( "click", function( e ){
      if( butter.cornfield.user() ){
        butter.cornfield.logout(function( response ){
          authButton.innerHTML = "Login";
          saveButton.style.display = "none";
          loadButton.style.display = "none";
          shareButton.style.display = "none";
        });
      }
    });

    saveButton.style.display = "none";
    loadButton.style.display = "none";
    shareButton.style.display = "none";

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

    saveButton.addEventListener( "click", function( e ){

      function doSave(){
        butter.project.html = butter.getHTML();
        butter.project.data = butter.exportProject();
        var saveString = JSON.stringify( butter.project );
        butter.cornfield.saveas( butter.project._id, saveString, function( e ){
          if( e.error !== "okay" || !e.project || !e.project._id ){
            showErrorDialog( "There was a problem saving your project. Please try again." );
            return;
          }
          butter.project.id = e.project._id;
        });
      }

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
    }, false );

    loadButton.addEventListener( "click", function( e ){
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
    }, false );

    function setup(){
      _rootElement.style.width = window.innerWidth + "px";
    }

    window.addEventListener( "resize", setup, false );
    setup();

  };

});