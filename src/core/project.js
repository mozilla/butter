/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

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

        // Whether or not to save (project data has changed)
        _isDirty = false,

        // Whether or not localStorage quota (typically 5M) has been exceeded
        _quotaExceeded = false,

        // Whether or not the project is saved to the db and published.
        // The notion of "saving" to consumers of this code is unware of
        // the save vs. publish distinction. As such, we use isSaved externally
        // and isPublished internally, where Publish follows Save and is
        // more correct.
        _isPublished = false,

        // How often to backup data in ms. If 0, no backups are done.
        _backupIntervalMS = butter.config.value( "backupInterval" )|0;

    function invalidate() {
      // Project is dirty, needs backup
      _isDirty = true;

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

      if ( json.projectID ) {
        _id = json.projectID;
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

      targets = json.targets;
      if ( targets ) {
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
      }

      media = json.media;
      if ( media ) {
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
      }

      // If we're loading data from the server, then save it again so stuff works
      // This is a bad hack and I should feel bad
      if ( json.projectID ) {
        _this.save();
      }
    };

    // Export project data as JSON string (e.g., for use with project.import())
    _this.export = function() {
      return JSON.stringify( _this.data );
    };

    // Expose backupData() to make testing possible
    var backupData = _this.backupData = function() {
      // If the project isn't different from last time, or if it's known
      // to not fit in storage, don't bother trying.
      if ( !_isDirty || _quotaExceeded ) {
        return;
      }
      var data = _this.data;
      data.projectID = _id;
      data.name = _name;
      data.template = _template;
      data.author = _author;
      data.backupDate = (new Date()).toJSON();
      try {
        __butterStorage.setItem( "butter-backup-project", JSON.stringify( data ) );
      } catch ( e ) {
        // Deal with QUOTA_EXCEEDED_ERR when localStorage is full.
        // Flag and stop trying to backup, since we can't.  This can
        // happen when users include a lot of images as Data URIs.
        _quotaExceeded = true;
        // Purge the saved projecct, since it won't be complete.
        __butterStorage.removeItem( "butter-backup-project" );
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

            // Let consumers know that the project is now saved;
            _this.dispatch( "projectsaved" );

            callback( e );
          });
        } else {
          callback( e );
        }
      });
    };

    if ( _backupIntervalMS > 0 ) {
      setInterval( backupData, _backupIntervalMS );
    }
  }

  // Check for an existing project that was autosaved but not saved.
  // Returns new Project object if found, otherwise null.
  Project.checkForBackup = function( butter, callback ) {
    // See if we already have a project autosaved from another session.
    var obj = __butterStorage.getItem( "butter-backup-project" ),
        p;

    if ( !obj ){
      callback();
      return;
    }

    if ( butter.config.value( "recover" ) !== "purge" ) {
      p = new Project( butter );
      p.import( obj );
    }

    // Delete since user can save if he/she wants.
    __butterStorage.removeItem( "butter-backup-project" );
    callback( p );
  };

  return Project;
});
