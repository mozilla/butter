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
            "core/target",
            "core/media",
            "core/page",
            "editor/module",
            "track/module",
            "plugin/module",
            "timeline/module",
            "ui/module"
          ],
          function(
            require,
            Logger,
            EventManager,
            Target,
            Media,
            Page,
            EditorModule,
            TrackModule,
            PluginModule,
            TimelineModule,
            UIModule
  ){

    var __modules = {
      editor: EditorModule,
      eventManager: EventManager,
      track: TrackModule,
      timeline: TimelineModule,
      plugin: PluginModule,
      ui: UIModule
    }; //modules

    var __guid = 0;

    var __instances = [];

    var Butter = function( options ){
      return new ButterInit( options );
    }; //Butter

    function ButterInit( butterOptions ){

      butterOptions = butterOptions || {};

      var _events = {},
          _media = [],
          _currentMedia,
          _targets = [],
          _id = "Butter" + __guid++,
          _logger = new Logger( _id ),
          _em = new EventManager( this ),
          _page = new Page(),
          _config = {
            modules: {},
            ui: {},
            icons: {}
          },
          _this = this;

      function checkMedia() {
        if ( !_currentMedia ) {
          throw new Error("No media object is selected");
        } //if
      } //checkMedia

      this.getManifest = function ( name ) {
        checkMedia();
        return _currentMedia.getManifest( name );
      }; //getManifest

      this.getHTML = function(){
        var media = [];
        for( var i=0; i<_media.length; ++i ){
          media.push( _media[ i ].popcornString );
        } //for
        return _page.getHTML( media );
      }; //getHTML

      function trackEventRequested( e, media, target ){
          var track,
              element = e.data.ui.draggable[ 0 ],
              type = element.id.split( "-" ),
              start = media.currentTime + 1 < media.duration ? media.currentTime : media.duration - 1,
              end = start + 1;

          if( type.length === 3 ){
            type = type[ 2 ];
          }
          else{
            _logger.log( "Invalid trackevent type requested." );
            type = null;
          } //if

          if( media.tracks.length === 0 ){
            media.addTrack();
          } //if
          track = media.tracks[ 0 ];
          track.addTrackEvent({
            type: type,
            popcornOptions: {
              start: start,
              end: end,
              target: target
            }
          });
      } //trackEventRequested

      function targetTrackEventRequested( e ){
        if( _currentMedia ){
          trackEventRequested( e, _currentMedia, e.target.elementID );
        }
        else {
          _logger.log( "Warning: No media to add dropped trackevent." );
        } //if
      } //targetTrackEventRequested

      function mediaTrackEventRequested( e ){
        trackEventRequested( e, e.target, "Media Element" );
      } //mediaTrackEventRequested

       /****************************************************************
       * Target methods
       ****************************************************************/
      //addTarget - add a target object
      this.addTarget = function ( target ) {
        if ( !(target instanceof Target ) ) {
          target = new Target( target );
        } //if
        _targets.push( target );
        target.listen( "trackeventrequested", targetTrackEventRequested );
        _logger.log( "Target added: " + target.name );
        _em.dispatch( "targetadded", target );
        return target;
      }; //addTarget

      //removeTarget - remove a target object
      this.removeTarget = function ( target ) {
        if ( typeof(target) === "string" ) {
          target = _this.getTargetByType( "id", target );
        } //if
        var idx = _targets.indexOf( target );
        if ( idx > -1 ) {
          target.unlisten( "trackeventrequested", targetTrackEventRequested );
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

      //getTargetByType - get the target's information based on a valid type
      // if type is invalid, return undefined
      this.getTargetByType = function( type, val ) {
        for( var i = 0, l = _targets.length; i < l; i++ ) {
          if ( _targets[ i ][ type ] === val ) {
            return _targets[ i ];
          }
        }
        return undefined;
      }; //getTargetByType
      
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
              _this.addTarget( targetData );
            }
            else {
              t.json = targetData;
            }
          }
        }
        if ( projectData.media ) {
          for ( var i=0, l=projectData.media.length; i<l; ++i ) {

            var mediaData = projectData.media[ i ],
                m = _this.getMediaByType( "target", mediaData.target );

            if ( !m ) {
              m = new Media();
              m.json = mediaData;
              _this.addMedia( m );
            }
            else {
              m.json = mediaData;
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
      }; //clearProject

      /****************************************************************
       * Media methods
       ****************************************************************/
      //getMediaByType - get the media's information based on a valid type
      // if type is invalid, return undefined
      this.getMediaByType = function ( type, val ) {
       for( var i = 0, l = _media.length; i < l; i++ ) {
          if ( _media[ i ][ type ] === val ) {
            return _media[ i ];
          }
        }
        return undefined;
      }; //getMediaByType

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
          "trackeventeditrequested"
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

        media.listen( "trackeventrequested", mediaTrackEventRequested );

        _em.dispatch( "mediaadded", media );
        if ( !_currentMedia ) {
          _this.currentMedia = media;
        } //if
        return media;
      }; //addMedia

      //removeMedia - forget a media object
      this.removeMedia = function ( media ) {

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
            "trackeventeditrequested"
          ]);
          var tracks = media.tracks;
          for ( var i=0, l=tracks.length; i<l; ++i ) {
            _em.dispatch( "trackremoved", tracks[ i ] );
          } //for
          if ( media === _currentMedia ) {
            _currentMedia = undefined;
          } //if
          media.unlisten( "trackeventrequested", mediaTrackEventRequested );
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
      Object.defineProperties( _this, {
        config: {
          enumerable: true,
          get: function(){
            return _config;
          }
        },
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
              media = _this.getMediaByType( "id", media.id );
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

      var preparePage = this.preparePage = function( callback ){
        var scrapedObject = _page.scrape(),
            targets = scrapedObject.target,
            medias = scrapedObject.media;

        _page.preparePopcorn(function() {
          var i, j, il, jl, url;
          for( i = 0, il = targets.length; i < il; ++i ) {
            if( _targets.length > 0 ){
              for( j = 0, jl = _targets.length; j < jl; ++j ){
                // don't add the same target twice
                if( _targets[ j ].id !== targets[ i ].id ){
                  _this.addTarget({ element: targets[ i ].id });
                } //if
              } //for j
            }
            else{
              _this.addTarget({ element: targets[ i ].id });
            } //if
          } //for i
          for( i = 0, il = medias.length; i < il; i++ ) {
            url = "";
            if( ["VIDEO", "AUDIO" ].indexOf( medias[ i ].nodeName ) > -1 ) {
              url = medias[ i ].currentSrc;
            } else {
              url = medias[ i ].getAttribute( "data-butter-source" );
            }
            if( _media.length > 0 ){
              for( j = 0, jl = _media.length; j < jl; ++j ){
                if( _media[ j ].id !== medias[ i ].id && _media[ j ].url !== url ){
                  _this.addMedia({ target: medias[ i ].id, url: url });
                } //if
              } //for
            }
            else{
              _this.addMedia({ target: medias[ i ].id, url: url });
            } //if
          } //for

          if( callback ){
            callback();
          } //if
          _em.dispatch( "pageready" );
        });
      }; //preparePage

      __instances.push( this );

      if( butterOptions.ready ){
        _em.listen( "ready", function( e ){
          butterOptions.ready( e.data );
        });
      } //if

      function readConfig(){
        var modules = _config.modules,
            icons = _config.icons,
            img;
        for( var moduleName in modules ){
          if( modules.hasOwnProperty( moduleName ) && moduleName in __modules ){
            _this[ moduleName ] = new __modules[ moduleName ]( _this, modules[ moduleName ] );
          } //if
        } //for
        for( var identifier in icons ){
          if( icons.hasOwnProperty( identifier ) ){
            img = document.createElement( "img" );
            img.src = icons[ identifier ];
            img.id = identifier + "-icon";
            img.style.display = "none";
            img.setAttribute( "data-butter-exclude", "true" );
            // @secretrobotron: just attach this to the body hidden for now,
            //                  so that it preloads if necessary
            document.body.appendChild( img );
          } //if
        } //for

        preparePage(function(){
          _em.dispatch( "ready", _this );
        });
      } //readConfig

      if( butterOptions.config && typeof( butterOptions.config ) === "string" ){
        var xhr = new XMLHttpRequest();
        if( xhr.overrideMimeType ){
          // Firefox generates a misleading "syntax" error if we don't have this line.
          xhr.overrideMimeType( "application/json" );
        }
        xhr.open( "GET", butterOptions.config, false );
        xhr.send( null );

        if( xhr.status === 200 || xhr.status === 0 ){
          _config = JSON.parse( xhr.responseText ),
          readConfig();
        }
        else{
          _em.dispatch( "configerror", _this );
        } //if
      }
      else {
        _config = butterOptions.config;
        readConfig();
      } //if

    }; //ButterInit

    Butter.instances = __instances;

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

