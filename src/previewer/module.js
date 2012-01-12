(function() {

  define( [ "core/logger", "core/eventmanager", "comm/comm" ], function( Logger, EventManager, Comm ) {

    var Previewer = function( butter, options ) {

      var id = "Previewer" + Previewer.guid++,
          logger = new Logger( id ),
          defaultExportBaseUrl = options.exportBaseUrl;

      var popcornUrl = options.popcornUrl || "http://popcornjs.org/code/dist/popcorn-complete.js";

      var target = document.getElementById( options.target );
      if ( !target ) {
        logger.error( "Previewer target, " + options.target + " does not exist");
      }

      var Preview = function( options ) {

        var that = this,
            link,
            previewIframe,
            defaultMedia = options.defaultMedia,
            importData = options.importData,
            onload = options.onload,
            onfail = options.onfail,
            exportBaseUrl = options.exportBaseUrl || defaultExportBaseUrl,
            id = "Preview" + Preview.guid++,
            logger = new Logger( id );

        logger.log( "Starting" );

        function PreviewerLink( options ) {
          var isPlaying = false,
              linkType,
              currentTime,
              server = new Comm.CommServer(),
              that = this;

          function onMediaAdded( e ) {
            logger.log( "Sending mediaadded" );
            var mediaExport = e.data.json;
            server.send( "link", mediaExport, "mediaadded" );
          }
          function onMediaChanged( e ) {
            logger.log( "Sending mediachanged" );
            var mediaExport = e.data.json;
            server.send( "link", mediaExport, "mediachanged" );
          }
          function onMediaRemoved( e ) {
            logger.log( "Sending mediaremoved" );
            var mediaExport = e.data.json;
            server.send( "link", mediaExport, "mediaremoved" );
          }
          function onMediaTimeUpdate( e ) {
            if ( e.data.currentTime !== currentTime ) {
              //logger.log( "Sending mediatimeupdate: " + currentTime + ", " + e.data.currentTime );
              server.send( "link", e.data.currentTime, "mediatimeupdate" );
            } //if
          }
          function onMediaContentChanged( e ) {
            logger.log( "Sending mediacontentchanged" );
            function changeComplete( ev ) {
              server.unlisten( "link", "mediacontentchanged", changeComplete );
              butter.dispatch( "mediacontentchangecomplete", e.data.url );
            }
            server.listen( "link", "mediacontentchanged", changeComplete );
            server.send( "link", e.data.url, "mediacontentchanged" );
          }
          function onTrackEventAdded( e ) {
            logger.log( "Sending trackeventadded" );
            var trackEventExport = e.data.json;
            server.send( "link", trackEventExport, "trackeventadded" );
          }
          function onTrackEventRemoved( e ) {
            logger.log( "Sending trackeventremoved" );
            var trackEventExport = e.data.json;
            server.send( "link", trackEventExport, "trackeventremoved" );
          }
          function onTrackEventUpdated( e ) {
            logger.log( "Sending trackeventupdated" );
            var trackEventExport = e.data.json;
            server.send( "link", trackEventExport, "trackeventupdated" );
          }

          function setup( iframeWindow ) {
            server.bindClientWindow( "link", iframeWindow, function( message ) {
            });

            that.play = function() {
              logger.log( 'Playing' );
              server.send( "link", "play", "play" );
            }; //play

            Object.defineProperty( that, "playing", {
              get: function() {
                return isPlaying;
              }
            });

            that.pause = function() {
              logger.log( 'Pausing' );
              server.send( "link", "pause", "pause" );
            }; //pause

            that.mute = function() {
              logger.log( 'Muting' );
              server.send( "link", "mute", "mute" );
            }; //mute

            server.listen( "link", "error", function( e ) {
              if ( e.data.type === "media-loading" ) {
                butter.dispatch( "previewerfail" );
                onfail && onfail( that );
              } else {
                butter.dispatch( { data: {} }, "error" );
              }
            });

            server.listen( "link", "mediatimeout", function( e ) {
              butter.dispatch( "previewertimeout", {
                preview: that,
                media: butter.getMedia( { id: e.data } )
              });
            });

            server.listen( "link", "loaded", function( e ) {
              var numMedia = butter.media.length, numReady = 0;
              linkType = e.data.type;
              logger.log( 'Loaded; waiting for ' + numMedia + ' media' );
              butter.dispatch( "previewloaded", null );

              server.listen( "link", "build", function( e ) {
                var media = butter.getMedia( { id: e.data.id } );
                if ( media ) {
                  logger.log( 'Media '+ media.id + ' built' );
                  media.registry = e.data.registry;
                  media.duration = e.data.duration;
                  butter.dispatch( "mediaready", media, "previewer" );
                } //if
                ++numReady;
                if ( numMedia === numReady ) {
                  if ( importData ) {
                    butter.importProject( importData );
                  } //if
                  butter.dispatch( "previewready", that );
                  server.send( "link", "cancelmediatimeout", "cancelmediatimeout" );
                  onload && onload( that );
                } //if
              });
            });

            server.listen( "link", "mediapaused", function( e ) {
              logger.log( "Received mediapaused" );
              isPlaying = false;
              butter.dispatch( "mediapaused", butter.getMedia( { id: e.data } ), "previewer" );
            });
            server.listen( "link", "mediaplaying", function( e ) {
              logger.log( "Received mediaplaying" );
              isPlaying = true;
              butter.dispatch( "mediaplaying", butter.getMedia( { id: e.data } ), "previewer" );
            });
            server.listen( "link", "mediatimeupdate", function( e ) {
              currentTime = e.data;
              //logger.log( "Received mediatimeupdate: " + currentTime );
              butter.currentTime = currentTime;
            });

            server.listen( "link", "addmedia", function( e ) {
              logger.log( "Received addmedia request" );
              var media = butter.addMedia( e.data );
            });
            server.listen( "link", "addtarget", function( e ) {
              logger.log( "Received addtarget request" );
              var target = butter.addTarget( e.data );
            });

            butter.listen( "mediaadded", onMediaAdded );
            butter.listen( "mediachanged", onMediaChanged );
            butter.listen( "mediaremoved", onMediaRemoved );
            butter.listen( "mediatimeupdate", onMediaTimeUpdate, "timeline" );
            butter.listen( "mediacontentchanged", onMediaContentChanged );
            butter.listen( "trackeventadded", onTrackEventAdded );
            butter.listen( "trackeventremoved", onTrackEventRemoved );
            butter.listen( "trackeventupdated", onTrackEventUpdated );

            server.listen( "link", "importData", function( e ) {
              if ( !importData && e.data ) {
                logger.log( "Received import data from preview", e.data );
                importData = e.data;
              } //if
            });

            server.listen( "link", "log", function( e ) {
              logger.log( e.data );
            });
          } //setup

          var iframeWindow = previewIframe.contentWindow || previewIframe.contentDocument;
          setup( iframeWindow );

          // Ugly hack to continue bootstrapping until Butter script is *actually* loaded.
          // Impossible to really tell when <script> has loaded (security).
          logger.log( "Bootstrapping" );
          var setupInterval;
          function sendSetup() {
            server.send( "link", {
              defaultMedia: defaultMedia,
              importData: importData,
              exportBaseUrl: exportBaseUrl
            }, "setup" );
          } //sendSetup
          server.listen( "link", "setup", function( e ) {
            clearInterval( setupInterval );
          });
          setupInterval = setInterval( sendSetup, 500 );

          this.fetchHTML = function( callback ) {
            logger.log( "Fetching HTML" );
            var data = butter.exportProject();
            server.async( "link", data, "html", function( e ) {
              logger.log( "Receiving HTML" );
              callback( e.data );
            });
          }; //fetchHTML

          this.destroy = function() {
            server.send( "link", null, "destroy" );
            server.destroy();
            butter.unlisten( "mediaadded", onMediaAdded );
            butter.unlisten( "mediachanged", onMediaChanged );
            butter.unlisten( "mediaremoved", onMediaRemoved );
            butter.unlisten( "mediatimeupdate", onMediaTimeUpdate, "timeline" );
            butter.unlisten( "mediacontentchanged", onMediaContentChanged );
            butter.unlisten( "trackeventadded", onTrackEventAdded );
            butter.unlisten( "trackeventremoved", onTrackEventRemoved );
            butter.unlisten( "trackeventupdated", onTrackEventUpdated );
          }; //destroy

          this.waitForMedia = function( media ) {
            server.send( "link", media.id, "waitformedia" );
          }; //waitForMedia

          Object.defineProperty( this, "type", {
            get: function() { return linkType; }
          });

        } //PreviewerLink

        function loadIframe( iframe, template ) {
          previewIframe = iframe;
          logger.log( "Starting IFRAME: " + iframe.src );
          function onLoad( e ) {
            logger.log( "IFRAME Loaded: " + iframe.src );
            link = new PreviewerLink({
            });
            iframe.removeEventListener( "load", onLoad, false );
          } //onLoad
          iframe.addEventListener( "load", onLoad, false );
        } //loadIfram

        if ( target.tagName === "DIV" ) {
          logger.log( "Found DIV; Creating IFRAME" );
          var rect = target.getClientRects()[ 0 ];
          var iframe = document.createElement( "IFRAME" );
          iframe.width = rect.width;
          iframe.height = rect.height;
          loadIframe( iframe, options.template );
          target.appendChild( iframe );
          iframe.src = options.template;
        }
        else if ( target.tagName === "IFRAME" ) {
          logger.log( "Found IFRAME" );
          loadIframe( target, options.template );
          target.src = options.template;
        } // else

        Object.defineProperty( this, "properties", {
          get: function() {
            return {
              target: link.target,
              template: link.template,
            };
          }
        });

        this.fetchHTML = function( callback ) {
          link.fetchHTML( callback );
        }; //fetchHTML

        Object.defineProperty( this, "playing", {
          get: function() {
            return link.playing;
          },
          set: function( val ) {
            if ( val ) {
              link.play();
            }
            else {
              link.pause();
            }
          }
        }); //playing

        this.play = function() {
          link.play();
        }; //play

        this.pause = function() {
          link.pause();
        }; //pause

        this.mute = function() {
          link.mute();
        }; //mute

        this.destroy = function() {
          link.destroy();
          if ( previewIframe ) {
            previewIframe.setAttribute( "src", "about:blank" );
          }
        }; //destroy

        this.waitForMedia = function( media ) {
          link.waitForMedia( media );
        }; //waitForMedia

        Object.defineProperty( this, "type", {
          get: function() { return link.type; }
        });

      }; //Preview
      Preview.guid = 0;

      this.Preview = Preview;

    }; //Previewer
    Previewer.guid = 0;

    return {
      name: "previewer",
      init: function( butter, options ) {
        return new Previewer( butter, options );
      } //init
    };

  }); //define

})();

