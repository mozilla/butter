(function () {

  var urlRegex = /(?:http:\/\/www\.|http:\/\/|www\.|\.|^)(youtu|vimeo|soundcloud|baseplayer)/;

  define( [ "core/logger", "core/eventmanager" ], function( Logger, EventManager ) {

    var Media = function ( mediaObject ) {

      var _mediaObject = mediaObject,
          _popcorn,
          _popcornCurrentTime,
          _type,
          _interruptLoad = false,
          _mediaLoadAttempts = 0,
          _this = this,
          _popcornTarget;

      Object.defineProperties( _mediaObject, {
        exactCurrentTime: {
          enumerable: true,
          configurable: false,
          get: function(){
            if( _popcorn ){
              return _popcorn.media.currentTime;
            } //if
            return 0;
          }
        }
      });

      function setupPopcornHandlers() {
        _popcorn.listen( "timeupdate", function() {
          _popcornCurrentTime = _popcorn.currentTime();
          _mediaObject.currentTime = _popcornCurrentTime;
        });
        _popcorn.listen( "pause", function() {
          _mediaObject.paused = true;
        });
        _popcorn.listen( "playing", function() {
          _mediaObject.paused = false;
        });
      } //setupPopcornHandlers

      this.interruptLoad = function() {
        _interruptLoad = true;
      }; //interrupt

      this.wait = function() {
        _mediaLoadAttempts = 0;
      }; //wait

      this.clear = function() {
        if( _popcorn ){
          _popcorn.destroy();
          _popcorn = undefined;
        } //if
        if( _mediaObject.target ){
          document.getElementById( _mediaObject.target ).innerHTML = "";
        } //if
      }; //clear

      function prepare( callback ) {

        function timeoutWrapper( e ){
          _interruptLoad = true;
          _mediaObject.dispatch( "mediatimeout" );
        } //timeoutWrapper

        function failureWrapper( e ){
          _interruptLoad = true;
          _mediaObject.dispatch( "mediafailed" );
        } //failureWrapper

        function popcornSuccess( e ){
           setupPopcornHandlers();
          _mediaObject.dispatch( "mediaprepared" );
          _mediaObject.dispatch( "mediaready" );
          callback && callback();
        } //popcornSuccess

        findMediaType();
        prepareMedia( failureWrapper );

        if( !_popcorn ) {
          try {
            createPopcorn( generatePopcornString() );
            waitForPopcorn( popcornSuccess, timeoutWrapper, 100 );
          }
          catch( e ) {
            failureWrapper( e );
          } //try
        }
      }; //prepare

      function prepareMedia( onError ){
        var mediaElement = document.getElementById( _mediaObject.target );
        if ( _type === "object" ) {
          if (  !mediaElement || [ 'AUDIO', 'VIDEO' ].indexOf( mediaElement.nodeName ) === -1 ) {
            var video = document.createElement( "video" ),
                src = document.createElement( "source" );

            src.addEventListener( "error", onError );
            src.src = _mediaObject.url;
            video.style.width = document.getElementById( _mediaObject.target ).style.width;
            video.style.height = document.getElementById( _mediaObject.target ).style.height;
            video.appendChild( src );
            video.controls = true;
            if ( !video.id || video.id === "" ) {
              video.id = "butter-media-element-" + _mediaObject.id;
            }
            _popcornTarget = video.id;
            video.setAttribute( "autobuffer", "true" );
            video.setAttribute( "preload", "auto" );

            document.getElementById( _mediaObject.target ).appendChild( video );
            return video;
          }
          else {
            if ( !mediaElement.id || mediaElement.id === "" ) {
              mediaElement.id = "butter-media-element-" + _mediaObject.id;
            } //if
            mediaElement.pause();
            mediaElement.src = "";
            while ( mediaElement.firstChild ) {
              mediaElement.removeChild( mediaElement.firstChild );
            } //while
            mediaElement.removeAttribute( "src" );
            mediaElement.addEventListener( "error", onError );
            mediaElement.src = _mediaObject.url;
            mediaElement.load();
            _popcornTarget = mediaElement.id;
            return mediaElement;
          } //if
        } //if _type
      } //prepareMedia

      function findMediaType(){
        var regexResult = urlRegex.exec( _mediaObject.url )
        if ( regexResult ) {
          _type = regexResult[ 1 ];
        }
        else {
          _type = "object";
        }
        return _type;
      } //findMediaType

      function generatePopcornString( method ) {
        var popcornString = "",
            popcornOptions = "";

        if ( _mediaObject.popcornOptions ) {
          popcornOptions = ", " + JSON.stringify( _mediaObject.popcornOptions );
        } //if

        var players = {
          "youtu": function() {
            return "var popcorn = Popcorn.youtube( '" + _popcornTarget + "', '" +
              _mediaObject.url + "'" + popcornOptions + " );\n";
          },
          "vimeo": function() {
            return "var popcorn = Popcorn.vimeo( '" + _popcornTarget + "', '" +
            _mediaObject.url + "'" + popcornOptions + " );\n";
          },
          "soundcloud": function() {
            return "var popcorn = Popcorn( Popcorn.soundcloud( '" + _popcornTarget + "'," +
            " '" + _mediaObject.url + "') );\n";
          },
          "baseplayer": function() {
            return "var popcorn = Popcorn( Popcorn.baseplayer( '#" + _popcornTarget + "'" + popcornOptions + " ) );\n";
          },
          "object": function() {
            return "var popcorn = Popcorn( '#" + _popcornTarget + "'" + popcornOptions + ");\n";
          }
        };

        // call certain player function depending on the regexResult
        popcornString += players[ _type ]();

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
        var popcorn = _popcorn;

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
          if ( popcorn.media.readyState >= 2 && popcorn.duration() > 0 ) {
            if ( _type === "youtu" ) {
              _mediaObject.duration = popcorn.duration();
              setTimeout( function() {
                popcorn.pause();
              }, 1000 );
            }
            else if ( _type === "vimeo" || _type === "soundcloud" ) {
              _mediaObject.duration = popcorn.duration();
            }
            else {
              _mediaObject.duration = popcorn.duration();
            } //if
            callback( popcorn );
          } else {
            setTimeout( checkMedia, 100 );
          } //if
        }
        checkMedia();
      }; //waitForPopcorn

      function onMediaContentChanged( e ) {
        var container = document.getElementById( _mediaObject.target );

        while( container.firstChild ) {
          container.removeChild( container.firstChild );
        } //while

        if ( [ "AUDIO", "VIDEO" ].indexOf( container.nodeName ) > -1 ) {
          container.currentSrc = "";
          container.src = "";
        } //if

        _popcorn.destroy();
        _popcorn = undefined;

        for( var i=0, l=Popcorn.instances.length; i<l; i++ ) {
          if( Popcorn.instances[ i ] && Popcorn.instances[ i ].isDestroyed ) {
            Popcorn.instances.splice( i, 1 );
          }
        }
        
        prepare(function() {
          for( t in _mediaObject.tracks ) {
            for( te in t.trackEvents ) {
              _popcorn.addTrackEvent( te.popcornOptions );
            }
          } 
        });
      } //onMediaContentChanged

      function onTrackEventAdded( e ){
        _popcorn[ e.data.type ]( e.data.popcornOptions );
        e.data.popcornEvent = _popcorn.getLastTrackEventId();
      } //onTrackEventAdded

      function onTrackEventUpdated( e ){
        if( e.data.popcornEvent ){
          _popcorn.removeTrackEvent( e.data.popcornEvent );
        }
        _popcorn[ e.data.type ]( e.data.popcornOptions );
        e.data.popcornEvent = _popcorn.getLastTrackEventId();
      } //onTrackEventUpdated

      function onTrackEventRemoved( e ){
        if( e.data.popcornEvent ){
          _popcorn.removeTrackEvent( e.data.popcornEvent );
        }
      } //onTrackEventRemoved

      function onMediaTimeUpdate( e ){
        // protect against re-setting the current time if the event originated from popcorn
        if( _mediaObject.currentTime !== _popcornCurrentTime ){
          _popcorn.currentTime( _mediaObject.currentTime );
        } //if
      } //onMediaTimeUpdate

      _mediaObject.listen( "mediacontentchanged", onMediaContentChanged );
      _mediaObject.listen( "mediatimeupdate", onMediaTimeUpdate );
      _mediaObject.listen( "trackeventadded", onTrackEventAdded );
      _mediaObject.listen( "trackeventremoved", onTrackEventRemoved );
      _mediaObject.listen( "trackeventupdated", onTrackEventUpdated );

      Object.defineProperties( this, {
        media: {
          get: function(){ return _mediaObject; },
          enumerable: true,
          configurable: false
        }
      });
      prepare();
    }; //Media

    return Media;

  }); //define
})();
