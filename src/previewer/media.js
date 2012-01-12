(function () {

  var urlRegex = /(?:http:\/\/www\.|http:\/\/|www\.|\.|^)(youtu|vimeo|soundcloud|baseplayer)/;

  define( [ "core/logger", "core/eventmanager" ], function( Logger, EventManager ) {

    var Media = function ( mediaData ) {
      var that = this;
      this.url = mediaData.url;
      this.target = mediaData.target;
      this.id = mediaData.id;
      this.duration = 0;
      this.popcorn = undefined;
      this.type = undefined;
      this.mediaElement = undefined;

      var _interruptLoad = false
          _mediaLoadAttempts = 0;
      this.interruptLoad = function() {
        _interruptLoad = true;
      }; //interrupt

      this.waitForMedia = function() {
        _mediaLoadAttempts = 0;
      }; //waitForMedia

      this.clear = function() {
        that.clearPopcorn();
        that.destroyPopcorn();
        if ( that.target ) {
          document.getElementById( that.target ).innerHTML = "";
        } //if
      }; //clear

      this.prepare = function( prepareOptions ) {
        var onSuccess = prepareOptions.success || function() {},
            onError = prepareOptions.error || function() {},
            onTimeout = prepareOptions.timeout || onError,
            popcornOptions = prepareOptions.popcornOptions;

        function timeoutWrapper( e ) {
          _interruptLoad = true;
          onTimeout( e );
        } //timeoutWrapper

        function failureWrapper( e ) {
          _interruptLoad = true;
          onError( e );
        } //failureWrapper
        
        function popcornSuccess( popcorn ) {
          onSuccess({
            popcorn: popcorn
          });
        } //popcornSuccess

        that.prepareMedia( that.findMediaType(), failureWrapper );
        try {
          that.createPopcorn( that.generatePopcornString( { options: popcornOptions } ) );
          that.waitForPopcorn( popcornSuccess, timeoutWrapper, 100 );
        }
        catch( e ) {
          failureWrapper( e );
        } //try
      }; //prepare

      this.prepareMedia = function( type, onError ) {
        if ( type === "object" ) {
          var mediaElement = document.getElementById( that.target );
          if (  !mediaElement || [ 'AUDIO', 'VIDEO' ].indexOf( mediaElement.nodeName ) === -1 ) {
            var video = document.createElement( "video" ),
                src = document.createElement( "source" );

            src.addEventListener( "error", onError );
            src.src = that.url;
            video.style.width = document.getElementById( that.target ).style.width;
            video.style.height = document.getElementById( that.target ).style.height;
            video.appendChild( src );
            video.controls = true;
            if ( !video.id || video.id === "" ) {
              video.id = "butter-media-element-" + that.id;
            }
            video.setAttribute( "autobuffer", "true" );
            video.setAttribute( "preload", "auto" );

            document.getElementById( that.target ).appendChild( video );
            that.mediaElement = video;
            return video;
          }
          else {
            if ( !mediaElement.id || mediaElement.id === "" ) {
              mediaElement.id = "butter-media-element-" + that.id;
            } //if
            that.mediaElement = mediaElement;
            mediaElement.pause();
            mediaElement.src = "";
            while ( mediaElement.firstChild ) {
              mediaElement.removeChild( mediaElement.firstChild );
            } //while
            mediaElement.removeAttribute( "src" );
            mediaElement.addEventListener( "error", onError );
            mediaElement.src = that.url;
            mediaElement.load();
            //}
            return mediaElement;
          } //if
        }
      }; //prepareMedia

      function findNode( id, rootNode ) {
        var children = rootNode.childNodes;
        for ( var i=0, l=children.length; i<l; ++i ) {
          if ( children[ i ].id === id ) {
            return children [ i ];
          }
          else {
            var node = findNode( id, children[ i ] );
            if ( node ) {
              return node;
            } //if
          } //if
        } //for
      } //findNode

      this.alterMediaHTML = function( rootNode ) {
        var targetElement = findNode( that.target, rootNode );
        if ( that.type === "object" ) {
          var parentNode = targetElement.parentNode,
              newNode = document.getElementById( that.target ).cloneNode( true );
          parentNode.removeChild( targetElement );
          parentNode.appendChild( newNode );
        } //if
      }; //getMediaHTML

      this.findMediaType = function() {
        var regexResult = urlRegex.exec( that.url )
        if ( regexResult ) {
          that.type = regexResult[ 1 ];
        }
        else {
           that.type = "object";
        }
        return that.type;
      }; //findMediaType

      this.generatePopcornString = function( options ) {
        var type = that.type || that.findMediaType();
            popcornString = "";

        options = options || {};

        var popcornOptions = ""
        if ( options.options ) {
          popcornOptions = ", " + JSON.stringify( options.options );
        } //if


        var players = {
          "youtu": function() {
            return "var popcorn = Popcorn.youtube( '" + that.target + "', '" +
              that.url + "'" + popcornOptions + " );\n";
          },
          "vimeo": function() {
            return "var popcorn = Popcorn.vimeo( '" + that.target + "', '" +
            that.url + "'" + popcornOptions + " );\n";
          },
          "soundcloud": function() {
            return "var popcorn = Popcorn( Popcorn.soundcloud( '" + that.target + "'," +
            " '" + that.url + "') );\n";
          },
          "baseplayer": function() {
            return "var popcorn = Popcorn( Popcorn.baseplayer( '#" + that.target + "'" + popcornOptions + " ) );\n";
          },
          "object": function() {
            return "var popcorn = Popcorn( '#" + that.mediaElement.id + "'" + popcornOptions + ");\n";
          }
        };

        // call certain player function depending on the regexResult
        popcornString += players[ type ]();

        if ( that.popcorn ) {
          var trackEvents = that.popcorn.getTrackEvents();
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

        var method = options.method || "inline";

        if ( method === "event" ) {
          popcornString = "\ndocument.addEventListener('DOMContentLoaded',function(e){\n" + popcornString;
          popcornString += "\n},false);";
        }
        else {
          popcornString = popcornString + "\n return popcorn;";
        } //if

        return popcornString;
      }; //generatePopcornString

      this.play = function( message ) {
        that.popcorn.play();
      };

      this.pause = function( message ) {
        that.popcorn.pause();
      };

      this.mute = function( message ) {
        that.popcorn.mute( message );
      };

      this.clearPopcorn = function() {
        if ( that.popcorn ) {
          that.popcorn.destroy();
          that.popcorn = undefined;
        } //if
      }; //clearPopcorn

      this.createPopcorn = function( popcornString ) {
        var popcornFunction = new Function( "", popcornString );
            popcorn = popcornFunction();
        if ( !popcorn ) {
          var popcornScript = that.popcornScript = document.createElement( "script" );
          popcornScript.innerHTML = popcornString;
          document.head.appendChild( popcornScript );
          popcorn = window.Popcorn.instances[ window.Popcorn.instances.length - 1 ];
        }
        that.popcorn = popcorn;
        that.Popcorn = window.Popcorn;
      }; //createPopcorn

      this.destroyPopcorn = function() {
        if ( that.popcornScript ) {
          document.head.removeChild( that.popcornScript );
        }
        that.popcornScript = undefined;
      }; //destroyPopcorn

      this.waitForPopcorn = function( callback, timeoutCallback, tries ) {
        var popcorn = that.popcorn;

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
            if ( that.type === "youtu" ) {
              that.duration = popcorn.duration();
              setTimeout( function() {
                popcorn.pause();
              }, 1000 );
            }
            else if ( that.type === "vimeo" || that.type === "soundcloud" ) {
              that.duration = popcorn.duration();
            }
            else {
              that.duration = popcorn.media.duration;
            } //if
            callback( popcorn );
          } else {
            setTimeout( checkMedia, 100 );
          } //if
        }
        checkMedia();
      }; //waitForPopcorn

    }; //Media

    return Media;

  }); //define

})();
