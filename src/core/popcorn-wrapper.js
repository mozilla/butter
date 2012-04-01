/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/logger", "core/eventmanager" ], function( Logger, EventManager ) {

  var urlRegex = /(?:http:\/\/www\.|http:\/\/|www\.|\.|^)(youtu|vimeo|soundcloud|baseplayer)/;

  var STATUS_INTERVAL = 100,
      PLAYER_WAIT_DURATION = 10000,
      MEDIA_WAIT_DURATION = 10000;

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

    this.unbind = function(){
      try{
        removePopcornHandlers();
        _popcorn.destroy();
        _popcorn = undefined;
      }
      catch( e ){
        _logger.log( "WARNING: Popcorn did NOT get destroyed properly: \n" + e.message + "\n" + e.stack );
      } //try
    };

    function addPopcornHandlers(){
      for( var eventName in _popcornEvents ){
        _popcorn.on( eventName, _popcornEvents[ eventName ] );
      } //for
    } //addPopcornHandlers

    function removePopcornHandlers(){
      for( var eventName in _popcornEvents ){
        _popcorn.off( eventName, _popcornEvents[ eventName ] );
      } //for
    } //removePopcornHandlers

    this.interruptLoad = function(){
      _interruptLoad = true;
    }; //interrupt

    this.wait = function() {
      _mediaLoadAttempts = 0;
    }; //wait

    this.updateEvent = function( trackEvent ){
      var options = trackEvent.popcornOptions,
          butterId = trackEvent.id,
          popcornId = _butterEventMap[ butterId ];
      if( _popcorn ){
        if( popcornId && _popcorn.getTrackEvent( popcornId ) ){
          _popcorn.removeTrackEvent( popcornId );
        } //if
        if( _popcorn[ trackEvent.type ] ){
          _popcorn[ trackEvent.type ]( options );
          _butterEventMap[ butterId ] = _popcorn.getLastTrackEventId();
        } //if
      } //if
    }; //updateEvent

    this.destroyEvent = function( trackEvent ){
      var options = trackEvent.popcornOptions,
          butterId = trackEvent.id,
          popcornId = _butterEventMap[ butterId ];
      if( _popcorn ){
        if( popcornId && _popcorn.getTrackEvent( popcornId ) ){
          _popcorn.removeTrackEvent( popcornId );
        } //if
        delete _butterEventMap[ butterId ];
      } //if
    }; //destroyEvent

    this.prepare = function( url, target, popcornOptions ){

      function timeoutWrapper( e ){
        _interruptLoad = true;
        _onTimeout( e );
      }

      function mediaTimeoutWrapper( e ){
        _interruptLoad = true;
        _onTimeout( e );
      }

      function failureWrapper( e ){
        _interruptLoad = true;
        _logger.log( e );
        _onFail( e );
      }

      findMediaType( url );

      if( !target ){
        _logger.log( "Warning: tried to prepare media with null target." );
        return;
      }

      if( !_popcorn ) {
        try {
          waitForPopcorn( function(){
            constructPlayer( target );
            createPopcorn( generatePopcornString( popcornOptions, url, target ) );
            addPopcornHandlers();
            waitForMedia( _onPrepare, mediaTimeoutWrapper );
          }, timeoutWrapper );
        }
        catch( e ) {
          failureWrapper( e );
        }
      }

    };

    function findMediaType( url ){
      var regexResult = urlRegex.exec( url );
      if ( regexResult ) {
        _mediaType = regexResult[ 1 ];
        // our regex only handles youtu ( incase the url looks something like youtu.be )
        if ( _mediaType === "youtu" ) {
          _mediaType = "youtube";
        }
      }
      else {
        _mediaType = "object";
      }
      return _mediaType;
    } //findMediaType

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

    var generatePopcornString = this.generatePopcornString = function( popcornOptions, url, target, method ){
      var popcornString = "";

      if ( popcornOptions ) {
        popcornOptions = ", " + JSON.stringify( popcornOptions );
      } else {
        popcornOptions = ", {}";
      }

      if( typeof( target ) !== "string" ){
        if( target && target.id ){
          target = target.id;
        }
        else{
          _logger.log( "WARNING: Unexpected non-string Popcorn target: " + target );
        }
      } //if

      if( !_mediaType ){
        throw new Error( "Media type not generated yet. Please specify a url for media objects before generating a popcorn string." );
      }


      if( _mediaType === "baseplayer" ) {
        popcornString +=  "Popcorn.player( 'baseplayer' );\n" +
                          "var popcorn = Popcorn.baseplayer( '#" + target + "', " + popcornOptions + " );\n";
      }
      else{
        popcornString += "var popcorn = Popcorn.smart( '#" + target + "', '" + url + "'" + popcornOptions + " );\n";
      }

      if ( _popcorn ) {
        var trackEvents = _popcorn.getTrackEvents();
        if ( trackEvents ) {
          for ( var i=0, l=trackEvents.length; i<l; ++i ) {
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
          } //for trackEvents
        } //if trackEvents
      } //if popcorn

      method = method || "inline";

      if ( method === "event" ) {
        popcornString = "\ndocument.addEventListener('DOMContentLoaded',function(e){\n" + popcornString;
        popcornString += "\n},false);";
      }
      else {
        popcornString = popcornString + "\n return popcorn;";
      } //if

      return popcornString;
    };

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
    };

    function checkTimeoutLoop( checkFunction, readyCallback, timeoutCallback, timeoutDuration ){
      var stop = false,
          ready = false;
      function doCheck(){
        if ( stop ) {
          return;
        }
        if ( checkFunction() ) {
          ready = true;
          readyCallback();
        }
        else {
          setTimeout( doCheck, STATUS_INTERVAL );
        }
      }
      setTimeout(function(){
        if ( !ready ) {
          stop = true;
          timeoutCallback();
        }
      }, MEDIA_WAIT_DURATION );
      doCheck();
    }

    function waitForMedia( readyCallback, timeoutCallback ){
      checkTimeoutLoop(function(){
        return ( _popcorn.media.readyState >= 2 && _popcorn.duration() > 0 );
      }, readyCallback, timeoutCallback, MEDIA_WAIT_DURATION );
    }

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

    this.play = function(){
      _popcorn.play();
    };

    this.pause = function(){
      _popcorn.pause();
    };

    this.clear = function( container ) {
      if( typeof( container ) === "string" ){
        container = document.getElementById( container );
      } //if
      if( !container ){
        _logger.log( "Warning: tried to clear media with null target." );
        return;
      } //if
      if( _popcorn ){
        try{
          removePopcornHandlers();
          _popcorn.destroy();
          _popcorn = undefined;
        }
        catch( e ){
          _logger.log( "WARNING: Popcorn did NOT get destroyed properly: \n" + e.message + "\n" + e.stack );
        } //try
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
