/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

// Since template.js will be ready before Butter, prepare a shim
window.Butter = {
  init: function() {
    if ( window.Butter.__waiting ) {
      throw "Butter: can't create more than one instance per document.";
    }
    window.Butter.__waiting = arguments;
  }
};

(function init() {

  // If we need to load requirejs before loading butter, make it so
  if ( typeof define === "undefined" ) {
    var rscript = document.createElement( "script" );
    rscript.onload = function() {
      init();
    };
    rscript.src = "/external/require/require.js";
    document.head.appendChild( rscript );
    return;
  }

  var ACCEPTED_UA_LIST = {
    "Chrome": 17,
    "Firefox": 10,
    "IE": 9,
    "Safari": 6,
    "Opera": 12
  },

  MOBILE_OS_BLACKLIST = [
    "Android",
    "iOS",
    "BlackBerry",
    "MeeGo",
    "Windows Phone OS",
    "Firefox OS",
    // For BB Playbook
    "RIM Tablet OS"
  ],

  UA_WARNING_TEXT = "Your web browser may lack some functionality expected" +
    " by Popcorn Maker to function properly. Please upgrade your browser or" +
    " <a href=\"https://webmademovies.lighthouseapp.com/projects/65733-popcorn-maker\">" +
    "file a bug</a> to find out why your browser isn't fully supported. Click " +
    "<a href=\"#\" class=\"close-button\">here</a> to remove this warning.";

  var require = requirejs.config({
    baseUrl: "/src"
  });

  define( "butter-main",
          [
            "core/eventmanager", "core/logger", "core/config", "core/track",
            "core/target", "core/media",
            "./modules", "./dependencies", "./dialogs",
            "dialog/dialog", "editor/editor", "ui/ui",
            "util/xhr2", "util/lang", "util/tutorial",
            "util/warn", "text!default-config.json",
            "ui/widget/tooltip", "crashreporter", "core/project",
            "../external/ua-parser/ua-parser"
          ],
          function(
            EventManager, Logger, Config, Track,
            Target, Media,
            Modules, Dependencies, Dialogs,
            Dialog, Editor, UI,
            xhr, Lang, Tutorial,
            Warn, DEFAULT_CONFIG_JSON,
            ToolTip, CrashReporter, Project,
            UAParser
          ){

    var __guid = 0;

    var Butter = {};

    Butter.ToolTip = ToolTip;

    Butter.init = function( butterOptions ) {

      // ua-parser uses the current browsers UA by default
      var ua = new UAParser().getResult(),
          name = ua.browser.name,
          major = ua.browser.major,
          os = ua.os.name,
          acceptedUA = false;

      for ( var uaName in ACCEPTED_UA_LIST ) {
        if ( ACCEPTED_UA_LIST.hasOwnProperty( uaName ) && MOBILE_OS_BLACKLIST.indexOf( os ) === -1 ) {
          if ( name === uaName ) {
            if ( +major >= ACCEPTED_UA_LIST[ uaName ] ) {
              acceptedUA = true;
            }
          }
        }
      }

      if ( !acceptedUA ) {
        Warn.showWarning( UA_WARNING_TEXT );
      }

      butterOptions = butterOptions || {};

      var _media = [],
          _currentMedia,
          _targets = [],
          _id = "Butter" + __guid++,
          _logger = new Logger( _id ),
          _config,
          _defaultConfig,
          _defaultTarget,
          _this = Object.create( Butter ),
          _selectedEvents = [],
          _copiedEvents = [],
          _sortedSelectedEvents = [],
          _defaultPopcornScripts = {},
          _defaultPopcornCallbacks = {},
          _defaultTrackeventDuration;

      // We use the default configuration in src/default-config.json as
      // a base, and override whatever the user provides in the
      // butterOptions.config file.
      try {
        _defaultConfig = Config.parse( DEFAULT_CONFIG_JSON );
      } catch ( e) {
        throw "Butter Error: unable to find or parse default-config.json";
      }

      if ( butterOptions.debug !== undefined ) {
        Logger.enabled( butterOptions.debug );
      }

      EventManager.extend( _this );

      // Leave a reference on the instance to expose dialogs to butter users at runtime.
      // Especially good for letting people use/create dialogs without being in the butter core.
      _this.dialog = Dialog;

      function checkMedia() {
        if ( !_currentMedia ) {
          throw new Error("No media object is selected");
        } //if
      } //checkMedia

      function getRelativePosition( position, type ) {

        var mediaPosition = _currentMedia.popcorn.popcorn.position(),
            manifestOptions = Popcorn.manifest[ type ].options,
            minWidth = manifestOptions.width ? manifestOptions.width.default : 0,
            minHeight = manifestOptions.height ? manifestOptions.height.default : 0,
            calculatedLeft = ( ( position[ 0 ] - mediaPosition.left ) / mediaPosition.width ) * 100,
            calculatedTop = ( ( position[ 1 ] - mediaPosition.top ) / mediaPosition.height ) * 100;

        if ( calculatedLeft + minWidth > 100 ) {
          calculatedLeft = 100 - minWidth;
        }

        if ( calculatedTop + minHeight > 100 ) {
          calculatedTop = 100 - minHeight;
        }

        return [ calculatedLeft, calculatedTop ];
      }

      _this.getManifest = function ( name ) {
        checkMedia();
        return _currentMedia.getManifest( name );
      }; //getManifest

      _this.generateSafeTrackEvent = function( type, popcornOptions, track, position ) {
        var trackEvent,
            relativePosition,
            start = popcornOptions.start,
            end = popcornOptions.end;

        if ( start + _defaultTrackeventDuration > _currentMedia.duration ) {
          start = _currentMedia.duration - _defaultTrackeventDuration;
        }

        if ( start < 0 ) {
          start = 0;
        }

        if ( !end && end !== 0 ) {
          end = start + _defaultTrackeventDuration;
        }

        if ( end > _currentMedia.duration ) {
          end = _currentMedia.duration;
        }

        if ( !_defaultTarget ) {
          console.warn( "No targets to drop events!" );
          return;
        }

        if ( !( track instanceof Track ) ) {
          if ( track && track.constructor === Array ) {
            position = track;
          }
          track = _currentMedia.orderedTracks[ 0 ];
        }

        track = track || _currentMedia.addTrack();

        if ( track.findOverlappingTrackEvent( start, end ) ) {
          track = _currentMedia.insertTrackBefore( track );
        }

        popcornOptions.start = start;
        popcornOptions.end = end;
        popcornOptions.target = _defaultTarget.elementID;

        if ( position ) {
          relativePosition = getRelativePosition( position, type );
          popcornOptions.left = relativePosition[ 0 ];
          popcornOptions.top = relativePosition[ 1 ];
        }

        trackEvent = track.addTrackEvent({
          popcornOptions: popcornOptions,
          type: type
        });

        _this.deselectAllTrackEvents();
        trackEvent.selected = true;

        _defaultTarget.view.blink();

        return trackEvent;
      };

      function targetTrackEventRequested( e ) {
        var trackEvent,
            popcornOptions = {},
            start = _currentMedia.currentTime;

        popcornOptions.start = start;

        if ( e.data.popcornOptions ) {
          for ( var prop in e.data.popcornOptions ) {
            if ( e.data.popcornOptions.hasOwnProperty( prop ) ) {
              popcornOptions[ prop ] = e.data.popcornOptions[ prop ];
            }
          }
        }

        if ( _currentMedia && _currentMedia.ready ) {
          if ( popcornOptions && popcornOptions.end ) {
            popcornOptions.end = popcornOptions.end + start;
          }
          trackEvent = _this.generateSafeTrackEvent( e.data.element.getAttribute( "data-popcorn-plugin-type" ), popcornOptions, e.data.position );
          _this.editor.editTrackEvent( trackEvent );
        }
        else {
          _logger.log( "Warning: No media to add dropped trackevent." );
        }
      }

      function mediaTrackEventRequested( e ) {
        var trackEvent;
        if ( _currentMedia.ready ) {
          trackEvent = _this.generateSafeTrackEvent( e.data.getAttribute( "data-popcorn-plugin-type" ), _currentMedia.currentTime );
          _this.editor.editTrackEvent( trackEvent );
        }
      }

      function trackEventTimeSortingFunction( a, b ) {
        return a.popcornOptions.start < b.popcornOptions.start ? 1 : -1;
      }

      function sortSelectedEvents() {
        _sortedSelectedEvents = _selectedEvents.slice().sort( trackEventTimeSortingFunction );
      }

      function onTrackEventSelected( notification ) {
        var trackEvent = notification.origin;
        for ( var i = _selectedEvents.length - 1; i >= 0; i-- ) {
          if ( _selectedEvents[ i ] === trackEvent ) {
            return;
          }
        }
        _selectedEvents.push( trackEvent );
        sortSelectedEvents();
      }

      function onTrackEventDeSelected( notification ) {
        var trackEvent = notification.origin,
            idx = _selectedEvents.indexOf( trackEvent );
        if ( idx > -1 ) {
          _selectedEvents.splice( idx, 1 );
          sortSelectedEvents();
        }
      }

      function onTrackEventAdded( e ) {
        var trackEvent = e.data;

        trackEvent.subscribe( "selected", onTrackEventSelected );
        trackEvent.subscribe( "deselected", onTrackEventDeSelected );

        if ( trackEvent.selected && _selectedEvents.indexOf( trackEvent ) === -1 ) {
          _selectedEvents.push( trackEvent );
          sortSelectedEvents();
        }
      }

      function onTrackEventRemoved( e ) {
        var trackEvent = e.data,
            idx = _selectedEvents.indexOf( trackEvent );

        trackEvent.unsubscribe( "selected", onTrackEventSelected );
        trackEvent.unsubscribe( "deselected", onTrackEventDeSelected );

        if ( idx > -1 ) {
          _selectedEvents.splice( idx, 1 );
          sortSelectedEvents();
        }
      }

      _this.deselectAllTrackEvents = function() {
        // selectedEvents' length will change as each trackevent's selected property
        // is set to false, so use a while loop here to loop through the continually
        // shrinking selectedEvents array.
        while ( _selectedEvents.length ) {
          _selectedEvents[ 0 ].selected = false;
        }
        _sortedSelectedEvents = [];
      };

      _this.copyTrackEvents = function() {
        if ( _sortedSelectedEvents.length ) {
          _copiedEvents = [];
          for ( var i = 0; i < _sortedSelectedEvents.length; i++ ) {
            _copiedEvents.unshift( _sortedSelectedEvents[ i ].copy() );
          }
        }
      };

      _this.pasteTrackEvents = function() {
        var popcornOptions,
            offset = 0,
            trackEvent;
        // get the first events start time to compare with the current time,
        // to find the paste offset.
        if ( _copiedEvents[ 0 ] ) {
          _this.deselectAllTrackEvents();
          offset = _currentMedia.currentTime - _copiedEvents[ 0 ].popcornOptions.start;
          for ( var i = 0; i < _copiedEvents.length; i++ ) {
            popcornOptions = {};
            for ( var prop in _copiedEvents[ i ].popcornOptions ) {
              if ( _copiedEvents[ i ].popcornOptions.hasOwnProperty( prop ) ) {
                popcornOptions[ prop ] = _copiedEvents[ i ].popcornOptions[ prop ];
              }
            }
            popcornOptions.start = popcornOptions.start + offset;
            popcornOptions.end = popcornOptions.end + offset;
            if ( popcornOptions.start > _currentMedia.duration ) {
              // do not paste events outside of the duration
              break;
            } else if ( popcornOptions.end > _currentMedia.duration ) {
              // cut off events that overlap the duration
              popcornOptions.end = _currentMedia.duration;
            }
            trackEvent = _this.generateSafeTrackEvent( _copiedEvents[ i ].type, popcornOptions );
            trackEvent.selected = true;
          }
        }
      };

       /****************************************************************
       * Target methods
       ****************************************************************/
      //addTarget - add a target object
      _this.addTarget = function ( target ) {
        if ( !(target instanceof Target ) ) {
          target = new Target( target );
        } //if
        _targets.push( target );
        target.listen( "trackeventrequested", targetTrackEventRequested );
        _logger.log( "Target added: " + target.name );
        _this.dispatch( "targetadded", target );
        if ( target.isDefault || !_defaultTarget ) {
          _defaultTarget = target;
        }
        return target;
      }; //addTarget

      //removeTarget - remove a target object
      _this.removeTarget = function ( target ) {
        if ( typeof(target) === "string" ) {
          target = _this.getTargetByType( "id", target );
        } //if
        var idx = _targets.indexOf( target );
        if ( idx > -1 ) {
          target.unlisten( "trackeventrequested", targetTrackEventRequested );
          _targets.splice( idx, 1 );
          _this.dispatch( "targetremoved", target );
          if ( _defaultTarget === target ) {
            _defaultTarget = _targets.length > 0 ? _targets[ 0 ] : null;
          }
          return target;
        }
        return null;
      };

      //serializeTargets - get a list of targets objects
      _this.serializeTargets = function () {
        var sTargets = [];
        for ( var i=0, l=_targets.length; i<l; ++i ) {
          sTargets.push( _targets[ i ].json );
        }
        return sTargets;
      }; //serializeTargets

      //getTargetByType - get the target's information based on a valid type
      // if type is invalid, return undefined
      _this.getTargetByType = function( type, val ) {
        for( var i = 0, l = _targets.length; i < l; i++ ) {
          if ( _targets[ i ][ type ] === val ) {
            return _targets[ i ];
          }
        }
        return undefined;
      }; //getTargetByType

      /****************************************************************
       * Media methods
       ****************************************************************/
      //getMediaByType - get the media's information based on a valid type
      // if type is invalid, return undefined
      _this.getMediaByType = function ( type, val ) {
       for( var i = 0, l = _media.length; i < l; i++ ) {
          if ( _media[ i ][ type ] === val ) {
            return _media[ i ];
          }
        }
        return undefined;
      }; //getMediaByType

      //addMedia - add a media object
      _this.addMedia = function ( media ) {
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

        media.listen( "trackeventadded", onTrackEventAdded );
        media.listen( "trackeventremoved", onTrackEventRemoved );

        media.listen( "trackeventrequested", mediaTrackEventRequested );

        _this.dispatch( "mediaadded", media );
        if ( !_currentMedia ) {
          _this.currentMedia = media;
        } //if
        media.setupContent();
        return media;
      }; //addMedia

      //removeMedia - forget a media object
      _this.removeMedia = function ( media ) {

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

          media.unlisten( "trackeventadded", onTrackEventAdded );
          media.unlisten( "trackeventremoved", onTrackEventRemoved );

          media.unlisten( "trackeventrequested", mediaTrackEventRequested );

          _this.dispatch( "mediaremoved", media );
          return media;
        } //if
        return undefined;
      }; //removeMedia

      /****************************************************************
       * Trackevents
       ****************************************************************/
      // Selects all track events for which TrackEvent.property === query.
      // If the third param is true, it selects track events for which TrackEvent.popcornOptions.property === query.
      _this.getTrackEvents = function ( property, query, popcornOption ) {
        var allTrackEvents = _this.orderedTrackEvents,
            filterTrackEvents;

        if ( !property ) {
          return allTrackEvents;
        }

        if ( popcornOption ) {
           filterTrackEvents = function ( el ) {
              return ( el.popcornOptions[ property ] === query );
            };
        } else {
          filterTrackEvents = function ( el ) {
            return ( el[ property ] === query );
          };
        }

        return allTrackEvents.filter( filterTrackEvents );
      };

      // Selects all track events for which TrackEvent.type === query
      _this.getTrackEventsByType = function ( query ) {
        return _this.getTrackEvents( "type", query );
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
        copiedEvents: {
          get: function() {
            return _copiedEvents;
          },
          enumerable: true
        },
        sortedSelectedEvents: {
          get: function() {
            return _sortedSelectedEvents;
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
        },
        defaultTrackeventDuration: {
          enumerable: true,
          get: function() {
            return _defaultTrackeventDuration;
          }
        }
      });

      var preparePage = _this.preparePage = function( callback ){
        var targets = document.body.querySelectorAll("*[data-butter='target']"),
            medias = document.body.querySelectorAll("*[data-butter='media']");

        if ( !!_config.value( "scrapePage" ) ) {
          var i, j, il, jl, url, oldTarget, oldMedia, mediaPopcornOptions, mediaObj;
          for ( i = 0, il = targets.length; i < il; ++i ) {
            // Only add targets that don't already exist.
            oldTarget = _this.getTargetByType( "elementID", targets[ i ].element );
            if ( !oldTarget ) {
              _this.addTarget({ element: targets[ i ].id });
            }
          }

          for ( i = 0, il = medias.length; i < il; i++ ) {
            oldMedia = null;
            mediaPopcornOptions = null;
            url = "";
            mediaObj = medias[ i ];

            if ( mediaObj.getAttribute( "data-butter-source" ) ) {
              url = mediaObj.getAttribute( "data-butter-source" );
            }

            if ( _media.length > 0 ) {
              for ( j = 0, jl = _media.length; j < jl; ++j ) {
                if ( _media[ j ].id !== medias[ i ].id && _media[ j ].url !== url ) {
                  oldMedia = _media[ j ];
                  break;
                }
              }
            } else {
              if ( _config.value( "mediaDefaults" ) ) {
                mediaPopcornOptions = _config.value( "mediaDefaults" );
              }
            }

            if ( !oldMedia ) {
              _this.addMedia({ target: medias[ i ].id, url: url, popcornOptions: mediaPopcornOptions });
            }
          }
        }

        if ( callback ) {
          callback();
        }

        _this.dispatch( "pageready" );
      };

      if ( butterOptions.ready ) {
        _this.listen( "ready", function( e ) {
          butterOptions.ready( e.data );
        });
      }

      var preparePopcornScriptsAndCallbacks = _this.preparePopcornScriptsAndCallbacks = function( readyCallback ){
        var popcornConfig = _config.value( "popcorn" ) || {},
            callbacks = popcornConfig.callbacks,
            scripts = popcornConfig.scripts,
            toLoad = [],
            loaded = 0;

        // wrap the load function to remember the script
        function genLoadFunction( script ){
          return function(){
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
            xhr.get( toLoad[ i ].url, toLoad[ i ].onLoad );
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

        xhr.get( savedDataUrl, responseCallback );
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
        var savedDataUrl,
            project = new Project( _this );

        // see if savedDataUrl is in the page's query string
        window.location.search.substring( 1 ).split( "&" ).forEach(function( item ){
          item = item.split( "=" );
          if ( item && item[ 0 ] === "savedDataUrl" ) {
            savedDataUrl = item[ 1 ];
          }
        });

        function doImport( savedData ) {
          project.import( savedData );

          if ( savedData.tutorial ) {
            Tutorial.build( _this, savedData.tutorial );
          }
        }

        // attempt to load data from savedDataUrl in query string
        loadFromSavedDataUrl( savedDataUrl, function( savedData ) {
          // if there's no savedData returned, or the returned object does not
          // contain a media attribute, load the config specified saved data
          if ( !savedData || savedData.error || !savedData.media ) {
            // if previous attempt failed, try loading data from the savedDataUrl value in the config
            loadFromSavedDataUrl( _config.value( "savedDataUrl" ), function( savedData ) {
              if ( savedData ) {
                doImport( savedData );
              }
              finishedCallback( project );
            });
          }
          else {
            // otherwise, attempt import
            doImport( savedData );
            finishedCallback( project );
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

        //prepare modules first
        var moduleCollection = new Modules( Butter, _this, _config ),
            loader = new Dependencies( _config );

        _this.loader = loader;

        _this.ui = new UI( _this  );

        _this.ui.load(function(){
          //prepare the page next
          preparePopcornScriptsAndCallbacks( function(){
            preparePage( function(){
              moduleCollection.ready( function(){
                // We look for an old project backup in localStorage and give the user
                // a chance to load or discard. If there isn't a backup, we continue
                // loading as normal.
                Project.checkForBackup( _this, function( projectBackup, backupDate ) {

                  function useProject( project ) {
                    project.template = project.template || _config.value( "name" );
                    _this.project = project;
                    _this.chain( project, [ "projectchanged", "projectsaved" ] );

                    // Fire the ready event
                    _this.dispatch( "ready", _this );
                  }

                  if( projectBackup ) {
                    // Found backup, ask user what to do
                    var _dialog = Dialog.spawn( "backup", {
                      data: {
                        backupDate: backupDate,
                        projectName: projectBackup.name,
                        loadProject: function() {
                          // Build a new Project and import projectBackup data
                          var project = new Project( _this );
                          project.import( projectBackup );
                          useProject( project );
                        },
                        discardProject: function() {
                          projectBackup = null;
                          attemptDataLoad( useProject );
                        }
                      }
                    });
                    _dialog.open();
                  } else {
                    // No backup found, keep loading
                    attemptDataLoad( useProject );
                  }
                });
              });
            });
          });
        });

      } //readConfig

      if( butterOptions.config && typeof( butterOptions.config ) === "string" ){
        xhr.get( butterOptions.config, function( response ) {
          var userConfig = Config.reincarnate( response );
          readConfig( userConfig );
        });
      }
      else {
        readConfig( Config.reincarnate( butterOptions.config ) );
      } //if

      // Attach the instance to Butter so we can debug
      Butter.app = _this;

      return _this;
    };

    Butter.Editor = Editor;

    // Butter will report a version, which is the git commit sha
    // of the version we ship. This happens in make.js's build target.
    Butter.version = "@VERSION@";

    // See if we have any waiting init calls that happened before we loaded require.
    if ( window.Butter ) {
      var args = window.Butter.__waiting;
      delete window.Butter;
      if ( args ) {
        Butter.init.apply( this, args );
      }
    }

    window.Butter = Butter;

    return Butter;
  });

  // butter depends on popcorn, so don't change this unless you know what you're doing
  require([ "util/shims", "../external/jsSHA/sha1" ], function() {
    require([ "popcorn" ], function() {
      require([ "butter-main" ]);
    });
  });

}());
