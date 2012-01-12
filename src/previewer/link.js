(function() {
  define( [ "core/logger", "core/eventmanager", "comm/comm" ], function( Logger, EventManager, Comm ) {
    var Link = function( options ) {
      var medias = {},
          originalBody, originalHead,
          currentMedia, popcornScript,
          popcornUrl = options.popcornUrl || "http://popcornjs.org/code/dist/popcorn-complete.js",
          exportBaseUrl = options.exportBaseUrl,
          defaultMedia = options.defaultMedia,
          importData = options.importData,
          that = this,
          linkType = options.type || "basic",
          comm = new Comm.CommClient( "link" ),
          mediaHandlers = {};

      this.addMediaHandlers = function( options ) {
        for ( var name in options ) {
          if ( options.hasOwnProperty( name ) ) {
            mediaHandlers[ name ] = options[ name ];
            comm.listen( name, mediaHandlers[ name ] );
          } //if
        } //for
      }; //addMediaHandlers

      this.removeMediaHandlers = function() {
        for ( var name in mediaHandlers ) {
          if ( mediaHandlers.hasOwnProperty( name ) ) {
            comm.unlisten( name, mediaHandlers[ name ] );
            delete mediaHandlers[ name ];
          } //if
        } //for
      }; //removeMediaHandlers

      this.setupPopcornHandlers = function() {
        currentMedia.popcorn.media.addEventListener( "timeupdate", function() {
          comm.send( currentMedia.popcorn.media.currentTime, "mediatimeupdate" );                
        },false);
        currentMedia.popcorn.media.addEventListener( "pause", function() {
          comm.send( "paused", "log" );
          comm.send( currentMedia.id, "mediapaused" );
        }, false);
        currentMedia.popcorn.media.addEventListener( "playing", function() {
          comm.send( "playing", "log" );
          comm.send( currentMedia.id, "mediaplaying" );
        }, false);
      }; //setupPopcornHandlers

      var mediaChangedHandler = options.onmediachanged || function() {},
          mediaAddedHandler = options.onmediaadded || function() {},
          mediaTimeUpdateHandler = options.onmediatimeupdate || function() {},
          mediaContentChangedHandler = options.onmediacontentchanged || function() {},
          mediaRemovedHandler = options.onmediaremoved || function() {},
          fetchHTMLHandler = options.onfetchhtml || function() {};

      comm.listen( "mediachanged", mediaChangedHandler );
      comm.listen( "mediaadded", mediaAddedHandler );
      comm.listen( "mediaremoved", mediaRemovedHandler );
      comm.listen( "mediatimeupdate", mediaTimeUpdateHandler );
      comm.listen( "mediacontentchanged", mediaContentChangedHandler );

      comm.listen( "destroy", function( e ) {
        for ( var m in medias ) {
          if ( medias.hasOwnProperty( m ) ) {
            medias[ m ].interruptLoad();
          } //if
        } //for 
      });

      comm.listen( "waitformedia", function( e ) {
        var media = medias[ e.data ];
        if ( media ) {
          media.waitForMedia();
        } //if
      });

      comm.returnAsync( "linktype", function() {
        return linkType;
      });

      comm.returnAsync( 'html', fetchHTMLHandler );

      Object.defineProperty( this, "comm", {
        get: function() {
          return comm;
        }
      });

      function concatNodeLists( list1, list2 ) {
        var array1 = Array.prototype.slice.call( list1 ),
            array2 = Array.prototype.slice.call( list2 );

        return array1.concat( array2 );
      } //concatNodeLists

      this.getHTML = function( projectData, baseUrl ) {
        
        baseUrl = baseUrl || exportBaseUrl;

        var html = document.createElement( "html" ),
            head = originalHead.cloneNode( true ),
            body = originalBody.cloneNode( true );

        if ( typeof projectData === "object" ) {
          projectData = JSON.stringify( projectData );
        } //if

        var originalScripts = concatNodeLists( originalHead.getElementsByTagName( "script" ), originalBody.getElementsByTagName( "script" ) );
        function isInOriginals( script ) {
          for ( var i=0, l=originalScripts.length; i<l; ++i ) {
            if ( originalScripts[ i ].src === script.src ) {
              return true;
            } //if
          } //for
          return false;
        } //checkInOriginals

        var scripts = concatNodeLists( body.getElementsByTagName( "script" ), head.getElementsByTagName( "script" ) ),
            projectScript;
        for ( var i=scripts.length-1; i>0; --i ) {
          var script = scripts[ i ];

          if ( script.getAttribute( "data-requirecontext" ) === "butter.previewer" || 
               script.getAttribute( "data-requirebootstrap" ) === "butter.previewer" ) {
            script.parentNode.removeChild( script );
          } //if
        } //for
        for ( var i=0, l=scripts.length; i<l; ++i ) {
          if ( scripts[ i ].getAttribute( "data-butter" ) === "project-data" ) {
            projectScript = scripts[ i ];
            projectScript.innerHTML = projectData;
            break;
          } //if
        } //for

        for ( var media in medias ) {
          if ( medias.hasOwnProperty( media ) ) {
            if ( !projectScript ) {
              var script = document.createElement( "script" );
              script.innerHTML = medias[ media ].generatePopcornString( { method: "event" } );
              head.appendChild( script );
            }
            medias[ media ].alterMediaHTML( body );
          } //if
        } //for

        var baseTag = document.createElement( "base" );
        baseTag.setAttribute( "href", baseUrl );
        if ( head.firstChild ) {
          head.insertBefore( baseTag, head.firstChild );
        }
        else {
          head.appendChild( baseTag );
        } //if

        html.appendChild( head );
        html.appendChild( body );
        return "<!doctype html>\n<html>\n  <head>" + head.innerHTML + "</head>\n  <body>" + body.innerHTML + "</body>\n</html>";
      }; //getHTML

      this.sendMedia = function( media, registry ) {
        comm.send( {
          registry: registry || media.Popcorn.manifest,
          id: media.id,
          duration: media.duration,
        }, "build" );
      }; //sendMedia

      this.sendImportData = function( importData ) {
        comm.send( importData, "importData" );
      }; //sendImportData

      this.scrape = function() {
        comm.send( "Scraping template HTML", "log" );
        function bodyReady() {

          originalBody = document.body.cloneNode( true );
          originalHead = document.head.cloneNode( true );

          var importMedia;
          if ( importData ) {
            importMedia = importData.media;
          } //if

          function scrapeChildren( rootNode ) {

            var children = rootNode.children;

            for( var i=0; i<children.length; i++ ) {

              var thisChild = children[ i ];

              if ( !thisChild ) {
                continue;
              }

              // if DOM element has an data-butter tag that is equal to target or media,
              // add it to butters target list with a respective type
              if ( thisChild.getAttribute ) {
                if( thisChild.getAttribute( "data-butter" ) === "target" ) {
                  comm.send( {
                    name: thisChild.id,
                    type: "target"
                  }, "addtarget" );
                }
                else if( thisChild.getAttribute( "data-butter" ) === "media" ) {
                  if ( ["VIDEO", "AUDIO"].indexOf( thisChild.nodeName ) > -1 ) {

                    var mediaSourceUrl = defaultMedia;
                    //var mediaSourceUrl = thisChild.currentSrc;

                    comm.send({
                      target: thisChild.id,
                      url: mediaSourceUrl,
                    }, "addmedia" );
                  }
                  else {
                    var vidUrl = defaultMedia;

                    if ( thisChild.getAttribute( "data-butter-source" ) ) {
                      vidUrl = thisChild.getAttribute( "data-butter-source" );
                    }

                    if ( importMedia ) {
                      for ( var m=0; m<importMedia.length; ++m ) {
                        if ( thisChild.id === importMedia[ m ].target ) {
                          vidUrl = importMedia[ m ].url;
                        }
                      }
                    }

                    comm.send( {
                      target: thisChild.id,
                      url: vidUrl
                    }, "addmedia" );

                  }
                } // else
              } //if

              if ( thisChild.children && thisChild.children.length > 0 ) {
                scrapeChildren( thisChild );
              } // if
            } // for

          } //scrapeChildren

          scrapeChildren( document.body );
          /*
          if ( importData ) {
            that.importProject( importData );
          }
          */

        } // bodyReady

        var tries = 0;
        function ensureLoaded() {

          function fail() {
            ++tries;
            if ( tries < 10 ) {
              setTimeout( ensureLoaded, 500 );
            }
            else {
              throw new Error("Couldn't load iframe. Tried desperately.");
            }
          } //fail

          var body = document.getElementsByTagName( "BODY" );
          if ( body.length < 1 ) {
            fail();
            return;
          }
          else {
            bodyReady();
            comm.send( { type: linkType }, "loaded" );
          } // else
        } // ensureLoaded

        ensureLoaded();

      }; //scrape

      this.sendTimeoutError = function( media ) {
        comm.send( media.id, "mediatimeout" );
      }; //sendTimeoutError

      this.sendLoadError = function( e ) {
        that.sendError({
          message: "Error loading media.",
          type: "media-loading",
          error: "Error loading media."
        });
      }; //sendLoadError

      this.sendError = function( errorOptions ) {
        comm.send({
          message: errorOptions.message,
          context: errorOptions.context,
          type: errorOptions.type,
          error: JSON.stringify( errorOptions.error || "" )
        }, "error" );
      }; //sendError

      this.cancelMediaTimeout = function() {
        mediaTimeout && clearTimeout( mediaTimeout );
      };

      this.play = function() {
        currentMedia.popcorn.media.play();
      };

      this.isPlaying = function() {
        return currentMedia.popcorn.media.paused;
      };

      this.pause = function() {
        currentMedia.popcorn.media.pause();
      };

      this.mute = function() {
        currentMedia.popcorn.media.muted = !currentMedia.popcorn.media.muted;
      };

      Object.defineProperty( this, "currentMedia", {
        get: function() {
          return currentMedia;
        },
        set: function( val ) {
          currentMedia = val;
        }
      });

      this.getMedia = function( id ) {
        return medias[ id ];
      }; //getMedia

      this.addMedia = function( media ) {
        medias[ media.id ] = media;
      }; //addMedia

      this.removeMedia = function( media ) {
        delete medias[ media.id ];
      };

      comm.send( "setup", "setup" );

    }; //Link

    return Link;

  }); //define
})();
