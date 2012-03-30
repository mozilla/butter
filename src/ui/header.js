define( [ "dialog/iframe-dialog" ], function( IFrameDialog ){
  
  return function( butter ){

    var _rootElement = document.createElement( "header" );

    _rootElement.id = "butter-header";

    _rootElement.innerHTML = '\
      <div class="drop"></div><h1>Popcorn Maker</h1>\
      <div class="editor-actions">\
          <button id="new">New</button>\
          <button id="save">Save</button>\
          <button id="load">Load</button>\
          <button id="share">Share</button>\
          <button id="auth">Login</button> |\
          <button id="auth-out">Logout</button>\
      </div>\
    ';

    _rootElement.setAttribute( "data-butter-exclude", true );

    document.body.insertBefore( _rootElement, document.body.firstChild );

    var newButton = _rootElement.querySelectorAll( "#new" )[ 0 ],
        saveButton = _rootElement.querySelectorAll( "#save" )[ 0 ],
        loadButton = _rootElement.querySelectorAll( "#load" )[ 0 ],
        shareButton = _rootElement.querySelectorAll( "#share" )[ 0 ],
        authButton = _rootElement.querySelectorAll( "#auth" )[ 0 ],
        logoutButton = _rootElement.querySelectorAll( "#auth-out" )[ 0 ];

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
            authButton.innerHTML = response.email;
            saveButton.style.display = oldDisplayProperty;
            loadButton.style.display = oldDisplayProperty;
            shareButton.style.display = oldDisplayProperty;
          }
          else{
            var dialog = new IFrameDialog({
              type: "iframe",
              modal: true,
              url: "../dialogs/login-error.html",
              events: {
                cancel: function( e ){
                  dialog.close();
                }
              }
            });
            dialog.open();
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

    saveButton.addEventListener( "click", function( e ){
      function doSave(){
        butter.cornfield.push( butter.project.name, butter.exportProject, function( e ){
          console.log( e );
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

    function setup(){
      _rootElement.style.width = window.innerWidth + "px";
    }

    window.addEventListener( "resize", setup, false );
    setup();

  };

});