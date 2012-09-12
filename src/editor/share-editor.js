/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define([ "editor/editor", "editor/base-editor", "ui/user-data",
          "text!layouts/share-editor.html", "util/social-media", "ui/widget/tooltip" ],
  function( Editor, BaseEditor, UserData, LAYOUT_SRC, SocialMedia, ToolTip ) {

  Editor.register( "share-properties", LAYOUT_SRC, function( rootElement, butter, compiledLayout ) {
    var TOOLTIP_NAME = "name-error-share-tooltip";

    var socialMedia = new SocialMedia(),
        editorContainer = rootElement.querySelector( ".editor-container" ),
        saveContainer = rootElement.querySelector( ".save-container" ),
        projectURL = editorContainer.querySelector( ".butter-project-url" ),
        authorInput = editorContainer.querySelector( ".butter-project-author" ),
        authorUpdateButton = editorContainer.querySelector( ".butter-project-author-update" ),
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

    authorInput.value = butter.project.author ? butter.project.author : "";

    function destroyToolTip() {
      if ( tooltip && !tooltip.destroyed ) {
        projectNameWrapper.removeEventListener( "mouseover", destroyToolTip, false );
        tooltip.destroy();
      }
    }

    function fadeEditorContainer() {
      editorContainer.classList.add( "fade-container" );
      saveContainer.classList.remove( "hide-container" );
    }

    function displayLogin() {
      resetInput();
      embedSize.disabled = true;
      authorInput.disabled = true;
      saveBtn.removeEventListener( "click", save, false );
      saveBtn.classList.add( "hide-container" );
      saveContainer.classList.remove( "butter-login-true" );
      loginBtn.classList.remove( "hide-container" );
      loginBtn.addEventListener( "click", login, false );
    }

    function resetInput() {
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
      authorInput.disabled = true;
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

      if ( !butter.project.id ) {
        displaySave();
        return;
      }

      embedSize.disabled = false;
      authorInput.disabled = false;
      saveContainer.classList.add( "hide-container" );
      editorContainer.classList.remove( "fade-container" );
      projectName.value = "";

      butter.cornfield.publish( butter.project.id, function( e ) {
        var headerPreviewBtn = document.querySelector( ".butter-header .butter-preview-btn" ),
            url = e.url;

        if ( e.error !== "okay" ) {
          userData.showErrorDialog( "There was a problem saving your project. Please try again." );
          return;
        }

        projectURL.value = url;
        previewBtn.href = url;
        headerPreviewBtn.classList.remove( "butter-hidden" );
        headerPreviewBtn.href = url;

        updateEmbed( projectURL.value.replace( "/v/", "/e/" ) );
        // if any of the buttons haven't loaded, or if we aren't logged in
        if ( !shareFacebook.childNodes.length || !shareTwitter.childNodes.length ||
             !shareGoogle.childNodes.length || !butter.cornfield.authenticated() ) {
          socialMedia.hotLoad( shareFacebook, socialMedia.facebook, url );
          socialMedia.hotLoad( shareTwitter, socialMedia.twitter, url );
          socialMedia.hotLoad( shareGoogle, socialMedia.google, url );
        }
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

      butter.project.author = authorInput.value || "";
      authorUpdateButton.classList.add( "disabled" );

      if ( !butter.project.name ) {

        destroyToolTip();

        projectNameWrapper.addEventListener( "mouseover", destroyToolTip, false );

        ToolTip.create({
          name: TOOLTIP_NAME,
          message: "Please give your project a name before saving",
          hidden: false,
          element: projectNameWrapper,
          top: "33px",
          error: true
        });

        tooltip = ToolTip.get( TOOLTIP_NAME );
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

    authorInput.addEventListener( "input", function( e ) {
      authorUpdateButton.classList.remove( "disabled" );
    }, false );

    authorInput.addEventListener( "blur", function( e ) {
      if ( authorInput.value !== butter.project.author ) {
        save();
      }
    }, false );

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

    Editor.BaseEditor.extend( this, butter, rootElement, {
      open: function() {
        if ( !butter.cornfield.authenticated() ) {
          displayLogin();
        } else if ( !butter.project.name || !butter.project.id ) {
          displaySave();
        } else {
          displayEditor();
        }
      },
      close: function() {
      }
    });
  }, true );
});
