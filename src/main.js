/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function () {

  var DEFAULT_TRACKEVENT_DURATION = 1,
      DEFAULT_TRACKEVENT_OFFSET = 0.01;

  define( [
            "./core/eventmanager",
            "./core/logger",
            "./core/target",
            "./core/media",
            "./core/page",
            "./modules",
            "./dependencies",
            "ui/ui",
            "util/xhr"
          ],
          function(
            EventManagerWrapper,
            Logger,
            Target,
            Media,
            Page,
            Modules,
            Dependencies,
            UI,
            XHR
          ){

    var __guid = 0,
        __instances = [];

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
          _page,
          _config = {
            ui: {},
            icons: {},
            dirs: {}
          },
          _defaultTarget,
          _this = this,
          _selectedEvents = [],
          _defaultPopcornScripts = {},
          _defaultPopcornCallbacks = {};

      if ( butterOptions.debug !== undefined ) {
        Logger.debug( butterOptions.debug );
      }

      EventManagerWrapper( _this );

      this.project = {
        id: null,
        name: null,
        data: null,
        html: null,
        template: null
      };

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
          media.push( _media[ i ].generatePopcornString() );
        } //for
        return _page.getHTML( media );
      }; //getHTML

      function trackEventRequested( element, media, target ){
        var track,
            type = element.getAttribute( "data-butter-plugin-type" ),
            start = media.currentTime,
            end;

        if( start > media.duration ){
          start = media.duration - DEFAULT_TRACKEVENT_DURATION;
        }

        if( start < 0 ){
          start = 0;
        }

        end = start + DEFAULT_TRACKEVENT_DURATION;

        if( end > media.duration ){
          end = media.duration;
        }

        if( !type ){
          _logger.log( "Invalid trackevent type requested." );
          return;
        } //if

        if( media.tracks.length === 0 ){
          media.addTrack();
        } //if
        track = media.tracks[ 0 ];
        var trackEvent = track.addTrackEvent({
          type: type,
          popcornOptions: {
            start: start,
            end: end,
            target: target
          }
        });

        if( media.currentTime < media.duration - DEFAULT_TRACKEVENT_OFFSET ){
          media.currentTime += DEFAULT_TRACKEVENT_OFFSET;
        }

        return trackEvent;
      }

      function targetTrackEventRequested( e ){
        if( _currentMedia ){
          var trackEvent = trackEventRequested( e.data.element, _currentMedia, e.target.elementID );
          _this.dispatch( "trackeventcreated", {
            trackEvent: trackEvent,
            by: "target"
          });
        }
        else {
          _logger.log( "Warning: No media to add dropped trackevent." );
        } //if
      } //targetTrackEventRequested

      function mediaPlayerTypeRequired( e ){
        _page.addPlayerType( e.data );
      }

      function mediaTrackEventRequested( e ){
        var trackEvent = trackEventRequested( e.data, e.target, "Media Element" );
        _this.dispatch( "trackeventcreated", {
          trackEvent: trackEvent,
          by: "media"
        });
      }

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
        _this.dispatch( "targetadded", target );
        if( target.isDefault ){
          _defaultTarget = target;
        } //if
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
          _this.dispatch( "targetremoved", target );
          if( _defaultTarget === target ){
            _defaultTarget = undefined;
          } //if
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
        var i,
            l;

        if ( projectData.targets ) {
          for ( i = 0, l = projectData.targets.length; i < l; ++i ) {

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
          for ( i = 0, l = projectData.media.length; i < l; ++i ) {

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

      this.clearProject = function(){
        while( _targets.length > 0 ){
          _this.removeTarget( _targets[ 0 ] );
        }
        while( _media.length > 0 ){
          _media[ 0 ].destroy();
          _this.removeMedia( _media[ 0 ] );
        }
      };

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

        media.popcornCallbacks = _defaultPopcornCallbacks;
        media.popcornScripts = _defaultPopcornScripts;

        var mediaName = media.name;
        _media.push( media );

        _this.chain( media, [
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

        var trackEvents;
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
        media.listen( "mediaplayertyperequired", mediaPlayerTypeRequired );

        _this.dispatch( "mediaadded", media );
        if ( !_currentMedia ) {
          _this.currentMedia = media;
        } //if
        media.setupContent();
        return media;
      }; //addMedia

      //removeMedia - forget a media object
      this.removeMedia = function ( media ) {

        var idx = _media.indexOf( media );
        if ( idx > -1 ) {
          _media.splice( idx, 1 );
          _this.unchain( media, [
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
            _this.dispatch( "trackremoved", tracks[ i ] );
          } //for
          if ( media === _currentMedia ) {
            _currentMedia = undefined;
          } //if

          media.unlisten( "trackeventrequested", mediaTrackEventRequested );
          media.unlisten( "mediaplayertyperequired", mediaPlayerTypeRequired );

          _this.dispatch( "mediaremoved", media );
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
        defaultTarget: {
          enumerable: true,
          get: function(){
            return _defaultTarget;
          }
        },
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
              _this.dispatch( "mediachanged", media );
              return _currentMedia;
            } //if
          },
          enumerable: true
        },
        selectedEvents: {
          get: function() {
            return _selectedEvents;
          },
          set: function(selectedEvents) {
            _selectedEvents = selectedEvents;
          },
          enumerable: true
        },
        debug: {
          get: function() {
            return Logger.debug();
          },
          set: function( value ) {
            Logger.debug( value );
          },
          enumerable: true
        }
      });

      var preparePage = this.preparePage = function( callback ){
        var scrapedObject = _page.scrape(),
            targets = scrapedObject.target,
            medias = scrapedObject.media;

        _page.prepare(function() {
          var i, j, il, jl, url, oldTarget, oldMedia, mediaPopcornOptions, mediaObj;
          for( i = 0, il = targets.length; i < il; ++i ) {
            oldTarget = null;
            if( _targets.length > 0 ){
              for( j = 0, jl = _targets.length; j < jl; ++j ){
                // don't add the same target twice
                if( _targets[ j ].id === targets[ i ].id ){
                  oldTarget = _targets[ j ];
                  break;
                } //if
              } //for j
            }

            if( !oldTarget ){
              _this.addTarget({ element: targets[ i ].id });
            }
          }

          for( i = 0, il = medias.length; i < il; i++ ) {
            oldMedia = null;
            mediaPopcornOptions = null;
            url = "";
            mediaObj = medias[ i ];

            if( mediaObj.getAttribute( "data-butter-source" ) ){
              url = mediaObj.getAttribute( "data-butter-source" );
            }
            else if( [ "VIDEO", "AUDIO" ].indexOf( mediaObj.nodeName ) > -1 ) {
              url = mediaObj.currentSrc;
            }

            if( _media.length > 0 ){
              for( j = 0, jl = _media.length; j < jl; ++j ){
                if( _media[ j ].id !== medias[ i ].id && _media[ j ].url !== url ){
                  oldMedia = _media[ j ];
                  break;
                } //if
              } //for
            }
            else{
              if( _config.mediaDefaults ){
                mediaPopcornOptions = _config.mediaDefaults;
              }
            } //if

            if( !oldMedia ){
              _this.addMedia({ target: medias[ i ].id, url: url, popcornOptions: mediaPopcornOptions });
            }
          } //for

          if( callback ){
            callback();
          } //if
          _this.dispatch( "pageready" );
        });
      }; //preparePage

      __instances.push( this );

      if( butterOptions.ready ){
        _this.listen( "ready", function( e ){
          butterOptions.ready( e.data );
        });
      } //if

      var preparePopcornScriptsAndCallbacks = this.preparePopcornScriptsAndCallbacks = function( readyCallback ){
        var popcornConfig = _config.popcorn || {},
            callbacks = popcornConfig.callbacks,
            scripts = popcornConfig.scripts,
            toLoad = [],
            loaded = 0;

        // wrap the load function to remember the script
        function genLoadFunction( script ){
          return function( e ){
            // this = XMLHttpRequest object
            if( this.readyState === 4 ){

              // if the server sent back a bad response, record empty string and log error
              if( this.status !== 200 ){
                _defaultPopcornScripts[ script ] = "";
                _logger.log( "WARNING: Trouble loading Popcorn script: " + this.response );
              }
              else{
                // otherwise, store the response as text
                _defaultPopcornScripts[ script ] = this.response;
              }

              // see if we can call the readyCallback yet
              ++loaded;
              if( loaded === toLoad.length && readyCallback ){
                readyCallback();
              }

            }
          };
        }

        _defaultPopcornCallbacks = callbacks;

        for( var script in scripts ){
          if( scripts.hasOwnProperty( script ) ){
            var url = scripts[ script ],
                probableElement = document.getElementById( url.substring( 1 ) );
            // check to see if an element on the page contains the script we want
            if( url.indexOf( "#" ) === 0 ){
              if( probableElement ){
                _defaultPopcornScripts[ script ] = probableElement.innerHTML;
              }
            }
            else{
              // if not, treat it as a url and try to load it
              toLoad.push({
                url: url,
                onLoad: genLoadFunction( script )
              });
            }
          }
        }

        // if there are scripts to load, load them
        if( toLoad.length > 0 ){
          for( var i = 0; i < toLoad.length; ++i ){
            XHR.get( toLoad[ i ].url, toLoad[ i ].onLoad );
          }
        }
        else{
          // otherwise, call the ready callback right away
          readyCallback();
        }
      };

      function readConfig(){
        var icons = _config.icons,
            img,
            resourcesDir = _config.dirs.resources || "";

        _this.project.template = _config.name;

        for( var identifier in icons ){
          if( icons.hasOwnProperty( identifier ) ){
            img = document.createElement( "img" );
            img.src = resourcesDir + icons[ identifier ];
            img.id = identifier + "-icon";
            img.style.display = "none";
            img.setAttribute( "data-butter-exclude", "true" );
            // @secretrobotron: just attach this to the body hidden for now,
            //                  so that it preloads if necessary
            document.body.appendChild( img );
          } //if
        } //for

        //prepare modules first
        var moduleCollection = Modules( _this, _config ),
            loader = Dependencies( _config );

        _this.loader = loader;

        _page = new Page( loader, _config );

        _this.ui = new UI( _this, _config.ui );

        _this.ui.load(function(){
          //prepare the page next
          preparePopcornScriptsAndCallbacks(function(){
            preparePage(function(){
              moduleCollection.ready(function(){
                if( _config.snapshotHTMLOnReady ){
                  _page.snapshotHTML();
                }
                //fire the ready event
                _this.dispatch( "ready", _this );
              });
            });
          });
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
          try{
            _config = JSON.parse( xhr.responseText );
          }
          catch( e ){
            throw new Error( "Butter config file not formatted properly." );
          }
          readConfig();
        }
        else{
          _this.dispatch( "configerror", _this );
        } //if
      }
      else {
        _config = butterOptions.config;
        readConfig();
      } //if

      this.page = _page;

    }

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

}());

