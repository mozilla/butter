/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define([ "editor/editor", "editor/base-editor",
          "text!layouts/share-editor.html", "util/social-media", "ui/widget/textbox" ],
  function( Editor, BaseEditor, LAYOUT_SRC, SocialMedia, TextboxWrapper ) {

  Editor.register( "share-properties", LAYOUT_SRC, function( rootElement, butter ) {
    var socialMedia = new SocialMedia(),
        editorContainer = rootElement.querySelector( ".editor-container" ),
        projectURL = editorContainer.querySelector( ".butter-project-url" ),
        authorInput = editorContainer.querySelector( ".butter-project-author" ),
        projectEmbedURL = editorContainer.querySelector( ".butter-project-embed-url" ),
        embedSize = editorContainer.querySelector( ".butter-embed-size" ),
        previewBtn = editorContainer.querySelector( ".butter-preview-link" ),
        viewSourceBtn = editorContainer.querySelector( ".butter-view-source-link" ),
        shareTwitter = editorContainer.querySelector( ".butter-share-twitter" ),
        shareGoogle = editorContainer.querySelector( ".butter-share-google" ),
        embedDimensions = embedSize.value.split( "x" ),
        embedWidth = embedDimensions[ 0 ],
        embedHeight = embedDimensions[ 1 ];

    authorInput.value = butter.project.author ? butter.project.author : "";

    function updateEmbed( url ) {
      projectEmbedURL.value = "<iframe src='" + url + "' width='" + embedWidth + "' height='" + embedHeight + "'" +
      " frameborder='0' mozallowfullscreen webkitallowfullscreen allowfullscreen></iframe>";
    }

    function togglePreviewButton( on ) {
      if ( on ) {
        previewBtn.classList.remove( "butter-disabled" );
        previewBtn.href = butter.project.previewUrl;
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

    function displayEditor( on ) {
      var project = butter.project;

      if ( project.id ) {
        embedSize.disabled = !on;
        authorInput.disabled = !on;

        if ( on ) {
          editorContainer.classList.remove( "fade-container" );

          projectURL.value = project.publishUrl;
          togglePreviewButton( on );
          toggleViewSourceButton( on );

          updateEmbed( project.iframeUrl );

          // if any of the buttons haven't loaded, or if we aren't logged in
          if ( !shareTwitter.childNodes.length ||
               !shareGoogle.childNodes.length ) {
            socialMedia.hotLoad( shareTwitter, socialMedia.twitter, project.publishUrl );
            socialMedia.hotLoad( shareGoogle, socialMedia.google, project.publishUrl );
          }
        } else {
          editorContainer.classList.add( "fade-container" );
        }
      } else {
        togglePreviewButton( false );
        toggleViewSourceButton( false );
      }
    }

    embedSize.addEventListener( "change", function() {
      embedDimensions = embedSize.value.split( "x" );
      embedWidth = embedDimensions[ 0 ];
      embedHeight = embedDimensions[ 1 ];
      updateEmbed( butter.project.iframeUrl );
    }, false);

    authorInput.addEventListener( "blur", function() {
      if ( authorInput.value !== butter.project.author ) {
        butter.project.author = authorInput.value;
      }
    }, false );

    butter.listen( "logout", function onLogout() {
      displayEditor( false );
      togglePreviewButton( false );
      toggleViewSourceButton( false );
    });

    butter.listen( "authenticated", function onAuthenticated() {
      displayEditor( true );
    });

    butter.listen( "projectsaved", function onSaved() {
      togglePreviewButton( true );
      toggleViewSourceButton( true );
    });

    butter.listen( "projectchanged", function onChanged() {
      togglePreviewButton( false );
      toggleViewSourceButton( false );
    });

    TextboxWrapper.applyTo( projectURL, { readOnly: true } );
    TextboxWrapper.applyTo( projectEmbedURL, { readOnly: true } );
    TextboxWrapper.applyTo( authorInput );

    Editor.BaseEditor.extend( this, butter, rootElement, {
      open: function() {
        displayEditor( butter.cornfield.authenticated() );
      },
      close: function() {
      }
    });
  }, true );
});
