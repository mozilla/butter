/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/logger", "core/eventmanager" ], function( Logger, EventManager ) {

  // regex to determine the type of player we need to use based on the provided url
  var __urlRegex = /(?:http:\/\/www\.|http:\/\/|www\.|\.|^)(youtu|vimeo|soundcloud|baseplayer)/;

      // how long to wait for the status of something in checkTimeoutLoop
  var STATUS_INTERVAL = 100,
      // timeout duration to wait for popcorn players to exist
      PLAYER_WAIT_DURATION = 10000,
      // timeout duration to wait for media to be ready
      MEDIA_WAIT_DURATION = 10000;

  /* The Popcorn-Wrapper wraps various functionality and setup associated with
   * creating, updating, and removing associated data with Popcorn.js.
   */
  return function ( mediaId, options ){

    var _id = mediaId,
        _logger = new Logger( _id + "::PopcornWrapper" ),
        _popcornEvents = options.popcornEvents || {},
        _onPrepare = options.prepare || function(){},
        _onFail = options.fail || function(){},
        _onPlayerTypeRequired = options.playerTypeRequired || function(){},
        _onTimeout = options.timeout || function(){},
        _url = options.setup && options.setup.url,
        _target = options.target && options.setup.target,
        _popcorn,
        _mediaType,
        _popcornTarget,
        _butterEventMap = {},
        _mediaLoadAttempts = 0,
        _interruptLoad = false,
        _playerReady = false,
        _this = this;

    /* Destroy popcorn bindings specfically without touching other discovered
     * settings
     */
    this.unbind = function(){
      try{
        _popcorn.destroy();
        _popcorn = undefined;
      }
      catch( e ){
        _logger.log( "WARNING: Popcorn did NOT get destroyed properly: \n" + e.message + "\n" + e.stack );
      } //try
    };

    /* Setup any handlers that were defined in the options passed into
     * popcorn wrapper. Events such as timeupdate, paused, etc
     */
    function addPopcornHandlers(){
      for( var eventName in _popcornEvents ){
        _popcorn.on( eventName, _popcornEvents[ eventName ] );
      } //for
    } //addPopcornHandlers

    // Cancel loading or preparing of media whilst attempting to setup
    this.interruptLoad = function(){
      _interruptLoad = true;
    }; //interrupt

    // Update Popcorn events with data from a butter trackevent
    this.updateEvent = function( trackEvent ){
      var options = trackEvent.popcornOptions,
          butterId = trackEvent.id,
          popcornId = _butterEventMap[ butterId ];
      /* ensure that the trackevent actually exists before removal.
      * we remove the trackevent because there is no easy way
      * to ensure what data has changed on any given track. It
      * is easier to remove the old and create a new trackevent with the updated
      * options
      */
      if( _popcorn ){
        if( popcornId && _popcorn.getTrackEvent( popcornId ) ){
          _popcorn.removeTrackEvent( popcornId );
        } //if
        // make sure the plugin is still included
        if( _popcorn[ trackEvent.type ] ){
          // create the trackevent
          _popcorn[ trackEvent.type ]( options );
          // store a local reference to the newly created trackevent
          _butterEventMap[ butterId ] = _popcorn.getLastTrackEventId();

          if( trackEvent.view ){
            var popcornEvent = _popcorn.getTrackEvent( _butterEventMap[ butterId ] );
            if( popcornEvent.toString ){
              trackEvent.view.setToolTip( popcornEvent.toString() );
            }
            else{
              trackEvent.view.setToolTip( JSON.stringify( options ) );
            }
          }
        } //if
      } //if
    }; //updateEvent

    // Destroy a Popcorn trackevent
    this.destroyEvent = function( trackEvent ){
      var options = trackEvent.popcornOptions,
          butterId = trackEvent.id,
          popcornId = _butterEventMap[ butterId ];

      // ensure the trackevent actually exists before we remove it
      if( _popcorn ){
        if( popcornId && _popcorn.getTrackEvent( popcornId ) ){
          _popcorn.removeTrackEvent( popcornId );
        } //if

        // remove the reference to the trackevent id that we stored in updateEvent
        delete _butterEventMap[ butterId ];
      } //if
    }; //destroyEvent

    /* Create functions for various failure and success cases,
     * generate the Popcorn string and ensures our player is ready
     * before we actually create the Popcorn instance and notify the
     * user.
     */
    this.prepare = function( url, target, popcornOptions, callbacks, scripts ){

      // called when timeout occurs preparing popcorn or the media
      function timeoutWrapper( e ){
        _interruptLoad = true;
        _onTimeout( e );
      }

      // called when there's a serious failure in preparing popcorn
      function failureWrapper( e ){
        _interruptLoad = true;
        _logger.log( e );
        _onFail( e );
      }

      // discover and stash the type of media as dictated by the url
      findMediaType( url );

      // if there isn't a target, we can't really set anything up, so stop here
      if( !target ){
        _logger.log( "Warning: tried to prepare media with null target." );
        return;
      }

      // only enter this block if popcorn doesn't already exist (call clear() first to destroy it)
      if( !_popcorn ) {
        try {
          // make sure popcorn is setup properly: players, etc
          waitForPopcorn( function(){
            // construct the correct dom infrastructure if required
            constructPlayer( target );
            // generate a function which will create a popcorn instance when entered into the page
            createPopcorn( generatePopcornString( popcornOptions, url, target, null, callbacks, scripts ) );
            // once popcorn is created, attach listeners to it to detect state
            addPopcornHandlers();
            // wait for the media to become available and notify the user, or timeout
            waitForMedia( _onPrepare, timeoutWrapper );
          }, timeoutWrapper );
        }
        catch( e ) {
          // if we've reached here, we have an internal failure in butter or popcorn
          failureWrapper( e );
        }
      }

    };

    /* Determine the type of media that is going to be used
     * based on the specified url
     */
    function findMediaType( url ){
      var regexResult = __urlRegex.exec( url );
      if ( regexResult ) {
        _mediaType = regexResult[ 1 ];
        // our regex only handles youtu ( incase the url looks something like youtu.be )
        if ( _mediaType === "youtu" ) {
          _mediaType = "youtube";
        }
      }
      else {
        // if the regex didn't return anything we know it's an HTML5 source
        _mediaType = "object";
      }
      return _mediaType;
    }

    /* If possible and necessary, reformat the dom to conform to the url type specified
     * for the media. For example, youtube/vimeo players like <div>'s, not <video>'s to
     * dwell in.
     */
    function constructPlayer( target ){
      var script,
          targetElement = document.getElementById( target );

      if( _mediaType !== "object" && targetElement ) {
        if( [ "VIDEO", "AUDIO" ].indexOf( targetElement.nodeName ) !== -1 ) {
          var parentNode = targetElement.parentNode,
              newElement = document.createElement( "div" );

          newElement.id = targetElement.id;
          newElement.style.cssText = getComputedStyle( targetElement ).cssText;
          parentNode.replaceChild( newElement, targetElement );
        }
      }
    }

    /* Determine which player is needed (usually based on the result of findMediaType)
     * and create a stringified representation of the Popcorn constructor (usually to
     * insert in a script tag).
     */
    var generatePopcornString = this.generatePopcornString = function( popcornOptions, url, target, method, callbacks, scripts ){

      callbacks = callbacks || {};
      scripts = scripts || {};

      var popcornString = "",
          trackEvents,
          trackEvent,
          optionString,
          saveOptions,
          i,
          l,
          option;

      // prepare popcornOptions as a string
      if ( popcornOptions ) {
        popcornOptions = ", " + JSON.stringify( popcornOptions );
      } else {
        popcornOptions = ", {}";
      }

      // attempt to get the target element, and continue with a warning if a failure occurs
      if( typeof( target ) !== "string" ){
        if( target && target.id ){
          target = target.id;
        }
        else{
          _logger.log( "WARNING: Unexpected non-string Popcorn target: " + target );
        }
      } //if

      // if the media type hasn't been discovered yet, bail, since it's pointless to continue
      if( !_mediaType ){
        throw new Error( "Media type not generated yet. Please specify a url for media objects before generating a popcorn string." );
      }

      if( scripts.init ){
        popcornString += scripts.init + "\n";
      }
      if( callbacks.init ){
        popcornString += callbacks.init + "();\n";
      }

      // special case for basePlayer, since it doesn't require as much of a harness
      if( _mediaType === "baseplayer" ) {
        popcornString +=  "Popcorn.player( 'baseplayer' );\n" +
                          "var popcorn = Popcorn.baseplayer( '#" + target + "', " + popcornOptions + " );\n";
      }
      else{
        // just try to use Popcorn.smart to detect/setup video
        popcornString += "var popcorn = Popcorn.smart( '#" + target + "', '" + url + "'" + popcornOptions + " );\n";
      }

      if( scripts.beforeEvents ){
        popcornString += scripts.beforeEvents + "\n";
      }
      if( callbacks.beforeEvents ){
        popcornString += callbacks.beforeEvents + "( popcorn );\n";
      }

      // if popcorn was built successful
      if ( _popcorn ) {

        // gather and serialize existing trackevents
        trackEvents = _popcorn.getTrackEvents();
        if ( trackEvents ) {
          for ( i=0, l=trackEvents.length; i<l; ++i ) {
            trackEvent = trackEvents[ i ];
            popcornOptions = trackEvent._natives.manifest.options;
            saveOptions = {};
            for ( option in popcornOptions ) {
              if ( popcornOptions.hasOwnProperty( option ) ) {
                if (trackEvent[ option ] !== undefined) {
                  saveOptions[ option ] = trackEvent[ option ];
                }
              }
            }

            //stringify will throw an error on circular data structures
            try {
              //pretty print with 2 spaces per indent
              optionString = JSON.stringify( saveOptions, null, 2 );
            } catch ( jsonError ) {
              optionString = false;
              _logger.log( "WARNING: Unable to export event options: \n" + jsonError.message );
            }
            
            if ( optionString ) {
              popcornString += "popcorn." + trackEvents[ i ]._natives.type + "(" +
                optionString + ");\n";
            }
          } //for trackEvents
        } //if trackEvents

      }

      if( scripts.afterEvents ){
        popcornString += scripts.afterEvents + "\n";
      }
      if( callbacks.afterEvents ){
        popcornString += callbacks.afterEvents + "( popcorn );\n";
      }

      // if the `method` var is blank, the user probably just wanted an inline function without an onLoad wrapper
      method = method || "inline";

      // ... otherwise, wrap the function in an onLoad wrapper
      if ( method === "event" ) {
        popcornString = "\ndocument.addEventListener('DOMContentLoaded',function(e){\n" + popcornString;
        popcornString += "\n},false);";
      }
      else {
        popcornString = popcornString + "\n return popcorn;";
      } //if

      return popcornString;
    };

    /* Create a Popcorn instace in the page. Try just running the generated function first (from popcornString)
     * and insert it as a script in the head if that fails.
     */
    function createPopcorn( popcornString ){
      var popcornFunction = new Function( "", popcornString );
          popcorn = popcornFunction();
      if ( !popcorn ) {
        var popcornScript = document.createElement( "script" );
        popcornScript.innerHTML = popcornString;
        document.head.appendChild( popcornScript );
        popcorn = window.Popcorn.instances[ window.Popcorn.instances.length - 1 ];
      }
      _popcorn = popcorn;
    }

    /* Abstract the problem of waiting for some condition to occur with a timeout. Loop on checkFunction,
     * calling readyCallback when it succeeds, or calling timeoutCallback after timeoutDuration milliseconds.
     */
    function checkTimeoutLoop( checkFunction, readyCallback, timeoutCallback, timeoutDuration ){
      var stop = false,
          ready = false;

      // perform one check
      function doCheck(){
        // if timeout occurred already, bail
        if ( stop ) {
          return;
        }
        // run the check function
        if ( checkFunction() ) {
          // if success, raise the ready flag and call the ready callback
          ready = true;
          readyCallback();
        }
        else {
          // otherwise, prepare for another loop
          setTimeout( doCheck, STATUS_INTERVAL );
        }
      }

      // set a timeout to occur after timeoutDuration milliseconds
      setTimeout(function(){
        // if success hasn't already occured, raise the stop flag and call timeoutCallback
        if ( !ready ) {
          stop = true;
          timeoutCallback();
        }
      }, MEDIA_WAIT_DURATION );

      //init
      doCheck();
    }

    /* Wait for the media to return a sane readyState and duration so we can interact
     * with it (uses checkTimeoutLoop).
     */
    function waitForMedia( readyCallback, timeoutCallback ){
      checkTimeoutLoop(function(){
        return ( _popcorn.media.readyState >= 2 && _popcorn.duration() > 0 );
      }, readyCallback, timeoutCallback, MEDIA_WAIT_DURATION );
    }

    /* Wait for Popcorn to be set up and to have the required players load (uses
     * checkTimeoutLoop).
     */
    function waitForPopcorn( readyCallback, timeoutCallback ){
      if( _mediaType !== "object" ){
        _onPlayerTypeRequired( _mediaType );
        checkTimeoutLoop(function(){
          return ( !!window.Popcorn[ _mediaType ] );
        }, readyCallback, timeoutCallback, PLAYER_WAIT_DURATION );
      }
      else{
        readyCallback();
      }
    }

    // Passthrough to the Popcorn instances play method
    this.play = function(){
      _popcorn.play();
    };

    // Passthrough to the Popcorn instances pause method
    this.pause = function(){
      _popcorn.pause();
    };

    // Wipe the current Popcorn instance and anything it created
    this.clear = function( container ) {
      if( typeof( container ) === "string" ){
        container = document.getElementById( container );
      } //if
      if( !container ){
        _logger.log( "Warning: tried to clear media with null target." );
        return;
      } //if
      if( _popcorn ){
        _this.unbind(); 
      } //if
      while( container.firstChild ) {
        container.removeChild( container.firstChild );
      } //while
      if ( [ "AUDIO", "VIDEO" ].indexOf( container.nodeName ) > -1 ) {
        container.currentSrc = "";
        container.src = "";
      } //if
    };

    Object.defineProperties( this, {
      volume: {
        enumerable: true,
        set: function( val ){
          if( _popcorn ){
            _popcorn.volume( val );
          } //if
        },
        get: function(){
          if( _popcorn ){
            return _popcorn.volume();
          }
          return false;
        }
      },
      muted: {
        enumerable: true,
        set: function( val ){
          if( _popcorn ){
            if( val ){
              _popcorn.mute();
            }
            else {
              _popcorn.unmute();
            } //if
          } //if
        },
        get: function(){
          if( _popcorn ){
            return _popcorn.muted();
          }
          return false;
        }
      },
      currentTime: {
        enumerable: true,
        set: function( val ){
          if( _popcorn ){
            _popcorn.currentTime( val );
          } //if
        },
        get: function(){
          if( _popcorn ){
            return _popcorn.currentTime();
          }
          return 0;
        }
      },
      duration: {
        enumerable: true,
        get: function(){
          if( _popcorn ){
            return _popcorn.duration();
          } //if
          return 0;
        }
      },
      popcorn: {
        enumerable: true,
        get: function(){
          return _popcorn;
        }
      },
      paused: {
        enumerable: true,
        get: function(){
          if( _popcorn ){
            return _popcorn.paused();
          } //if
          return true;
        }, 
        set: function( val ){
          if( _popcorn ){
            if( val ){
              _popcorn.pause();
            }
            else {
              _popcorn.play();
            } //if
          } //if
        }
      } //paused
    });

  };

});
