/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define([ "editor/editor", "editor/base-editor",
          "text!layouts/share-editor.html", "util/social-media", "ui/widget/tooltip" ],
  function( Editor, BaseEditor, LAYOUT_SRC, SocialMedia, ToolTip ) {

  Editor.register( "share-properties", LAYOUT_SRC, function( rootElement, butter, compiledLayout ) {
    var TOOLTIP_NAME = "name-error-share-tooltip",
        _this;

    var socialMedia = new SocialMedia(),
        editorContainer = rootElement.querySelector( ".editor-container" ),
        saveContainer = rootElement.querySelector( ".save-container" ),
        projectURL = editorContainer.querySelector( ".butter-project-url" ),
        authorInput = editorContainer.querySelector( ".butter-project-author" ),
        authorUpdateButton = editorContainer.querySelector( ".butter-project-author-update" ),
        projectEmbedURL = editorContainer.querySelector( ".butter-project-embed-url" ),
        embedSize = editorContainer.querySelector( ".butter-embed-size" ),
        previewBtn = editorContainer.querySelector( ".butter-preview-link" ),
        viewSourceBtn = editorContainer.querySelector( ".butter-view-source-link" ),
        shareTwitter = editorContainer.querySelector( ".butter-share-twitter" ),
        shareGoogle = editorContainer.querySelector( ".butter-share-google" ),
        projectNameWrapper = saveContainer.querySelector( ".butter-project-name-wrapper" ),
        projectName = projectNameWrapper.querySelector( ".butter-project-name" ),
        loginBtn = saveContainer.querySelector( ".butter-login-btn" ),
        saveBtn = saveContainer.querySelector( ".butter-save-btn" ),
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
      _this.scrollbar.update();
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

    function displaySave() {
      resetInput();
      embedSize.disabled = true;
      authorInput.disabled = true;
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

    function togglePreviewButton( on ) {
      if ( on ) {
        previewBtn.classList.remove( "butter-disabled" );
        previewBtn.href = butter.project.publishUrl;
        previewBtn.onclick = function() {
          return true;
        };
      } else {
        previewBtn.classList.add( "butter-disabled" );
        previewBtn.href = "";
        previewBtn.onclick = function() {
          return false;
        };
      }
    }

    function toggleViewSourceButton( on ) {
      if ( on ) {
        viewSourceBtn.classList.remove( "butter-disabled" );
        viewSourceBtn.href = "view-source:" + butter.project.iframeUrl;
        viewSourceBtn.onclick = function() {
          return true;
        };
      } else {
        viewSourceBtn.classList.add( "butter-disabled" );
        viewSourceBtn.href = "";
        viewSourceBtn.onclick = function() {
          return false;
        };
      }
    }

    function displayEditor() {
      if ( !butter.project.isSaved ) {
        displaySave();
        return;
      }

      var project = butter.project;

      embedSize.disabled = false;
      authorInput.disabled = false;
      saveContainer.classList.add( "hide-container" );
      editorContainer.classList.remove( "fade-container" );

      projectName.value = project.name;
      projectURL.value = project.publishUrl;
      togglePreviewButton( true );
      toggleViewSourceButton( true );

      updateEmbed( project.iframeUrl );

      // if any of the buttons haven't loaded, or if we aren't logged in
      if ( !shareTwitter.childNodes.length ||
           !shareGoogle.childNodes.length ||
           !butter.cornfield.authenticated() ) {
        socialMedia.hotLoad( shareTwitter, socialMedia.twitter, project.publishUrl );
        socialMedia.hotLoad( shareGoogle, socialMedia.google, project.publishUrl );
      }
    }

    function login() {
      if ( !butter.project.name ) {
        butter.project.name = projectName.value;
      } else {
        projectName.value = butter.project.name;
      }

      butter.cornfield.login(function() {
        if ( !butter.project.name ) {
          displaySave();
        } else {
          save();
        }
        butter.dispatch( "authenticated" );
      });
    }

    function save() {
      if ( !butter.project.name ) {
        butter.project.name = projectName.value;
      } else {
        projectName.value = butter.project.name;
      }

      butter.project.author = authorInput.value || "";
      authorUpdateButton.classList.add( "butter-disabled" );

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

      butter.project.save(function() {
        displayEditor();
      });
    }

    embedSize.addEventListener( "change", function() {
      embedDimensions = embedSize.value.split( "x" );
      embedWidth = embedDimensions[ 0 ];
      embedHeight = embedDimensions[ 1 ];
      updateEmbed( butter.project.iframeUrl );
    }, false);

    authorInput.addEventListener( "input", function( e ) {
      authorUpdateButton.classList.remove( "butter-disabled" );
    }, false );

    authorInput.addEventListener( "blur", function( e ) {
      if ( authorInput.value !== butter.project.author ) {
        save();
      }
    }, false );

    function checkProjectState() {
      if ( !butter.project.name || !butter.project.id ) {
        displaySave();
      } else {
        displayEditor();
      }
    }

    butter.listen( "logout", displayLogin );
    butter.listen( "projectupdated", login );
    butter.listen( "authenticated", checkProjectState );

    butter.listen( "projectsaved", function() {
      togglePreviewButton( true );
      toggleViewSourceButton( true );
    });
    butter.listen( "projectchanged", function() {
      togglePreviewButton( false );
      toggleViewSourceButton( false );
    });

    Editor.BaseEditor.extend( this, butter, rootElement, {
      open: function() {
        _this = this;
        if ( !butter.cornfield.authenticated() ) {
          displayLogin();
        } else {
          checkProjectState();
        }
      },
      close: function() {
      }
    });
  }, true );
});
