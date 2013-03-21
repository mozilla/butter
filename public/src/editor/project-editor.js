/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define([ "editor/editor", "editor/base-editor",
          "text!layouts/project-editor.html", "util/social-media", "ui/widget/textbox" ],
  function( Editor, BaseEditor, LAYOUT_SRC, SocialMedia, TextboxWrapper ) {

  Editor.register( "project-editor", LAYOUT_SRC, function( rootElement, butter ) {
    var _rootElement = rootElement,
        _socialMedia = new SocialMedia(),
        _editorBody = _rootElement.querySelector ( ".butter-editor-body" ),
        _editorTitleCard = _rootElement.querySelector( ".editor-title-card" ),
        _projectLinkElem = _rootElement.querySelector( ".project-link" ),
        _projectURL = _rootElement.querySelector( ".butter-project-url" ),
        _authorInput = _rootElement.querySelector( ".butter-project-author" ),
        _descriptionInput = _rootElement.querySelector( ".butter-project-description" ),
        _noDescription = _rootElement.querySelector( ".no-description" ),
        _projectEmbedURL = _rootElement.querySelector( ".butter-project-embed-url" ),
        _embedSize = _rootElement.querySelector( ".butter-embed-size" ),
        _previewBtn = _rootElement.querySelector( ".butter-preview-link" ),
        _shareBtn = _rootElement.querySelector( ".share-tab-btn" ),
        _embedBtn = _rootElement.querySelector( ".embed-tab-btn" ),
        _viewSourceBtn = _rootElement.querySelector( ".butter-view-source-btn" ),
        _shareTwitter = _rootElement.querySelector( ".butter-share-twitter" ),
        _shareGoogle = _rootElement.querySelector( ".butter-share-google" ),
        _embedDimensions = _embedSize.value.split( "x" ),
        _embedWidth = _embedDimensions[ 0 ],
        _embedHeight = _embedDimensions[ 1 ],
        _dropArea = _rootElement.querySelector( ".image-droparea" ),
        _thumbnailInput = _rootElement.querySelector( ".butter-project-thumbnail" ),
        _projectTabs = _rootElement.querySelectorAll( ".project-tab" ),
        _settingsTabs = _rootElement.querySelectorAll( ".settings-tab" ),
        _this = this,
        _project,
        _hasBeenSavedOnce = false;


    function toggleTabs() {
      if ( butter.cornfield.authenticated() && _project.isSaved ) {
        _viewSourceBtn.classList.remove( "no-click" );
        _embedBtn.classList.remove( "no-click" );
        _shareBtn.classList.remove( "no-click" );
        _viewSourceBtn.href = "view-source:" + _project.iframeUrl;
        _editorBody.classList.remove( "expanded" );
        _projectLinkElem.classList.remove( "hidden" );
        _editorTitleCard.classList.remove( "collapsed" );
        _this.setErrorState( false );
      } else {
        _viewSourceBtn.classList.add( "no-click" );
        _embedBtn.classList.add( "no-click" );
        _shareBtn.classList.add( "no-click" );
        _viewSourceBtn.href = "#";
        _editorBody.classList.add( "expanded" );
        _projectLinkElem.classList.add( "hidden" );
        _editorTitleCard.classList.add( "collapsed" );
        _this.setErrorState( "Share, Embed and View Source will be enabled once you have logged in and saved your project." );
      }
      _this.scrollbar.update();
    }

    function checkDescription() {
      if ( !_descriptionInput.value ) {
        _descriptionInput.classList.add( "invalid" );
        _noDescription.classList.remove( "hidden" );
      } else {
        _descriptionInput.classList.remove( "invalid" );
        _noDescription.classList.add( "hidden" );
      }
    }

    _authorInput.value = butter.project.author ? butter.project.author : "";
    _descriptionInput.value = butter.project.description ? butter.project.description : "";

    function onProjectTabClick( e ) {
      if ( _hasBeenSavedOnce ) {
        var target = e.target,
            currentDataName = target.getAttribute( "data-tab-name" ),
            dataName;

        for ( var i = 0; i < numProjectTabs; i++ ) {
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
      } else {
        return;
      }
    }

    function onSettingsTabClick( e ) {
      var target = e.target,
          currentDataName = target.getAttribute( "data-tab-name" ),
          dataName;

      for ( var i = 0; i < numSettingsTabs; i++ ) {
        dataName = _settingsTabs[ i ].getAttribute( "data-tab-name" );

        if ( dataName === currentDataName ) {
          _rootElement.querySelector( "." + dataName + "-container" ).classList.remove( "display-off" );
          target.classList.add( "butter-active" );
        } else {
          _rootElement.querySelector( "." + dataName + "-container" ).classList.add( "display-off" );
          _settingsTabs[ i ].classList.remove( "butter-active" );
        }

      }

      _this.scrollbar.update();
    }

    var projectTab,
        settingTab,
        numProjectTabs = _projectTabs.length,
        numSettingsTabs = _settingsTabs.length,
        idx;

    for ( idx = 0; idx < numProjectTabs; idx++ ) {
      projectTab = _projectTabs[ idx ];
      projectTab.addEventListener( "click", onProjectTabClick, false );
    }

    for ( idx = 0; idx < numSettingsTabs; idx++ ) {
      settingTab = _settingsTabs[ idx ];
      settingTab.addEventListener( "click", onSettingsTabClick, false );
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
    TextboxWrapper.applyTo( _thumbnailInput );
    TextboxWrapper.applyTo( _descriptionInput );

    window.EditorHelper.droppable( null, _dropArea, function onDrop( uri ) {
      _project.thumbnail = uri;
      _project.save();
    });

    butter.listen( "droppable-unsupported", function unSupported() {
      _this.setErrorState( "Sorry, but your browser doesn't support this feature." );
    });

    butter.listen( "filetype-unsupported", function invalidType() {
      _this.setErrorState( "Sorry but that file type isn't supported. Please use JPEG or PNG." );
    });

    butter.listen( "projectsaved", function onProjectSaved() {
      _projectURL.value = _project.publishUrl;
      _previewBtn.href = _project.previewUrl;
      _viewSourceBtn.href = "view-source:" + _project.iframeUrl;
      updateEmbed( _project.iframeUrl );
      toggleTabs();
      _hasBeenSavedOnce = true;
    });

    Editor.BaseEditor.extend( this, butter, rootElement, {
      open: function() {
        _project = butter.project;

        // Using this as a flag to determine if we need to prevent clicks from going through
        // on tabs.
        _hasBeenSavedOnce = _project.isSaved;

        if ( butter.cornfield.authenticated() && _project.isSaved ) {
          _projectURL.value = _project.publishUrl;
          _previewBtn.href = _project.previewUrl;
          updateEmbed( _project.iframeUrl );
        }

        _previewBtn.onclick = function() {
          return butter.cornfield.authenticated() && _project.isSaved;
        };
        _viewSourceBtn.onclick = function() {
          return butter.cornfield.authenticated() && _project.isSaved;
        };

        checkDescription();

        // Ensure Share buttons have loaded
        if ( !_shareTwitter.childNodes.length ) {
          _socialMedia.hotLoad( _shareTwitter, _socialMedia.twitter, _project.publishUrl );
        }
        if ( !_shareGoogle.childNodes.length ) {
          _socialMedia.hotLoad( _shareGoogle, _socialMedia.google, _project.publishUrl );
        }

        toggleTabs();
      },
      close: function() {
      }
    });
  }, true );
});
