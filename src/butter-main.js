/**********************************************************************************

Copyright (C) 2012 by Mozilla Foundation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

**********************************************************************************/

(function () {

  define( [ 
            "require",
            "core/logger",
            "core/eventmanager",
            "core/track",
            "core/trackevent",
            "core/target",
            "core/media",
            "comm/comm",
            "editor/module",
            "preview/module",
            "track/module",
            "plugin/module",
            "timeline/module",
            "dialog/module",
            "ui/module"
          ],
          function( 
            require, 
            Logger, 
            EventManager, 
            Track, 
            TrackEvent, 
            Target, 
            Media, 
            Comm,
            EditorModule,
            PreviewModule,
            TrackModule,
            PluginModule,
            TimelineModule,
            DialogModule,
            UIModule
  ){

    var __modules = {
      dialog: DialogModule,
      editor: EditorModule,
      track: TrackModule,
      timeline: TimelineModule,
      plugin: PluginModule,
      preview: PreviewModule,
      ui: UIModule
    };

    var __guid = 0;

    var Butter = function( butterOptions ){

      butterOptions = butterOptions || {};

      var _events = {},
          _media = [],
          _currentMedia,
          _targets = [],
          _id = "Butter" + __guid++,
          _logger = new Logger( _id ),
          _em = new EventManager( this ),
          _this = this;

      function checkMedia() {
        if ( !_currentMedia ) {
          throw new Error("No media object is selected");
        } //if
      }

      this.getManifest = function ( name ) {
        checkMedia();
        return _currentMedia.getManifest( name );
      }; //getManifest

      /****************************************************************
       * Track methods
       ****************************************************************/
      //addTrack - Creates a new Track
      this.addTrack = function ( track ) {
        checkMedia();
        return _currentMedia.addTrack( track );
      }; //addTrack

      //getTrack - Get a Track by its id
      this.getTrack = function ( name ) {
        checkMedia();
        return _currentMedia.getTrack( name );
      }; //getTrack
       
      //removeTrack - Remove a Track
      this.removeTrack = function ( track ) {
        checkMedia();
        return _currentMedia.removeTrack( track );
      };

      /****************************************************************
       * Target methods
       ****************************************************************/
      //addTarget - add a target object
      this.addTarget = function ( target ) {
        if ( !(target instanceof Target ) ) {
          target = new Target( target );
        } //if

        _targets.push( target );

        _logger.log( "Target added: " + target.name );
        _em.dispatch( "targetadded", target );

        return target;
      }; //addTarget

      //removeTarget - remove a target object
      this.removeTarget = function ( target ) {
        if ( typeof(target) === "string" ) {
          target = _this.getTarget( target );
        } //if
        var idx = _targets.indexOf( target );
        if ( idx > -1 ) {
          _targets.splice( idx, 1 );
          delete _targets[ target.name ];
          _em.dispatch( "targetremoved", target );
          return target;
        } //if
        return undefined;
      }; //removeTarget

      //serializeTargets - get a list of targets objects
      this.serializeTargets = function () {
        var sTargets = [];
        for ( var i=0, l=_targets.length; i<l; ++i ) {
          sTargets.push( _targets[ i ].json );
        }
        return sTargets;
      }; //serializeTargets

      //getTarget - get a target object by its id
      this.getTarget = function ( target ) {
        for ( var i=0; i<_targets.length; ++i ) {
          if (  ( target.id !== undefined && _targets[ i ].id === target.id ) ||
                ( target.name && _targets[ i ].name === target.name ) ||
                _targets[ i ].name === target ) {
            return _targets[ i ];
          }
        }
        return undefined;
      }; //getTaget

      /****************************************************************
       * Project methods
       ****************************************************************/
      //importProject - Import project data
      this.importProject = function ( projectData ) {
        if ( projectData.targets ) {
          for ( var i=0, l=projectData.targets.length; i<l; ++i ) {

            var t, targets = _this.targets, targetData = projectData.targets[ i ];
            for ( var k=0, j=targets.length; k<j; ++k ) {
              if ( targets[ k ].name === targetData.name ) {
                t = targets[ k ];
                break;
              }
            }

            if ( !t ) {
              t = new Target();
              t.json = projectData.targets[ i ];
              _this.addTarget( t );
            }
            else {
              t.json = projectData.targets[ i ];
            }
          }
        }
        if ( projectData.media ) {
          for ( var i=0, l=projectData.media.length; i<l; ++i ) {

            var mediaData = projectData.media[ i ],
                m = _this.getMedia( { target: mediaData.target } );

            if ( !m ) {
              m = new Media();
              m.json = projectData.media[ i ];
              _this.addMedia( m );
            }
            else {
              m.json = projectData.media[ i ];
            }

          } //for
        } //if projectData.media
      }; //importProject

      //exportProject - Export project data
      this.exportProject = function () {
        var exportJSONMedia = [];
        for ( var m=0, lm=_media.length; m<lm; ++m ) {
          exportJSONMedia.push( _media[ m ].json );
        }
        var projectData = {
          targets: _this.serializeTargets(),
          media: exportJSONMedia
        };
        return projectData;
      };

      this.clearProject = function() {
        while ( _targets.length > 0 ) {
          _this.removeTarget( _targets[ 0 ] );
        }
        while ( _media.length > 0 ) {
          _this.removeMedia( _media[ 0 ] );
        }
      };

      /****************************************************************
       * Media methods
       ****************************************************************/
      //getMedia - get the media's information
      this.getMedia = function ( media ) {
        for ( var i=0,l=_media.length; i<l; ++i ) {
          if (  ( media.id !== undefined && _media[ i ].id === media.id ) ||
                ( media.name && _media[ i ].name === media.name ) ||
                ( media.target && _media[ i ].target === media.target ) ||
                _media[ i ].name === media ) {
            return _media[ i ];
          }
        }
        return undefined;
      };

      //addMedia - add a media object
      this.addMedia = function ( media ) {
        if ( !( media instanceof Media ) ) {
          media = new Media( media );
        } //if

        var mediaName = media.name;
        _media.push( media );

        _em.repeat( media, [
          "mediacontentchanged",
          "mediadurationchanged",
          "mediatargetchanged",
          "mediatimeupdate",
          "mediaready",
          "trackadded",
          "trackremoved",
          "tracktargetchanged",
          "trackeventadded",
          "trackeventremoved",
          "trackeventupdated",
        ]);

        if ( media.tracks.length > 0 ) {
          for ( var ti=0, tl=media.tracks.length; ti<tl; ++ti ) {
            var track = media.tracks[ ti ];
                trackEvents = track.trackEvents;
                media.dispatch( "trackadded", track );
            if ( trackEvents.length > 0 ) {
              for ( var i=0, l=trackEvents.length; i<l; ++i ) {
                track.dispatch( "trackeventadded", trackEvents[ i ] );
              } //for
            } //if
          } //for
        } //if

        _em.dispatch( "mediaadded", media );
        if ( !_currentMedia ) {
          _this.currentMedia = media;
        } //if
        return media;
      }; //addMedia

      //removeMedia - forget a media object
      this.removeMedia = function ( media ) {
        if ( typeof( media ) === "string" ) {
          media = _this.getMedia( media );
        } //if

        var idx = _media.indexOf( media );
        if ( idx > -1 ) {
          _media.splice( idx, 1 );
          _em.unrepeat( media, [
            "mediacontentchanged",
            "mediadurationchanged",
            "mediatargetchanged",
            "mediatimeupdate",
            "mediaready",
            "trackadded",
            "trackremoved",
            "tracktargetchanged",
            "trackeventadded",
            "trackeventremoved",
            "trackeventupdated",
          ]);
          var tracks = media.tracks;
          for ( var i=0, l=tracks.length; i<l; ++i ) {
            _em.dispatch( "trackremoved", tracks[ i ] );
          } //for
          if ( media === _currentMedia ) {
            _currentMedia = undefined;
          } //if
          _em.dispatch( "mediaremoved", media );
          return media;
        } //if
        return undefined;
      }; //removeMedia

      this.extend = function(){
        Butter.extend( _this, [].slice.call( arguments, 1 ) );
      };

      /****************************************************************
       * Properties
       ****************************************************************/
      Object.defineProperties( this, {
        id: {
          get: function(){ return _id; },
          enumerable: true
        },
        tracks: {
          get: function() {
            return _currentMedia.tracks;
          },
          enumerable: true
        },
        trackEvents: {
          get: function() {
            checkMedia();
            var tracks = _currentMedia.tracks, trackEvents = {};
            for ( var i=0, l=tracks.length; i<l; ++i ) {
              var track = tracks[i];
              trackEvents[ track.name ] = track.trackEvents;
            } //for
            return trackEvents;
          },
          enumerable: true
        },
        targets: {
          get: function() {
            return _targets;
          },
          enumerable: true
        },
        currentTime: {
          get: function() {
            checkMedia();
            return _currentMedia.currentTime;
          },
          set: function( time ) {
            checkMedia();
            _currentMedia.currentTime = time;
          },
          enumerable: true
        },
        duration: {
          get: function() {
            checkMedia();
            return _currentMedia.duration;
          },
          set: function( time ) {
            checkMedia();
            _currentMedia.duration = time;
          },
          enumerable: true
        },
        media: {
          get: function() {
            return _media;
          },
          enumerable: true
        },
        currentMedia: {
          get: function() {
            return _currentMedia;
          },
          set: function( media ) {
            if ( typeof( media ) === "string" ) {
              media = _this.getMedia( media );
            } //if

            if ( media && _media.indexOf( media ) > -1 ) {
              _currentMedia = media;
              _logger.log( "Media Changed: " + media.name );
              _em.dispatch( "mediachanged", media );
              return _currentMedia;
            } //if
          },
          enumerable: true
        }
      });

      Butter.instances.push(this);

      if ( butterOptions.ready ) {
        _em.listen( "ready", function( e ){
          butterOptions.ready( e.data );
        });
      } //if

      if( butterOptions.config && typeof( butterOptions.config ) === "string" ){
        var xhr = new XMLHttpRequest();
        if( xhr.overrideMimeType ){
          // Firefox generates a misleading "syntax" error if we don't have this line.
          xhr.overrideMimeType( "application/json" );
        }
        xhr.open( "GET", butterOptions.config, false );
        xhr.send( null );

        if ( xhr.status === 200 || xhr.status === 0 ) {
          var config = JSON.parse( xhr.responseText ),
              modules = config.modules;
          for( var moduleName in modules ){
            if( modules.hasOwnProperty( moduleName ) && moduleName in __modules ){
              _this[ moduleName ] = new __modules[ moduleName ]( _this, modules[ moduleName ] );
            } //if
          } //for
        }
        _em.dispatch( "ready", _this );
      }
      else {
        _em.dispatch( "ready", _this );
      } //if

    }; //Butter

    Butter.Media = Media;
    Butter.Track = Track;
    Butter.TrackEvent = TrackEvent;
    Butter.Target = Target;
    Butter.Logger = Logger;
    Butter.EventManager = EventManager;
    Butter.instances = [];

    if ( window.Butter.__waiting ) {
      for ( var i=0, l=window.Butter.__waiting.length; i<l; ++i ) {
        Butter.apply( {}, window.Butter.__waiting[ i ] );
      }
      delete Butter._waiting;
    } //if
    window.Butter = Butter;
    return Butter;
  });

})();

