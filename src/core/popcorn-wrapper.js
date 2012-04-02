/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/logger", "core/eventmanager" ], function( Logger, EventManager ) {

  // regex to determine the type of player we need to use based on the provided url
  var __urlRegex = /(?:http:\/\/www\.|http:\/\/|www\.|\.|^)(youtu|vimeo|soundcloud|baseplayer)/;

  /* The Popcorn-Wrapper wraps various functionality and setup associated with
   * creating, updating, and removing associated data with Popcorn.js.
   */
  return function ( mediaId, options ) {

    var _id = mediaId,
        _logger = new Logger( _id + "::PopcornWrapper" ),
        _popcornEvents = options.popcornEvents || {},
        _onPrepare = options.prepare || function(){},
        _onFail = options.fail || function(){},
        _popcorn,
        _mediaType,
        _butterEventMap = {},
        _interruptLoad = false,
        _playerReady = false,
        _this = this;

    /* setup any handlers that were defined in the options passed into
     * popcorn wrapper. Events such as timeupdate, paused, ect
     */
    function addPopcornHandlers() {
      for ( var eventName in _popcornEvents ) {
        _popcorn.on( eventName, _popcornEvents[ eventName ] );
      }
    }

    // Update Popcorn events with data from a butter trackevent
    this.updateEvent = function( trackEvent ) {
      var options = trackEvent.popcornOptions,
          butterId = trackEvent.id,
          popcornId = _butterEventMap[ butterId ];

      if ( _popcorn ) {
        /* ensure that the trackevent actually exists before removal.
        * we remove the trackevent because there is no easy way
        * to ensure what data has changed on any given track. It
        * is easier to remove the old and create a new trackevent with the updated
        * options
        */
        if ( popcornId && _popcorn.getTrackEvent( popcornId ) ) {
          _popcorn.removeTrackEvent( popcornId );
        }
        // make sure the plugin is still included
        if ( _popcorn[ trackEvent.type ] ) {
          // create the trackevent
          _popcorn[ trackEvent.type ]( options );
          // store a local reference to the newly created trackevent
          _butterEventMap[ butterId ] = _popcorn.getLastTrackEventId();
        }
      }
    };

    // Destroy a Popcorn trackevent
    this.destroyEvent = function( trackEvent ) {
      var options = trackEvent.popcornOptions,
          butterId = trackEvent.id,
          popcornId = _butterEventMap[ butterId ];

      // ensure the trackevent actually exists before we remove it
      if ( popcornId && _popcorn.getTrackEvent( popcornId ) ) {
        _popcorn.removeTrackEvent( popcornId );
      }
      // remove the reference to the trackevent id that we stored in updateEvent
      delete _butterEventMap[ butterId ];
    };

    /* prepare creates functions for various failure and success
     * cases, generates the Popcorn string, and ensures our player is ready
     * before we actually create the Popcorn instance. 
     */
    this.prepare = function( url, target, popcornOptions ) {
      // If the media does not pass readyState 2 fast enough this is called
      function timeoutWrapper( e ) {
        _interruptLoad = true;
      }
      // if any errors get thrown we call the failure callback
      function failureWrapper( e ) {
        _interruptLoad = true;
        _logger.log( e );
        _onFail( e );
      }
      /* when we have passed readyState 2 and everything is fine,
       * call the success callback
       */
      function popcornSuccess( e ) {
        /* now that we know we have successfully created a new Popcorn instance
         * it is safe and worthwhile to setup all of our listeners
         */
        addPopcornHandlers();
        // let the media know that we have finished preparing the Popcorn instance
        _onPrepare( e );
      }

      if ( !target ) {
        _logger.log( "Warning: tried to prepare media with null target." );
        return;
      }

      try {
        /* create a string that represents our Popcorn constructor for
         * whichever media type ( HTML5, YouTube, ect ) is being used
         */
        var popcornString = _this.generatePopcornString( popcornOptions, url, target );
        // ensure the needed player scripts have been included and our new player is ready to use
        (function isPlayerReady() {
          if ( !_playerReady ) {
            setTimeout(function() {
              isPlayerReady();
            }, 100 );
          } else {
            // create the popcorn instance based on the string we generated
            createPopcorn( popcornString );
            // wait for Popcorn to pass readyState 2
            waitForPopcorn( popcornSuccess, timeoutWrapper, 100 );
          }
        })();
      }
      catch( e ) {
        // if we failed call our failure function
        failureWrapper( e );
      }
    };

    /* determine the type of media that is going to be used
     * based on the url the user entered for their media
     */
    function findMediaType( url ){
      var regexResult = __urlRegex.exec( url );
      if ( regexResult ) {
        _mediaType = regexResult[ 1 ];
      }
      else {
        // if the regex didn't return anything we know it's an HTML5 source
        _mediaType = "object";
      }
      return _mediaType;
    }

    /* determines which player is needed based on the result of findMediaType
     * and creates a stringified representation of the Popcorn constructor.
     */
    this.generatePopcornString = function( popcornOptions, url, target, method ) {
      var popcornOptions = JSON.stringify( popcornOptions ),
          popcornString = "";

      if ( typeof( target ) !== "string" ) {
        if ( target.id ) {
          target = target.id;
        } else {
          _logger.log( "WARNING: Unexpected non-string Popcorn target: " + target );
        }
      }

      function constructPlayer( type ) {
        var script,
            targetElement = document.getElementById( target );

        // if popcornOptions doesn't exist set it to nothing so it doesn't screw us up
        if( popcornOptions ) {
          popcornOptions = ", " + popcornOptions;
        } else {
          popcornOptions = "";
        }

        /* if the user is using the baseplayer all we need to do is create
         * a player and create the Popcorn string
         */
        if( type === "baseplayer" ) {
          _playerReady = true;
          Popcorn.player( "baseplayer" );
          return "Popcorn.player( 'baseplayer' );\n" +
                 "var popcorn = Popcorn.baseplayer( '#" + target + "'" + popcornOptions + " );\n";
        }

        // no extra scripts needed for HTML5 :)
        if ( type === "object" ) {
          _playerReady = true;
        } else {
          _playerReady = false;

          // our regex only handles youtu ( incase the url looks something like youtu.be )
          if ( type === "youtu" ) {
            type = "youtube";
          }

          /* if the target is an audio or video element we need to create a div instead
           * as YouTube and other flash players cannot inhabit an HTML5 media player
           */
          if( [ "VIDEO", "AUDIO" ].indexOf( targetElement.nodeName ) !== -1 ) {
            var parentNode = targetElement.parentNode,
                newElement = document.createElement( "div" );

            newElement.id = targetElement.id;
            // copy the css of the existing element
            newElement.style.cssText = getComputedStyle( targetElement ).cssText;
            // replace the current target with a div
            parentNode.replaceChild( newElement, targetElement );
          }

          // insert the appropriate script for the needed player
          script = document.createElement( "script" );
          script.src = "../external/popcorn-js/players/" + type + "/popcorn." + type + ".js";
          document.head.appendChild( script );

          // ensure the player is ready for use before we continue
          (function isPlayerReady()  {
            setTimeout(function() {
              if ( !window.Popcorn[ type ] ) {
                isPlayerReady();
              } else {
                _playerReady = true;
              }
            }, 100 );
          })();
        }

        // Let Popcorn.smart create determine what player to use
        return "var popcorn = Popcorn.smart( '#" + target + "', '" + url + "'" + popcornOptions + " );\n";
      }

      // call certain player function depending on the regexResult
      popcornString += constructPlayer( findMediaType( url ) );

      // if we changed medias we need to update the new instance with the old instances trackevents
      if ( _popcorn ) {
        var trackEvents = _popcorn.getTrackEvents();
        // make sure there is trackevents to copy
        if ( trackEvents ) {
          for ( var i = 0, l = trackEvents.length; i < l; i++ ) {
            popcornOptions = trackEvents[ i ]._natives.manifest.options;
            popcornString += "popcorn." + trackEvents[ i ]._natives.type + "({";
            for ( var option in popcornOptions ) {
              if ( popcornOptions.hasOwnProperty( option ) ) {
                popcornString += "\n" + option + ":'" + trackEvents[ i ][ option ] + "',";
              }
            }
            if ( popcornString[ popcornString.length - 1 ] === "," ) {
              popcornString = popcornString.substring( 0, popcornString.length - 1 );
            }
            popcornString += "});\n";
          }
        }
      }

      // check to see if we need to add a DOMContentLoaded or not based on the method
      method = method || "inline";

      if ( method === "event" ) {
        popcornString = "\ndocument.addEventListener('DOMContentLoaded',function(e){\n" + popcornString;
        popcornString += "\n},false);";
      } else {
        popcornString = popcornString + "\n return popcorn;";
      }

      return popcornString;
    };

    // actually insert and create the Popcorn instance based on the popcornString
    function createPopcorn( popcornString ) {
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

    function waitForPopcorn( callback, timeoutCallback, tries ) {
      _interruptLoad = false;

      function checkMedia( attempts ) {
        attempts++;
        if ( tries !== undefined && attempts === tries ) {
          if ( timeoutCallback ) {
            timeoutCallback();
          }
        }
        if ( _interruptLoad ) {
          return;
        }
        if ( _popcorn.media.readyState >= 2 && _popcorn.duration() > 0 ) {
          callback();
        } else {
          setTimeout( function() {
            checkMedia( attempts );
          }, 100 );
        }
      };
      // pass in a value to get incremented so multiple setTimeouts arn't increasing the same value
      // this only seems to be an issue for tests, but lets be safe
      checkMedia( 0 );
    }

    // passthrough to the Popcorn instances play method
    this.play = function() {
      _popcorn.play();
    };

    // passthrough to the Popcorn instances pause method
    this.pause = function() {
      _popcorn.pause();
    };

    // wipe the current Popcorn instance and anything it created
    this.clear = function( container ) {
      if ( typeof( container ) === "string" ) {
        container = document.getElementById( container );
      }
      if ( !container ) {
        _logger.log( "Warning: tried to clear media with null target." );
        return;
      }
      // remove the instance
      if ( _popcorn ) {
        try {
          _popcorn.destroy();
          _popcorn = undefined;
        } catch( e ){
          _logger.log( "WARNING: Popcorn did NOT get destroyed properly: \n" + e.message + "\n" + e.stack );
        }
      }
      // remove any child containers
      while ( container.firstChild ) {
        container.removeChild( container.firstChild );
      }
      // if the container was an audio or video element, clear the sources
      if ( [ "AUDIO", "VIDEO" ].indexOf( container.nodeName ) > -1 ) {
        container.currentSrc = "";
        container.src = "";
      }
    };

    // define various getters and setters
    Object.defineProperties( this, {
      volume: {
        enumerable: true,
        set: function( val ) {
          if ( _popcorn ) {
            _popcorn.volume( val );
          }
        },
        get: function() {
          if( _popcorn ) {
            return _popcorn.volume();
          }
          return 0;
        }
      },
      muted: {
        enumerable: true,
        set: function( val ) {
          if ( _popcorn ) {
            if ( val ) {
              _popcorn.mute();
            } else {
              _popcorn.unmute();
            }
          }
        },
        get: function() {
          if ( _popcorn ) {
            return _popcorn.muted();
          }
          return false;
        }
      },
      currentTime: {
        enumerable: true,
        set: function( val ) {
          if ( _popcorn ) {
            _popcorn.currentTime( val );
          }
        },
        get: function() {
          if ( _popcorn ) {
            return _popcorn.currentTime();
          }
          return 0;
        }
      },
      duration: {
        enumerable: true,
        get: function() {
          if ( _popcorn ) {
            return _popcorn.duration();
          }
          return 0;
        }
      },
      popcorn: {
        enumerable: true,
        get: function() {
          return _popcorn;
        }
      },
      paused: {
        enumerable: true,
        get: function() {
          if ( _popcorn ) {
            return _popcorn.paused();
          }
          return true;
        },
        set: function( val ) {
          if ( _popcorn ) {
            if ( val ) {
              _popcorn.pause();
            } else {
              _popcorn.play();
            }
          }
        }
      }
    });
  };
});
