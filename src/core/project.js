/*! This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

/**
 * Document: Project
 *
 * Provides Project management functionality to Butter.
 *
 * @structure Module
 */
define( [ "core/eventmanager", "core/media", "util/shims" ],
  function( EventManager, Media, Shims ) {

  var __butterStorage = window.localStorage;

  /**
   * Document: Project::Project
   *
   * Maintains the state and persistence for a Butter project.
   *
   * @param {Butter} butter A Butter instance.
   * @structure Class
   * @api public
   */
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

    /**
     * Document: Project::Project::invalidate
     *
     * Places this project in a dirty state.
     *
     * @structure Member Function
     * @dispatch projectchanged
     * @api private
     */
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
      /**
       * Document: Project::Project::id
       *
       * Project id.
       *
       * @structure Property
       * @return {String}
       * @access read-only
       */
      "id": {
        get: function() {
          return _id;
        },
        enumerable: true
      },

      /**
       * Document: Project::Project::name
       *
       * Project name. Changing this property invalidates the Project.
       *
       * @structure Property
       * @return {String}
       * @access read-write
       */
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

      /**
       * Document: Project::Project::template
       *
       * Template url on which the project was based. Changing this property invalidates the Project.
       *
       * @structure Property
       * @return {String}
       * @access read-write
       */
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

      /**
       * Document: Project::Project::author
       *
       * Project author. Changing this property invalidates the Project.
       *
       * @structure Property
       * @return {String}
       * @access read-write
       */
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

      /**
       * Document: Project::Project::data
       *
       * Compilation of project data (media, tracks, trackevents, etc.) as a json blob. If project has changed, results are compiled on-demand.
       * Otherwise, old data is returned.
       *
       * @structure Property
       * @return {JSON}
       * @access read-only
       */
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

      /**
       * Document: Project::Project::publishUrl
       *
       * URL at which the project was published.
       *
       * @structure Property
       * @return {String}
       * @access read-only
       */
      "publishUrl": {
        get: function() {
          return _publishUrl;
        },
        enumerable: true
      },

      /**
       * Document: Project::Project::previewUrl
       *
       * URL at which the project can be previewed.
       *
       * @structure Property
       * @return {String}
       * @access read-only
       */
      "previewUrl": {
        get: function() {
          return _publishUrl + "?preview=true";
        },
        enumerable: true
      },

      /**
       * Document: Project::Project::iframeUrl
       *
       * URL for viewing project where iframes are prefered.
       *
       * @structure Property
       * @return {String}
       * @access read-only
       */
      "iframeUrl": {
        get: function() {
          return _iframeUrl;
        },
        enumerable: true
      },

      /**
       * Document: Project::Project::isSaved
       *
       * True when changes made it to the db and been project was published.
       *
       * @structure Property
       * @return {String}
       * @access read-only
       */
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


    /**
     * Document: Project::Project::startBackups
     *
     * Starts backup ticker which issues backup requests on a timeout.
     *
     * @structure Member Function
     * @api private
     */
    function startBackups() {
      if ( _backupInterval === -1 && _backupIntervalMS > 0 ) {
        _needsBackup = true;
        _backupInterval = setInterval( backupData, _backupIntervalMS );
        // Do a backup now so we don't miss anything
        backupData();
      }
    }

    /**
     * Document: Project::Project::import
     *
     * Prepares a project from the description provided within the given JSON object.
     *
     * @param {String} json Stringified JSON structure to import as project data.
     * @see Project::Project::export
     * @structure Member Function
     * @api public
     */
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

      if ( json.projectID ) {
        _id = json.projectID;
        _isPublished = true;
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

      // If this is a restored backup, restart backups now (vs. on first save)
      // since the user indicated they want it.
      if( json.backupDate ) {
        startBackups();
      }

    };

    /**
     * Document: Project::Project::export
     *
     * Constructs a string from a JSON object which represents the current project.
     *
     * @see Project::Project::import
     * @structure Member Function
     * @return {String} Stringified JSON.
     * @api public
     */
    _this.export = function() {
      return JSON.stringify( _this.data );
    };

    // Expose backupData() to make testing possible
    var backupData = _this.backupData = function() {
      // If the project isn't different from last time, or if it's known
      // to not fit in storage, don't bother trying.
      if ( !_needsBackup ) {
        return;
      }
      // Save everything but the project id
      var data = _this.data;
      data.name = _name;
      data.template = _template;
      data.author = _author;
      data.backupDate = Date.now();
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

    /**
     * Document: Project::Project::save
     *
     * Saves and publishes a project. Saving only happens if project data needs
     * to be saved (i.e., it has been changed since last save, or was never
     * saved before).
     *
     * @param {Function} callback Called when save operation (success or failure) has completed.
     * @structure Member Function
     * @api public
     */
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

          // Start keeping backups in storage, if not already started
          startBackups();

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

            // Let consumers know that the project is now saved;
            _this.dispatch( "projectsaved" );

            callback( e );
          });
        } else {
          callback( e );
        }
      });
    };
  }

  /**
   * Document: Project::Project::save
   *
   * Check for an existing project that was autosaved but not saved.
   * Returns project backup data as JS object if found, otherwise null.
   * NOTE: caller must create a new Project object and call import.
   *
   * @param {Butter} butter A Butter instance.
   * @param {Function} callback Called when save operation (success or failure) has completed.
   * @structure Class Function
   * @api public
   */
  Project.checkForBackup = function( butter, callback ) {
    // See if we already have a project autosaved from another session.
    var projectBackup, backupDate;

    // For testing purposes, we can skip backup recovery
    if ( butter.config.value( "recover" ) === "purge" ) {
      callback( null, null );
      return;
    }

    try {
      projectBackup = __butterStorage.getItem( "butter-backup-project" );
      projectBackup = JSON.parse( projectBackup );

      // Delete since user can save if he/she wants.
      __butterStorage.removeItem( "butter-backup-project" );

      if ( projectBackup ) {
        backupDate = projectBackup.backupDate;
      }
    } catch( e ) { }

    callback( projectBackup, backupDate );
  };

  return Project;
});
