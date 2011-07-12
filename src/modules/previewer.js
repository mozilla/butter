(function (window, document, undefined, Butter) {

  var popcorn, trackEvents,
    urlRegex, videoURL,
    curWindow, openedWindow,
    layout, DOMDB, iframe,
    popcornString, newScript,
    headID, videoTar;

  Butter.registerModule( "previewer", {

    setup: function() {
      
      urlRegex = /(?:http:\/\/www\.|http:\/\/|www\.|\.|^)(youtu|vimeo|soundcloud|baseplayer)/;
      layout = "../../../layout.html";
      DOMDB = [];

      headID = document.getElementsByTagName( "head" )[ 0 ];         
      newScript = document.createElement( "script" );
      newScript.type = "text/javascript";
      newScript.src = "../../popcorn-complete.min.js";
      headID.appendChild( newScript );

    },

    extend: {

      build: function( target, callback ) {
        
        var that = this,
            targetSrc = document.getElementById( target );

        if ( targetSrc.tagName === "DIV" ) {

          target = document.getElementById( target );

          iframe = document.createElement( "IFRAME" );
          iframe.src = layout;
          iframe.width = target.style.width;
          iframe.height = target.style.height;

          target.appendChild( iframe );

          iframe.addEventListener( "load", function (e) {
            that.scraper( iframe, callback );
            iframe.removeEventListener( "load", function (e) {
              that.scraper( iframe, callback );
            }, false);
          }, false);

        } else if ( targetSrc.tagName === "IFRAME" ) {
          iframe = targetSrc;
          targetSrc.addEventListener( "load", function (e) {
            that.scraper( targetSrc, callback );
            iframe.removeEventListener( "load", function (e) {
              that.scraper( iframe, callback );
            }, false);
          }, false);
        }
      },

      getDOMDB: function() {
        return DOMDB;
      },

      scraper: function( iframe, callback ) {

        var body = iframe.contentWindow.document.getElementsByTagName( "BODY" );

        var ensureLoaded = function() {

          if ( body.length < 1 ) {
            setTimeout( function() {
              ensureLoaded();
            }, 5 );      
          } else {
            ok( body[ 0 ].children );
            callback();
          }
        }

        ensureLoaded();

        function ok( children ) {

          for( var i = 0; i < children.length; i++ ) {
                        
            children[ i ].addEventListener( "mouseover", function ( e ) {
              this.oldColor = this.style.backgroundColor;
              this.style.backgroundColor = "#EEB4B4";
            }, false );

            children[ i ].addEventListener( "mouseout", function ( e ) {
              this.style.backgroundColor = this.oldColor;
            }, false );

            DOMDB.push( children[ i ].id );

            if ( children[ i ].children.length > 0 ) {

              ok ( children[ i ].children );
            }
          }
        }

      },

      buildPopcorn: function( videoTarget ) {
        
        videoTar = videoTarget;
        videoURL = this.getMedia();
        console.log("ASDADS");
        popcornString = "document.addEventListener('DOMContentLoaded', function () {\n";        

        var regexResult = urlRegex.exec( videoURL ) || "";     

        if ( !regexResult[ 1 ] ) {
          
          var src = document.createElement( "source" );
          src.src = videoURL;

          iframe.contentWindow.document.getElementById( videoTarget ).appendChild( src );
          console.log(src);
          console.log( iframe.contentWindow.document.getElementById( videoTarget ) );

          var vidId = "#" + videoTarget;          

          popcornString += "popcorn = Popcorn( '" + vidId + "');\n";

        } else if ( regexResult[ 1 ] === "vimeo" ) {
          popcornString += "popcorn = Popcorn( Popcorn.vimeo( '" + videoTarget + "', '" + videoURL + "', {\n" +
            "css: {\n" +
              "width: '430px',\n" +
              "height: '300px'\n" +
            "}\n" +
          "} ) );\n";
        }
        else if ( regexResult[ 1 ] === "youtu" ) {
          console.log(videoTarget);
          popcornString += "popcorn = Popcorn( Popcorn.youtube( '" + videoTarget + "', '" + videoURL + "', {\n" + 
            "width: 430, height: 300\n" + 
          "} ) );\n";
        }
        else if ( regexResult[ 1 ] === "soundcloud" ) {
          popcornString += "popcorn = Popcorn( Popcorn.soundcloud( '" + videoTarget + "', '" + videoURL + "' ) );\n";
        }
        else if ( regexResult[ 1 ] === "baseplayer" ) {
          popcornString += "popcorn = Popcorn( Popcorn.baseplayer( '" + videoTarget + "' ) );\n";
        }

        if ( trackEvents ) {
          for ( var k = 0; k < trackEvents.length; k++ ) {

            var options = trackEvents[ k ]._natives.manifest.options;
            popcornString += " popcorn." + trackEvents[ k ]._natives.type + "({\n"; 

            for (item in options ) {
              if ( options.hasOwnProperty( item ) ) {

                popcornString += item + ": '" + trackEvents[ k ][ item ] + "',\n";
              }
            }
            console.log(popcornString);
            popcornString += "});";
          }
        }
        
        this.fillIframe();
      },
    
      fillIframe: function() {
    
        var popcornScript, iframeHead, iframeBody,
            that = this;

        popcornString += "}, false);";      


        iframe.contentWindow.document.head.appendChild( newScript );
        popcornScript = iframe.contentWindow.document.createElement( "script" );
        popcornScript.innerHTML = popcornString;
        iframe.contentWindow.document.head.appendChild( popcornScript );
        
        iframeHead = "<head><script src='http://popcornjs.org/code/dist/popcorn-complete.min.js'></script><script>\n" +
          popcornString +
          "</script></head>\n";
        iframeBody =  "<body>" + iframe.contentWindow.document.body.innerHTML + "</body>\n";
        
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write("<html>\n" + iframeHead + iframeBody + "\n</html>");
      
        iframe.contentWindow.document.close();

        this.listen( "trackeventadded", function(e) {
          var popcornReady = function( e ) {
            
            popcorn = iframe.contentWindow.popcorn;
            if ( !popcorn ) {
              setTimeout( function() {
                popcornReady( e );
              }, 10 );
            } else {
              
              popcorn[ e.type ]( e.popcornEvent );
              //iframe.contentWindow.popcorn.video.currentTime += 0.0001;
              //iframe.contentWindow.popcorn[ e.type ]( e.popcornEvent );

              console.log( e );
              trackEvents = popcorn.getTrackEvents();
              //that.buildPopcorn( videoTar );
            }
          }

          popcornReady( e );
        } );

      }
    },
    
  });
})(window, document, undefined, Butter);
