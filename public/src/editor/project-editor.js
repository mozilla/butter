/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define([ "editor/editor", "editor/base-editor",
          "text!layouts/project-editor.html",
          "util/social-media", "ui/widget/textbox",
          "ui/widget/tooltip" ],
  function( Editor, BaseEditor, LAYOUT_SRC, SocialMedia, TextboxWrapper, ToolTip ) {

  Editor.register( "project-editor", LAYOUT_SRC, function( rootElement, butter ) {
    var _rootElement = rootElement,
        _socialMedia = new SocialMedia(),
        _projectURL = _rootElement.querySelector( ".butter-project-url" ),
        _authorInput = _rootElement.querySelector( ".butter-project-author" ),
        _descriptionInput = _rootElement.querySelector( ".butter-project-description" ),
        _dropArea = _rootElement.querySelector( ".image-droparea" ),
        _thumbnailInput = _rootElement.querySelector( ".butter-project-thumbnail" ),
        _projectEmbedURL = _rootElement.querySelector( ".butter-project-embed-url" ),
        _embedSize = _rootElement.querySelector( ".butter-embed-size" ),
        _previewBtn = _rootElement.querySelector( ".butter-preview-link" ),
        _viewSourceBtn = _rootElement.querySelector( ".butter-view-source-btn" ),
        _shareTwitter = _rootElement.querySelector( ".butter-share-twitter" ),
        _shareGoogle = _rootElement.querySelector( ".butter-share-google" ),
        _embedDimensions = _embedSize.value.split( "x" ),
        _embedWidth = _embedDimensions[ 0 ],
        _embedHeight = _embedDimensions[ 1 ],
        _projectTabs = _rootElement.querySelectorAll( ".project-tab" ),
        _this = this,
        _numProjectTabs = _projectTabs.length,
        _descriptionToolTip,
        _descriptionTimeout,
        _project,
        _projectTab,
        _idx;

    _authorInput.value = butter.project.author ? butter.project.author : "";
    _descriptionInput.value = butter.project.description ? butter.project.description : "";

    ToolTip.create({
      name: "description-tooltip",
      element: _descriptionInput.parentNode,
      message: "Your description will show up when shared on social media!",
      top: "100%",
      left: "50%",
      error: true,
      hidden: true,
      hover: false
    });

    _descriptionToolTip = ToolTip.get( "description-tooltip" );

    function checkDescription() {
      if ( _descriptionInput.value ) {
        if ( _descriptionTimeout ) {
          clearTimeout( _descriptionTimeout );
          _descriptionToolTip.hidden = true;
        }
        return;
      }
      _descriptionToolTip.hidden = false;

      _descriptionTimeout = setTimeout(function() {
        _descriptionToolTip.hidden = true;
      }, 5000 );
    }

    function onProjectTabClick( e ) {
      var target = e.target,
          currentDataName = target.getAttribute( "data-tab-name" ),
          dataName;

      for ( var i = 0; i < _numProjectTabs; i++ ) {
        dataName = _projectTabs[ i ].getAttribute( "data-tab-name" );

        if ( dataName === currentDataName ) {
          _rootElement.querySelector( "." + dataName + "-container" ).classList.remove( "display-off" );
          target.classList.add( "butter-active" );
        } else {
          _rootElement.querySelector( "." + dataName + "-container" ).classList.add( "display-off" );
          _projectTabs[ i ].classList.remove( "butter-active" );
        }

      }

      _this.scrollbar.update();
    }

    for ( _idx = 0; _idx < _numProjectTabs; _idx++ ) {
      _projectTab = _projectTabs[ _idx ];
      _projectTab.addEventListener( "click", onProjectTabClick, false );
    }

    function updateEmbed( url ) {
      _projectEmbedURL.value = "<iframe src='" + url + "' width='" + _embedWidth + "' height='" + _embedHeight + "'" +
      " frameborder='0' mozallowfullscreen webkitallowfullscreen allowfullscreen></iframe>";
    }

    _embedSize.addEventListener( "change", function() {
      _embedDimensions = _embedSize.value.split( "x" );
      _embedWidth = _embedDimensions[ 0 ];
      _embedHeight = _embedDimensions[ 1 ];
      updateEmbed( butter.project.iframeUrl );
    }, false );

    function applyInputListeners( element, key ) {
      var ignoreBlur = false,
          target;

      function checkValue( e ) {
        target = e.target;
        if ( target.value !== _project[ key ] ) {
          _project[ key ] = target.value;
          if ( butter.cornfield.authenticated() ) {
            _project.save(function() {
              butter.editor.openEditor( "project-editor" );
              checkDescription();
            });
          }
        }
      }

      element.addEventListener( "blur", function( e ) {
        if ( !ignoreBlur ) {
          checkValue( e );
        } else {
          ignoreBlur = false;
        }
      }, false );
    }

    applyInputListeners( _authorInput, "author" );
    applyInputListeners( _thumbnailInput, "thumbnail" );

    applyInputListeners( _descriptionInput, "description" );
    _descriptionInput.addEventListener( "keyup", checkDescription, false );

    TextboxWrapper.applyTo( _projectURL, { readOnly: true } );
    TextboxWrapper.applyTo( _projectEmbedURL, { readOnly: true } );
    TextboxWrapper.applyTo( _authorInput );
    TextboxWrapper.applyTo( _descriptionInput );
    TextboxWrapper.applyTo( _thumbnailInput );

    window.EditorHelper.droppable( null, _dropArea, function onDrop( uri ) {
      _project.thumbnail = uri;
      _project.save(function() {
        butter.editor.openEditor( "project-editor" );
        checkDescription();
        _thumbnailInput.value = _project.thumbnail;
      });
    });

    butter.listen( "droppable-unsupported", function unSupported() {
      _this.setErrorState( "Sorry, but your browser doesn't support this feature." );
    });

    butter.listen( "droppable-upload-failed", function failedUpload( e ) {
      _this.setErrorState( e.data );
    });

    butter.listen( "projectsaved", function onProjectSaved() {
      _projectURL.value = _project.publishUrl;
      _previewBtn.href = _project.previewUrl;
      _viewSourceBtn.href = "view-source:" + _project.iframeUrl;
      updateEmbed( _project.iframeUrl );
    });

    Editor.BaseEditor.extend( this, butter, rootElement, {
      open: function() {
        _project = butter.project;

        _projectURL.value = _project.publishUrl;
        _previewBtn.href = _project.previewUrl;
        _viewSourceBtn.href = "view-source:" + _project.iframeUrl;
        _thumbnailInput.value = _project.thumbnail;
        updateEmbed( _project.iframeUrl );

        _previewBtn.onclick = function() {
          return true;
        };
        _viewSourceBtn.onclick = function() {
          return true;
        };

        // Ensure Share buttons have loaded
        if ( !_shareTwitter.childNodes.length ) {
          _socialMedia.hotLoad( _shareTwitter, _socialMedia.twitter, _project.publishUrl );
        }
        if ( !_shareGoogle.childNodes.length ) {
          _socialMedia.hotLoad( _shareGoogle, _socialMedia.google, _project.publishUrl );
        }

        _this.scrollbar.update();

      },
      close: function() {
      }
    });
  }, true );
});
