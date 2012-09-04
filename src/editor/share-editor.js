/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define([ "editor/editor", "editor/base-editor", "ui/user-data",
          "text!layouts/share-editor.html", "util/social-media" ],
  function( Editor, BaseEditor, UserData, LAYOUT_SRC, SocialMedia ) {

  Editor.register( "share-properties", LAYOUT_SRC, function( rootElement, butter, compiledLayout ) {
    var socialMedia = SocialMedia(),
        editorContainer = rootElement.querySelector( ".editor-container" ),
        saveContainer = rootElement.querySelector( ".save-container" ),
        projectURL = editorContainer.querySelector( ".butter-project-url" ),
        projectEmbedURL = editorContainer.querySelector( ".butter-project-embed-url" ),
        embedSize = editorContainer.querySelector( ".butter-embed-size" ),
        previewBtn = editorContainer.querySelector( ".butter-preview-link" ),
        shareFacebook = editorContainer.querySelector( ".butter-share-facebook" ),
        shareTwitter = editorContainer.querySelector( ".butter-share-twitter" ),
        shareGoogle = editorContainer.querySelector( ".butter-share-google" ),
        projectNameWrapper = saveContainer.querySelector( ".butter-project-name-wrapper" ),
        projectName = projectNameWrapper.querySelector( ".butter-project-name" ),
        loginBtn = saveContainer.querySelector( ".butter-login-btn" ),
        saveBtn = saveContainer.querySelector( ".butter-save-btn" ),
        userData = new UserData( butter ),
        embedDimensions = embedSize.value.split( "x" ),
        embedWidth = embedDimensions[ 0 ],
        embedHeight = embedDimensions[ 1 ],
        tooltip;

    function onMouseOver() {
      projectNameWrapper.removeEventListener( "mouseover", onMouseOver, false );
      if ( tooltip ) {
        projectNameWrapper.removeChild( tooltip );
      }
    }

    function fadeEditorContainer() {
      editorContainer.classList.add( "fade-container" );
      saveContainer.classList.remove( "hide-container" );
    }

    function displayLogin() {
      resetInput();
      embedSize.disabled = true;
      saveBtn.removeEventListener( "click", save, false );
      saveBtn.classList.add( "hide-container" );
      saveContainer.classList.remove( "butter-login-true" );
      loginBtn.classList.remove( "hide-container" );
      loginBtn.addEventListener( "click", login, false );
    }

    function resetInput() {
      shareFacebook.innerHTML = "";
      shareTwitter.innerHTML = "";
      shareGoogle.innerHTML = "";
      projectURL.value = "";
      projectEmbedURL.value = "";
      fadeEditorContainer();
    }

    function projectSaved( e ) {
      if ( e.data ) {
        return;
      }
      userData.save(function() {
        butter.unlisten( "projectsaved", projectSaved );
        displayEditor();
      });
    }

    function displaySave() {
      resetInput();
      embedSize.disabled = true;
      butter.listen( "projectsaved", projectSaved );
      loginBtn.classList.add( "hide-container" );
      loginBtn.removeEventListener( "click", login, false );
      saveBtn.classList.remove( "hide-container" );
      saveContainer.classList.add( "butter-login-true" );
      saveBtn.addEventListener( "click", save, false );
    }

    function updateEmbed( url ) {
      projectEmbedURL.value = "<iframe src='" + url + "' width='" + embedWidth + "' height='" + embedHeight + "'" +
      " frameborder='0' mozallowfullscreen webkitallowfullscreen allowfullscreen></iframe>";
    }

    function displayEditor() {

      if ( !butter.cornfield.authenticated() ) {
        displayLogin();
        return;
      }

      embedSize.disabled = false;
      saveContainer.classList.add( "hide-container" );
      editorContainer.classList.remove( "fade-container" );
      projectName.value = "";

      butter.cornfield.publish( butter.project.id, function( e ) {
        if ( e.error !== "okay" ) {
          userData.showErrorDialog( "There was a problem saving your project. Please try again." );
          return;
        }
        projectURL.value = e.url;
        previewBtn.href = e.url;
        updateEmbed( projectURL.value.replace( "/v/", "/e/" ) );
        socialMedia.hotLoad( shareFacebook, socialMedia.facebook, e.url );
        socialMedia.hotLoad( shareTwitter, socialMedia.twitter, e.url );
        socialMedia.hotLoad( shareGoogle, socialMedia.google, e.url );
      });
    }

    function login() {
      if ( !butter.project.name ) {
        butter.project.name = projectName.value;
      } else {
        projectName.value = butter.project.name;
      }
      var doNotUpdate = true;

      userData.authenticationRequired(function() {
        if ( !butter.project.name ) {
          displaySave();
          doNotUpdate = false;
        } else {
          save();
        }
        butter.dispatch( "authenticated", doNotUpdate );
      });
    }

    function save() {
      if ( !butter.project.name ) {
        butter.project.name = projectName.value;
      } else {
        projectName.value = butter.project.name;
      }

      if ( !butter.project.name ) {
        tooltip = userData.createErrorToolTip( projectNameWrapper, {
          message: "Please give your project a name before saving",
          hidden: false,
          element: projectNameWrapper,
          top: "33px"
        }, onMouseOver );
        return;
      }

      butter.dispatch( "projectsaved", true );
      userData.save(function() {
        displayEditor();
      }, null );
    }

    embedSize.addEventListener( "change", function() {
      embedDimensions = embedSize.value.split( "x" );
      embedWidth = embedDimensions[ 0 ];
      embedHeight = embedDimensions[ 1 ];
      updateEmbed( projectURL.value.replace( "/v/", "/e/" ) );
    }, false);

    butter.listen( "authenticated", function( e ) {
      if ( e.data ) {
        return;
      }
      if ( !butter.project.name ) {
        displaySave();
      } else {
        save();
      }
    });
    butter.listen( "logout", displayLogin );
    butter.listen( "projectupdated", login );

    Editor.BaseEditor( this, butter, rootElement, {
      open: function() {
        if ( !butter.cornfield.authenticated() ) {
          displayLogin();
        } else if ( !butter.project.name ) {
          displaySave();
        } else {
          displayEditor();
        }
      },
      close: function() {
      }
    });
  });
});
