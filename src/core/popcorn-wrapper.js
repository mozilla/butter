/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/logger", "core/eventmanager" ], function( Logger, EventManager ) {

  var urlRegex = /(?:http:\/\/www\.|http:\/\/|www\.|\.|^)(youtu|vimeo|soundcloud|baseplayer)/;

  return function ( mediaId, options ){

    var _id = mediaId,
        _logger = new Logger( _id + "::PopcornWrapper" ),
        _popcornEvents = options.popcornEvents || {},
        _onPrepare = options.prepare || function(){},
        _onFail = options.fail || function(){},
        _url = options.setup && options.setup.url,
        _target = options.target && options.setup.target,
        _popcorn,
        _mediaType,
        _popcornTarget,
        _butterEventMap = {},
        _mediaLoadAttempts = 0,
        _interruptLoad = false,
        _this = this;

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
      } //timeoutWrapper
      function failureWrapper( e ){
        _interruptLoad = true;
        _logger.log( e );
        _onFail( e );
      } //failureWrapper
      function popcornSuccess( e ){
         addPopcornHandlers();
        _onPrepare( e );
      } //popcornSuccess
      findMediaType( url );
      prepareMedia( url, target, failureWrapper );
      if( !_popcorn ) {
        try {
          createPopcorn( generatePopcornString( popcornOptions, url, target ) );
          waitForPopcorn( popcornSuccess, timeoutWrapper, 100 );
        }
        catch( e ) {
          failureWrapper( e );
        } //try
      } //if
    }; //prepare

    function prepareMedia( url, mediaElement, onError ){
      if( typeof( mediaElement ) === "string" ){
        mediaElement = document.getElementById( mediaElement );
      } //if
      if( !mediaElement ){
        _logger.log( "Warning: tried to prepare media with null target." );
        return;
      } //if
      if( _mediaType === "object" ){
        if ( [ 'AUDIO', 'VIDEO' ].indexOf( mediaElement.nodeName ) === -1 ){
          var video = document.createElement( "video" ),
              src = document.createElement( "source" );

          src.addEventListener( "error", onError );
          src.src = url;
          video.style.width = mediaElement.style.width;
          video.style.height = mediaElement.style.height;
          video.appendChild( src );
          video.controls = true;
          if ( !video.id || video.id === "" ) {
            video.id = "butter-media-element-" + _id;
          }
          _popcornTarget = video.id;
          video.setAttribute( "autobuffer", "true" );
          video.setAttribute( "preload", "auto" );

          mediaElement.appendChild( video );
          return video;
        }
        else {
          if ( !mediaElement.id || mediaElement.id === "" ) {
            mediaElement.id = "butter-media-element-" + _id;
          } //if
          mediaElement.pause();
          mediaElement.src = "";
          while ( mediaElement.firstChild ) {
            mediaElement.removeChild( mediaElement.firstChild );
          } //while
          mediaElement.removeAttribute( "src" );
          mediaElement.addEventListener( "error", onError );
          mediaElement.src = url;
          mediaElement.load();
          _popcornTarget = mediaElement.id;
          return mediaElement;
        } //if
      } //if _mediaType
    } //prepareMedia

    function findMediaType( url ){
      var regexResult = urlRegex.exec( url )
      if ( regexResult ) {
        _mediaType = regexResult[ 1 ];
      }
      else {
        _mediaType = "object";
      }
      return _mediaType;
    } //findMediaType

    var generatePopcornString = this.generatePopcornString = function( popcornOptions, url, target, method ){
      var popcornString = "",
          popcornOptions = "";

      if ( popcornOptions ) {
        popcornOptions = ", " + JSON.stringify( popcornOptions );
      } //if

      if( typeof( target ) !== "string" ){
        if( target.id ){
          target = target.id;
        }
        else{
          _logger.log( "WARNING: Unexpected non-string Popcorn target: " + target );
        }
      } //if

      var players = {
        "youtu": function() {
          return "var popcorn = Popcorn.youtube( '" + target + "', '" +
            url + "'" + popcornOptions + " );\n";
        },
        "vimeo": function() {
          return "var popcorn = Popcorn.vimeo( '" + target + "', '" +
          url + "'" + popcornOptions + " );\n";
        },
        "soundcloud": function() {
          return "var popcorn = Popcorn( Popcorn.soundcloud( '" + target + "'," +
          " '" + url + "') );\n";
        },
        "baseplayer": function() {
          return "var popcorn = Popcorn( Popcorn.baseplayer( '#" + target + "'" + popcornOptions + " ) );\n";
        },
        "object": function() {
          return "var popcorn = Popcorn( '#" + target + "'" + popcornOptions + ");\n";
        }
      };
      
      // call certain player function depending on the regexResult
      popcornString += players[ _mediaType ]();

      if ( _popcorn ) {
        var trackEvents = _popcorn.getTrackEvents();
        if ( trackEvents ) {
          for ( var i=0, l=trackEvents.length; i<l; ++i ) {
            var popcornOptions = trackEvents[ i ]._natives.manifest.options;
            popcornString += "popcorn." + trackEvents[ i ]._natives.type + "({";
            for ( var option in popcornOptions ) {
              if ( popcornOptions.hasOwnProperty( option ) ) {
                popcornString += "\n" + option + ":'" + trackEvents[ i ][ option ] + "',";
              } //if
            } //for
            if ( popcornString[ popcornString.length - 1 ] === "," ) {
              popcornString = popcornString.substring( 0, popcornString.length - 1 );
            } //if
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
    }; //generatePopcornString

    function createPopcorn( popcornString ){
      var popcornFunction = new Function( "", popcornString );
          popcorn = popcornFunction();
      if ( !popcorn ) {
        var popcornScript = _popcornScript = document.createElement( "script" );
        popcornScript.innerHTML = popcornString;
        document.head.appendChild( popcornScript );
        popcorn = window.Popcorn.instances[ window.Popcorn.instances.length - 1 ];
      }
      _popcorn = popcorn;
    }; //createPopcorn

    function waitForPopcorn( callback, timeoutCallback, tries ){
      _mediaLoadAttempts = 0;
      _interruptLoad = false;

      var checkMedia = function() {
        ++_mediaLoadAttempts;
        if ( tries !== undefined && _mediaLoadAttempts === tries ) {
          if ( timeoutCallback ) {
            timeoutCallback();
          } //if
        } //if
        if ( _interruptLoad ) {
          return;
        } //if
        if ( _popcorn.media.readyState >= 2 && _popcorn.duration() > 0 ) {
          if ( _mediaType === "youtu" ) {
            setTimeout( function() {
              _popcorn.pause();
            }, 1000 );
          }
          else if ( _mediaType === "vimeo" || _mediaType === "soundcloud" ) {
          }
          else {
          } //if
          callback();
        } else {
          setTimeout( checkMedia, 100 );
        } //if
      }
      checkMedia();
    }; //waitForPopcorn

    this.play = function(){
      _popcorn.play();
    }; //play

    this.pause = function(){
      _popcorn.pause();
    }; //pause

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
    }; //setMediaContent

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
    }); //properties

  }; //PopcornWrapper

}); //define
