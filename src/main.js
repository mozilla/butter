/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function () {

  var DEFAULT_TRACKEVENT_OFFSET = 0.01;

  var ACCEPTED_UA_LIST = {
    "Chrome": 17,
    "Firefox": 10,
    "MSIE": 9
  };

  define( [
            "core/eventmanager",
            "core/logger",
            "core/config",
            "core/target",
            "core/media",
            "core/page",
            "./modules",
            "./dependencies",
            "./dialogs",
            "dialog/dialog",
            "editor/editor",
            "ui/ui",
            "util/xhr",
            "util/lang",
            "text!default-config.json",
            "text!layouts/ua-warning.html",
            "ui/widget/tooltip",
            "util/shims"                  // keep this at the end so it doesn't need a spot in the function signature
          ],
          function(
            EventManagerWrapper,
            Logger,
            Config,
            Target,
            Media,
            Page,
            Modules,
            Dependencies,
            Dialogs,
            Dialog,
            Editor,
            UI,
            XHR,
            Lang,
            DefaultConfigJSON,
            UA_WARNING_LAYOUT,
            ToolTip
          ){

    var __guid = 0,
        __instances = [];

    var Butter = function( options ){
      return new ButterInit( options );
    }; //Butter

    Butter.ToolTip = ToolTip;

    Butter.showUAWarning = function() {
      var uaWarningDiv = Lang.domFragment( UA_WARNING_LAYOUT, ".butter-ua-warning" );
      document.body.appendChild( uaWarningDiv );
      uaWarningDiv.classList.add( "slide-out" );
      uaWarningDiv.getElementsByClassName( "close-button" )[0].onclick = function () {
        document.body.removeChild( uaWarningDiv );
      };
    };

    function ButterInit( butterOptions ){

      var ua = navigator.userAgent,
          acceptedUA;
      for ( var uaName in ACCEPTED_UA_LIST ) {
        if( ACCEPTED_UA_LIST.hasOwnProperty( uaName ) ) {
          var uaRegex = new RegExp( uaName + "(?:/|\\s)([0-9]+)\\.", "g" ),
              match = uaRegex.exec( ua );
          if ( match && match.length === 2 && Number( match[ 1 ] ) >= ACCEPTED_UA_LIST[ uaName ] ) {
            acceptedUA = uaName + "/" + match[ 1 ];
          }
        }
      }

      if ( !acceptedUA ) {
        Butter.showUAWarning();
      }

      butterOptions = butterOptions || {};

      var _media = [],
          _currentMedia,
          _targets = [],
          _id = "Butter" + __guid++,
          _logger = new Logger( _id ),
          _page,
          _config,
          _defaultConfig,
          _defaultTarget,
          _this = this,
          _selectedEvents = [],
          _defaultPopcornScripts = {},
          _defaultPopcornCallbacks = {},
          _defaultTrackeventDuration;

      // We use the default configuration in src/default-config.json as
      // a base, and override whatever the user provides in the
      // butterOptions.config file.
      try {
        _defaultConfig = Config.parse( DefaultConfigJSON );
      } catch ( e) {
        throw "Butter Error: unable to find or parse default-config.json";
      }

      if ( butterOptions.debug !== undefined ) {
        Logger.enabled( butterOptions.debug );
      }

      EventManagerWrapper( _this );

      // Leave a reference on the instance to expose dialogs to butter users at runtime.
      // Especially good for letting people use/create dialogs without being in the butter core.
      this.dialog = Dialog;

      this.project = {
        id: null,
        name: null,
        data: null,
        template: null,
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

      function trackEventRequested( element, media, target ){
        var track,
            type = element.getAttribute( "data-popcorn-plugin-type" ),
            start = media.currentTime,
            end;

        if( start > media.duration ){
          start = media.duration - _defaultTrackeventDuration;
        }

        if( start < 0 ){
          start = 0;
        }

        end = start + _defaultTrackeventDuration;

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
        var trackEvent = trackEventRequested( e.data, e.target, _currentMedia.target );
        _this.dispatch( "trackeventcreated", {
          trackEvent: trackEvent,
          by: "media"
        });
      }

      function onTrackEventSelected( e ) {
        _selectedEvents.push( e.target );
      }

      function onTrackEventDeSelected( e ) {
        var trackEvent = e.target,
            idx = _selectedEvents.indexOf( trackEvent );
        if ( idx > -1 ) {
          _selectedEvents.splice( idx, 1 );
        }
      }

      function onTrackEventRemoved( e ) {
        var trackEvent = e.data,
            idx = _selectedEvents.indexOf( trackEvent );
        if ( idx > -1 ) {
          _selectedEvents.splice( idx, 1 );
        }
      }

      this.deselectAllTrackEvents = function() {
        // selectedEvents' length will change as each trackevent's selected property
        // is set to false, so use a while loop here to loop through the continually
        // shrinking selectedEvents array.
        while ( _selectedEvents.length ) {
          _selectedEvents[ 0 ].selected = false;
        }
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
        var oldTarget,
            targetData,
            i, l;

        if ( projectData.targets ) {
          for ( i = 0, l = projectData.targets.length; i < l; ++i ) {
            targetData = projectData.targets[ i ];
            oldTarget = _this.getTargetByType( "elementID", targetData.element );
            // Only add target if it's not already added.
            if ( !oldTarget ) {
              _this.addTarget( targetData );
            }
            else {
              // If it was already added, just update its json.
              oldTarget.json = targetData;
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
        var allTrackEvents = this.orderedTrackEvents;

        while( allTrackEvents.length > 0 ) {
          allTrackEvents[ 0 ].track.removeTrackEvent( allTrackEvents[ 0 ] );
        }
        while( _targets.length > 0 ){
          _targets[ 0 ].destroy();
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
          if ( media ) {
            media.makeVideoURLsUnique = _config.value( "makeVideoURLsUnique" );
          }
          media = new Media( media );
        } //if
        media.maxPluginZIndex = _config.value( "maxPluginZIndex" );

        media.popcornCallbacks = _defaultPopcornCallbacks;
        media.popcornScripts = _defaultPopcornScripts;

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
          "trackorderchanged"
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

        media.listen( "trackeventremoved", onTrackEventRemoved );
        media.listen( "trackeventselected", onTrackEventSelected );
        media.listen( "trackeventdeselected", onTrackEventDeSelected );

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
            "trackorderchanged"
          ]);
          var tracks = media.tracks;
          for ( var i=0, l=tracks.length; i<l; ++i ) {
            _this.dispatch( "trackremoved", tracks[ i ] );
          } //for
          if ( media === _currentMedia ) {
            _currentMedia = undefined;
          } //if

          media.unlisten( "trackeventremoved", onTrackEventRemoved );
          media.unlisten( "trackeventselected", onTrackEventSelected );
          media.unlisten( "trackeventdeselected", onTrackEventDeSelected );

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
       * Trackevents
       ****************************************************************/
      // Selects all track events for which TrackEvent.property === query.
      // If the third param is true, it selects track events for which TrackEvent.popcornOptions.property === query.
      this.getTrackEvents = function ( property, query, popcornOption ) {

        var allTrackEvents = this.orderedTrackEvents,
            _filterTrackEvents;

        if ( !property ) {
          return allTrackEvents;
        }

        if ( popcornOption ) {
           _filterTrackEvents = function ( el ) {
              return ( el.popcornOptions[ property ] === query );
            };
        } else {
          _filterTrackEvents = function ( el ) {
            return ( el[ property ] === query );
          };
        }

        return allTrackEvents.filter( _filterTrackEvents );
      };

      // Selects all track events for which TrackEvent.type === query
      this.getTrackEventsByType = function ( query ) {
        return this.getTrackEvents( "type", query );
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
          enumerable: true
        },
        debug: {
          get: function() {
            return Logger.enabled();
          },
          set: function( value ) {
            Logger.enabled( value );
          },
          enumerable: true
        }
      });

      var preparePage = this.preparePage = function( callback ){
        var scrapedObject = _page.scrape(),
            targets = scrapedObject.target,
            medias = scrapedObject.media;

        _page.prepare(function() {
          if ( !!_config.value( "scrapePage" ) ) {
            var i, j, il, jl, url, oldTarget, oldMedia, mediaPopcornOptions, mediaObj;
            for( i = 0, il = targets.length; i < il; ++i ) {
              // Only add targets that don't already exist.
              oldTarget = _this.getTargetByType( "elementID", targets[ i ].element );
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

              if( _media.length > 0 ){
                for( j = 0, jl = _media.length; j < jl; ++j ){
                  if( _media[ j ].id !== medias[ i ].id && _media[ j ].url !== url ){
                    oldMedia = _media[ j ];
                    break;
                  } //if
                } //for
              }
              else{
                if( _config.value( "mediaDefaults" ) ){
                  mediaPopcornOptions = _config.value( "mediaDefaults" );
                }
              } //if

              if( !oldMedia ){
                _this.addMedia({ target: medias[ i ].id, url: url, popcornOptions: mediaPopcornOptions });
              }
            } //for
          }

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
        var popcornConfig = _config.value( "popcorn" ) || {},
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

      /**
       * loadFromSavedDataUrl
       *
       * Attempts to load project data from a specified url and parse it using JSON functionality.
       *
       * @param {String} savedDataUrl: The url from which to attempt to load saved project data.
       * @param {Function} responseCallback: A callback function which is called upon completion (successful or not).
       * @returns: If successfull, an object is returned containing project data. Otherwise, null.
       */
      function loadFromSavedDataUrl( savedDataUrl, responseCallback ) {
        // if no valid url was provided, return early
        if ( !savedDataUrl ) {
          responseCallback();
          return;
        }

        savedDataUrl += "?noCache=" + Date.now();

        XHR.getUntilComplete(
          savedDataUrl,
          function() {
            var savedData;
            try{
              savedData = JSON.parse( this.responseText );
            }
            catch( e ){
              _this.dispatch( "loaddataerror", "Saved data not formatted properly." );
            }
            responseCallback( savedData );
          },
          "application/json",
          {
            "If-Modified-Since": "Fri, 01 Jan 1960 00:00:00 GMT"
          },
          true );
      }

      /**
       * attemptDataLoad
       *
       * Attempts to identify a url from from the query string or supplied config. If one is
       * found, an attempt to load data from the url is made which is imported as project data if successful.
       *
       * @param {Function} finishedCallback: Callback to be called when data loading has completed (successfully or not).
       */
      function attemptDataLoad( finishedCallback ) {
        var savedDataUrl;

        // see if savedDataUrl is in the page's query string
        window.location.search.substring( 1 ).split( "&" ).forEach(function( item ){
          item = item.split( "=" );
          if ( item && item[ 0 ] === "savedDataUrl" ) {
            savedDataUrl = item[ 1 ];
          }
        });

        function doImport( savedData ) {
          _this.project.id = savedData.projectID;
          _this.project.name = savedData.name;
          _this.project.author = savedData.author;
          _this.importProject( savedData );
        }

        // attempt to load data from savedDataUrl in query string
        loadFromSavedDataUrl( savedDataUrl, function( savedData ) {
          if ( !savedData || savedData.error ) {
            // if previous attempt failed, try loading data from the savedDataUrl value in the config
            loadFromSavedDataUrl( _config.value( "savedDataUrl" ), function( savedData ) {
              if ( savedData ) {
                doImport( savedData );
              }
              finishedCallback();
            });
          }
          else {
            // otherwise, attempt import
            doImport( savedData );
            finishedCallback();
          }
        });

      }

      function readConfig( userConfig ){
        // Override default config options with user settings (if any).
        if( userConfig ){
          _defaultConfig.override( userConfig );
        }

        _config = _defaultConfig;
        _defaultTrackeventDuration = _config.value( "trackEvent" ).defaultDuration;

        _this.project.template = _config.value( "name" );

        //prepare modules first
        var moduleCollection = Modules( Butter, _this, _config ),
            loader = Dependencies( _config );

        _this.loader = loader;

        _page = new Page( loader, _config );

        _this.ui = new UI( _this  );

        _this.ui.load(function(){
          //prepare the page next
          preparePopcornScriptsAndCallbacks(function(){
            preparePage(function(){
              moduleCollection.ready(function(){
                attemptDataLoad(function(){
                  //fire the ready event
                  _this.dispatch( "ready", _this );
                });
              });
            });
          });
        });

      } //readConfig

      if( butterOptions.config && typeof( butterOptions.config ) === "string" ){
        var xhr = new XMLHttpRequest(),
          userConfig,
          url = butterOptions.config + "?noCache=" + Date.now();

        xhr.open( "GET", url, false );
        if( xhr.overrideMimeType ){
          // Firefox generates a misleading "syntax" error if we don't have this line.
          xhr.overrideMimeType( "application/json" );
        }
        // Deal with caching
        xhr.setRequestHeader( "If-Modified-Since", "Fri, 01 Jan 1960 00:00:00 GMT" );
        xhr.send( null );

        if( xhr.status === 200 || xhr.status === 0 ){
          try{
            userConfig = Config.parse( xhr.responseText );
          }
          catch( e ){
            throw new Error( "Butter config file not formatted properly." );
          }
          readConfig( userConfig );
        }
        else{
          _this.dispatch( "configerror", _this );
        } //if
      }
      else {
        readConfig( butterOptions.config );
      } //if

      this.page = _page;

    }

    Butter.Editor = Editor;

    Butter.instances = __instances;

    // Butter will report a version, which is the git commit sha
    // of the version we ship.  This happens in make.js's build target.
    Butter.version = "@VERSION@";

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

