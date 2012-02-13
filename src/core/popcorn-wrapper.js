define( [ "core/logger", "core/eventmanager" ], function( Logger, EventManager ) {

  var urlRegex = /(?:http:\/\/www\.|http:\/\/|www\.|\.|^)(youtu|vimeo|soundcloud|baseplayer)/;

  return function ( mediaId, options ){

    var _id = mediaId,
        _onTimeUpdate = options.timeupdate || function(){},
        _onPause = options.pause || function(){},
        _onPlaying = options.playing || function(){},
        _onTimeout = options.timeout || function(){},
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
      _popcorn.listen( "timeupdate", _onTimeUpdate );
      _popcorn.listen( "pause", _onPause );
      _popcorn.listen( "playing", _onPlaying );
    } //addPopcornHandlers

    function removePopcornHandlers(){
      _popcorn.unlisten( "timeupdate", _onTimeUpdate );
      _popcorn.unlisten( "pause", _onPause );
      _popcorn.unlisten( "playing", _onPlaying );
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
      if( popcornId && _popcorn.getTrackEvent( popcornId ) ){
        _popcorn.removeTrackEvent( popcornId );
      } //if
      _popcorn[ trackEvent.type ]( options );
      _butterEventMap[ butterId ] = _popcorn.getLastTrackEventId();
    }; //updateEvent

    this.prepare = function( url, target, popcornOptions ){
      function timeoutWrapper( e ){
        _interruptLoad = true;
        _onTimeout( e );
      } //timeoutWrapper
      function failureWrapper( e ){
        _interruptLoad = true;
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

    function prepareMedia( url, target, onError ){
      var mediaElement = document.getElementById( target );
      if ( _mediaType === "object" ) {
        if (  !mediaElement || [ 'AUDIO', 'VIDEO' ].indexOf( mediaElement.nodeName ) === -1 ) {
          var video = document.createElement( "video" ),
              src = document.createElement( "source" );

          src.addEventListener( "error", onError );
          src.src = url;
          video.style.width = document.getElementById( target ).style.width;
          video.style.height = document.getElementById( target ).style.height;
          video.appendChild( src );
          video.controls = true;
          if ( !video.id || video.id === "" ) {
            video.id = "butter-media-element-" + _id;
          }
          _popcornTarget = video.id;
          video.setAttribute( "autobuffer", "true" );
          video.setAttribute( "preload", "auto" );

          document.getElementById( target ).appendChild( video );
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

    function generatePopcornString( popcornOptions, url, target, method ) {
      var popcornString = "",
          popcornOptions = "";

      if ( popcornOptions ) {
        popcornOptions = ", " + JSON.stringify( popcornOptions );
      } //if

      var players = {
        "youtu": function() {
          return "var popcorn = Popcorn.youtube( '" + _popcornTarget + "', '" +
            url + "'" + popcornOptions + " );\n";
        },
        "vimeo": function() {
          return "var popcorn = Popcorn.vimeo( '" + _popcornTarget + "', '" +
          url + "'" + popcornOptions + " );\n";
        },
        "soundcloud": function() {
          return "var popcorn = Popcorn( Popcorn.soundcloud( '" + _popcornTarget + "'," +
          " '" + url + "') );\n";
        },
        "baseplayer": function() {
          return "var popcorn = Popcorn( Popcorn.baseplayer( '#" + _popcornTarget + "'" + popcornOptions + " ) );\n";
        },
        "object": function() {
          return "var popcorn = Popcorn( '#" + _popcornTarget + "'" + popcornOptions + ");\n";
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

    this.clear = function( target ) {
      var container = document.getElementById( target );
      while( container.firstChild ) {
        container.removeChild( container.firstChild );
      } //while
      if ( [ "AUDIO", "VIDEO" ].indexOf( container.nodeName ) > -1 ) {
        container.currentSrc = "";
        container.src = "";
      } //if
      removePopcornHandlers();
      _popcorn.destroy();
      _popcorn = undefined;
    }; //setMediaContent

    Object.defineProperties( this, {
      currentTime: {
        enumerable: true,
        set: function( val ){
          _popcorn.currentTime( val );
        },
        get: function(){
          return _popcorn.currentTime();
        }
      },
      duration: {
        enumerable: true,
        get: function(){
          return _popcorn.duration();
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
          _popcorn.paused();
        }, 
        set: function( val ){
          if( val ){
            _popcorn.pause();
          }
          else {
            _popcorn.play();
          } //if
        }
      }
    });

  }; //PopcornWrapper

}); //define
