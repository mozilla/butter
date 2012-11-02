/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ 'core/eventmanager', 'core/media' ],
        function( EventManager, Media ){

  // Local storage provider for backups.  All the browsers we support also
  // support localStorage, but fail in such a way that we don't crash.
  var __butterStorage = "localStorage" in window ?
    window.localStorage :
    { getItem: function(){},
      setItem: function(){},
      removeItem: function(){} };

  function Project( butter ) {

    var _this = this,
        _id, _name, _template, _author, _dataObject,
        _publishUrl, _iframeUrl,

        // Whether or not a save to server is required (project data has changed)
        _isDirty = false,

        // Whether or not a backup to storage is required (project data has changed)
        _needsBackup = false,

        // Whether or not the project is saved to the db and published.
        // The notion of "saving" to consumers of this code is unware of
        // the save vs. publish distinction. As such, we use isSaved externally
        // and isPublished internally, where Publish follows Save and is
        // more correct.
        _isPublished = false,

        // How often to backup data in ms. If 0, no backups are done.
        _backupIntervalMS = butter.config.value( "backupInterval" )|0,

        // Interval for backups, starts first time user clicks Save.
        _backupInterval = -1;

    function invalidate() {
      // Project is dirty, needs save, backup
      _isDirty = true;
      _needsBackup = true;

      // If the project has an id (if it was saved), start backups again
      // since they may have been stopped if LocalStorage size limits were
      // exceeded.
      if ( _id ) {
        startBackups();
      }

      // Let consumers know that the project changed
      _this.dispatch( "projectchanged" );
    }

    // Manage access to project properties.  Some we only want
    // to be read (and managed by db/butter), others we want to
    // affect save logic.
    Object.defineProperties( _this, {
      "id": {
        get: function() {
          return _id;
        },
        enumerable: true
      },

      "name": {
        get: function() {
          return _name;
        },
        set: function( value ) {
          if ( value !== _name ) {
            _name = value;
            invalidate();
          }
        },
        enumerable: true
      },

      "template": {
        get: function() {
          return _template;
        },
        set: function( value ) {
          if ( value !== _template ) {
            _template = value;
            invalidate();
          }
        },
        enumerable: true
      },

      "author": {
        get: function() {
          return _author;
        },
        set: function( value ) {
          if ( value !== _author ) {
            _author = value;
            invalidate();
          }
        },
        enumerable: true
      },

      "data": {
        get: function() {
          // Memoize value, since it doesn't always change
          if ( !_dataObject || _isDirty ) {
            var exportJSONMedia = [];
            for ( var i = 0; i < butter.media.length; ++i ) {
              exportJSONMedia.push( butter.media[ i ].json );
            }
            _dataObject = {
              targets: butter.serializeTargets(),
              media: exportJSONMedia
            };
          }
          return _dataObject;
        },
        enumerable: true
      },

      "publishUrl": {
        get: function() {
          return _publishUrl;
        },
        enumerable: true
      },

      "previewUrl": {
        get: function() {
          return _publishUrl + "?previewTime=" + Date.now();
        },
        enumerable: true
      },

      "iframeUrl": {
        get: function() {
          return _iframeUrl;
        },
        enumerable: true
      },

      // Have changes made it to the db and been published?
      "isSaved": {
        get: function() {
          return _isPublished && !_isDirty;
        },
        enumerable: true
      }

    });

    EventManager.extend( _this );

    // Once saved data is loaded, and media is ready, we start to care about
    // the app's data states changing, and want to track.
    butter.listen( "mediaready", function mediaReady() {
      butter.unlisten( "mediaready", mediaReady );

      // Listen for changes in the project data so we know when to save.
      [ "mediacontentchanged",
        "mediatargetchanged",
        "trackadded",
        "trackremoved",
        "tracktargetchanged",
        "trackeventadded",
        "trackeventremoved",
        "trackeventupdated"
      ].forEach( function( event ) {
        butter.listen( event, invalidate );
      });
    });

    function startBackups() {
      if ( _backupInterval === -1 && _backupIntervalMS > 0 ) {
        _needsBackup = true;
        _backupInterval = setInterval( backupData, _backupIntervalMS );
        // Do a backup now so we don't miss anything
        backupData();
      }
    }

    function pushToHistory() {
      if ( window.history ) {
        window.history.pushState( "?savedDataUrl=/api/project/" + _id );
      }
    }

    // Import project data from JSON (i.e., created with project.export())
    _this.import = function( json ) {
      var oldTarget, targets, targetData,
          mediaData, media, m, i, l;

      // If JSON, convert to Object
      if ( typeof json === "string" ) {
        try {
          json = JSON.parse( json );
        } catch( e ) {
          return;
        }
      }

      if ( json.name ) {
        _name = json.name;
      }

      if ( json.template ) {
        _template = json.template;
      }

      if ( json.author ) {
        _author = json.author;
      }

      if ( json.publishUrl ) {
        _publishUrl = json.publishUrl;
      }

      if ( json.iframeUrl ) {
        _iframeUrl = json.iframeUrl;
      }

      targets = json.targets;
      if ( targets && Array.isArray( targets ) ) {
        for ( i = 0, l = targets.length; i < l; ++i ) {
          targetData = targets[ i ];
          oldTarget = butter.getTargetByType( "elementID", targetData.element );
          // Only add target if it's not already added.
          if ( !oldTarget ) {
            butter.addTarget( targetData );
          } else {
            // If it was already added, just update its json.
            oldTarget.json = targetData;
          }
        }
      } else if ( console ) {
        console.warn( "Ignored imported target data. Must be in an Array." );
      }

      media = json.media;
      if ( media && Array.isArray( media ) ) {
        for ( i = 0, l = media.length; i < l; ++i ) {
          mediaData = media[ i ];
          m = butter.getMediaByType( "target", mediaData.target );

          if ( !m ) {
            m = new Media();
            m.json = mediaData;
            butter.addMedia( m );
          } else {
            m.json = mediaData;
          }
        }
      } else if ( console ) {
        console.warn( "Ignored imported media data. Must be in an Array." );
      }

      if ( json.projectID ) {
        _id = json.projectID;

        // This means the project we imported as a back up as well for an existing project
        // However, if the recovered auto save doesn't match the id of the project they loaded
        // we shouldn't auto save the backup
        _isPublished = !json.isAutoSave;
        if ( json.backupDate && _isPublished ) {
          _this.save();
        }

        pushToHistory();
      }

      // If this is a restored backup, restart backups now (vs. on first save)
      // since the user indicated they want it.
      if ( json.backupDate || json.projectID ) {
        startBackups();
      }

    };

    // Export project data as JSON string (e.g., for use with project.import())
    _this.export = function() {
      return JSON.stringify( _this.data );
    };

    // Expose backupData() to make testing possible
    var backupData = _this.backupData = function( backup ) {
      var data;

      // If the project isn't different from last time, or if it's known
      // to not fit in storage, don't bother trying.
      if ( ( !_needsBackup || _this.isSaved ) && !backup ) {
        return;
      }
      // Save everything but the project id
      if ( !backup ) {
        data = _this.data;
        data.projectID = _id;
        data.name = _name;
        data.template = _template;
        data.author = _author;
        data.backupDate = Date.now();
      } else {
        data = backup;
      }
      try {
        __butterStorage.setItem( "butter-backup-project", JSON.stringify( data ) );
        _needsBackup = false;
      } catch ( e ) {
        // Deal with QUOTA_EXCEEDED_ERR when localStorage is full.
        // Stop the backup loop because we know we can't save anymore until the
        // user changes something about the project.
        clearInterval( _backupInterval );
        _backupInterval = -1;

        // Purge the saved project, since it won't be complete.
        __butterStorage.removeItem( "butter-backup-project" );

        console.warn( "Warning: Popcorn Maker LocalStorage quota exceeded. Stopping automatic backup. Will be restarted when project changes again." );
      }
    };

    // Save and Publish a project.  Saving only happens if project data needs
    // to be saved (i.e., it has been changed since last save, or was never
    // saved before).
    _this.save = function( callback ) {

      if ( !callback ) {
        callback = function() {};
      }

      // Don't save if there is nothing new to save.
      if ( _this.isSaved ) {
        callback({ error: "okay" });
        return;
      }

      var projectJSON = JSON.stringify({
        id: _id,
        name: _name,
        template: _template,
        author: _author,
        data: _this.data
      });

      // Save to local storage first in case network is down.
      backupData();

      // Save to db, then publish
      butter.cornfield.save( _id, projectJSON, function( e ) {
        if ( e.error === "okay" ) {
          // Since we've now fully saved, blow away autosave backup
          _isDirty = false;
          __butterStorage.removeItem( "butter-backup-project" );

          // If this was a first save, grab id generated by server and store
          if ( !_id ) {
            _id = e.projectId;
          }

          // Now Publish and get URLs for embed
          butter.cornfield.publish( _id, function( e ) {
            if ( e.error === "okay" ) {
              // Save + Publish is OK
              _isPublished = true;
              _publishUrl = e.publishUrl;
              _iframeUrl = e.iframeUrl;
            }

            // Start keeping backups in storage, if not already started
            startBackups();

            // Use History Push state to add project information to browser URL
            pushToHistory();

            // Let consumers know that the project is now saved;
            _this.dispatch( "projectsaved" );

            callback( e );
          });
        } else {
          callback( e );
        }
      });
    };

    // Check for an existing project that was autosaved but not saved.
    // Returns project backup data as JS object if found, otherwise null.
    _this.checkForBackup = function( readyCB, fallbackCB ) {
      // See if we already have a project autosaved from another session.
      var projectBackup,
          location = window.location.search,
          loadAutoSave = location.indexOf( "loadAutoSave" ) > -1 ? true : false;

      if ( !fallbackCB ) {
        fallbackCB = function() {};
      }

      if ( !readyCB ) {
        readyCB = function() {};
      }

      // For testing purposes, we can skip backup recovery
      if ( butter.config.value( "recover" ) === "purge" ) {
        fallbackCB( readyCB );
        return;
      }

      try {
        projectBackup = __butterStorage.getItem( "butter-backup-project" );
        projectBackup = JSON.parse( projectBackup );
      } catch( e ) { }

      if ( projectBackup && projectBackup.isAutoSave ) {
        _this.import( projectBackup );
        readyCB( _this );
      } else if ( projectBackup ) {
        var id = location.substring( location.lastIndexOf( "/" ) + 1 );

        id = parseInt( id, 10 );

        if ( !isNaN( id ) && ( projectBackup.projectID === id ) ) {
          _this.import( projectBackup );
          readyCB( _this );
        } else {
          // Backup found doesn't match project being loaded. Proceed loading
          // current project and store the project backup
          _this.autosave = projectBackup;
          fallbackCB( readyCB );
        }
      } else {
        // No backup found, keep loading
        fallbackCB( readyCB );
      }

    };
  }

  return Project;
});
