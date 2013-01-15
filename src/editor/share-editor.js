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

    embedSize.addEventListener( "change", function() {
      embedDimensions = embedSize.value.split( "x" );
      embedWidth = embedDimensions[ 0 ];
      embedHeight = embedDimensions[ 1 ];
      updateEmbed( butter.project.iframeUrl );
    }, false);

    authorInput.addEventListener( "blur", function() {
      if ( authorInput.value !== butter.project.author ) {
        butter.project.author = authorInput.value;
        butter.project.save(function() {
          butter.editor.openEditor( "share-properties" );
        });
      }
    }, false );

    TextboxWrapper.applyTo( projectURL, { readOnly: true } );
    TextboxWrapper.applyTo( projectEmbedURL, { readOnly: true } );
    TextboxWrapper.applyTo( authorInput );

    Editor.BaseEditor.extend( this, butter, rootElement, {
      open: function() {
        var project = butter.project;

        projectURL.value = project.publishUrl;

        previewBtn.href = butter.project.previewUrl;
        previewBtn.onclick = function() {
          return true;
        };

        viewSourceBtn.href = "view-source:" + butter.project.iframeUrl;
        viewSourceBtn.onclick = function() {
          return true;
        };
        updateEmbed( project.iframeUrl );

        // if any of the buttons haven't loaded
        if ( !shareTwitter.childNodes.length ||
             !shareGoogle.childNodes.length ) {
          socialMedia.hotLoad( shareTwitter, socialMedia.twitter, project.publishUrl );
          socialMedia.hotLoad( shareGoogle, socialMedia.google, project.publishUrl );
        }
      },
      close: function() {
      }
    });
  }, true );
});
